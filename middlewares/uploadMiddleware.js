// middlewares/upload.js - BUFFER VERSİYASI
import multer from 'multer';

// ✅ YENİ: Memory Storage - Faylları diskə YOX, memory-də saxlayırıq
const memoryStorage = multer.memoryStorage();

// ✅ YENİ: Genişləndirilmiş fayl filteri
const extendedFileFilter = (req, file, cb) => {
  const allowedTypes = {
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/pdf': true,
    'text/csv': true,
    // Şəkil formatları
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    // Digər sənəd formatları
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü. İcazə verilən fayl növləri: Excel, PDF, CSV, Şəkil, Word, PowerPoint'), false);
  }
};

// ✅ YENİ: BÜTÜN MULTER INSTANCES MEMORY STORAGE İSTİFADƏ EDİR
export const uploadDocuments = multer({
  storage: memoryStorage, // ✅ DiskStorage əvəzinə MemoryStorage
  fileFilter: extendedFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadExcel = multer({
  storage: memoryStorage, // ✅ DiskStorage əvəzinə MemoryStorage
  fileFilter: extendedFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadPdf = multer({
  storage: memoryStorage, // ✅ DiskStorage əvəzinə MemoryStorage
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Yalnız PDF faylları yükləyə bilərsiniz'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware (eynı qalır)
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Fayl həcmi çox böyükdür. Maksimum ölçü: 10MB'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Gözlənilməz fayl sahəsi'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    error: error.message
  });
};