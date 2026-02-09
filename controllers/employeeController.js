// controllers/employeeController.js
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import taxCalculationService from "../services/taxCalculationService.js";
import multer from 'multer';
import excel from 'exceljs';


// ✅ Yeni işçi yarat (AVTOMATİK VERGİ İLƏ)
// ✅ CREATE EMPLOYEE - FormData qəbul edən versiya
export const createEmployee = async (req, res) => {
  try {
    console.log('📨 CREATE EMPLOYEE REQUEST');
    console.log('📝 Content-Type:', req.headers['content-type']);
    console.log('📦 Request body fields:', Object.keys(req.body || {}));
    
    // FormData'dan gələn məlumatları al
    const employeeData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      position: req.body.position,
      Department: req.body.Department,
      gross: req.body.gross ? parseFloat(req.body.gross) : 0,
      hireDate: req.body.hireDate || new Date(),
      phone: req.body.phone,
      tin: req.body.tin,
      idSerialNumber: req.body.idSerialNumber,
      employeeType: req.body.employeeType || 'private',
      companyId: req.body.companyId || (req.user ? req.user._id : null)
    };

    console.log('💰 Gross dəyəri (frontend\'den):', employeeData.gross);
    console.log('📊 Employee data:', employeeData);

    // Validation - tələb olunan field'ları yoxla
    if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
      return res.status(400).json({ 
        success: false,
        message: "Ad, soyad və email tələb olunur" 
      });
    }

    // Email'un unique olub-olmadığını yoxla
    const existingEmployee = await Employee.findOne({ 
      email: employeeData.email.trim().toLowerCase()
    });
    
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Bu email artıq istifadə olunur'
      });
    }



    // File upload varsa
    if (req.file) {
      console.log('📎 Fayl yükləndi:', req.file.originalname);
      employeeData.filename = req.file.fieldname || 'file';
      employeeData.contentType = req.file.mimetype;
      employeeData.data = req.file.buffer;
      employeeData.fileSize = req.file.size;
      employeeData.originalName = req.file.originalname;
    }

    // İşçi yarat (middleware avtomatik vergiləri hesablayacaq)
    const employee = await Employee.create(employeeData);
    
    console.log('✅ Employee yaradıldı:', employee._id);
    
    res.status(201).json({
      success: true,
      data: employee,
      message: employeeData.gross 
        ? 'İşçi yaradıldı. Vergilər avtomatik hesablandı.' 
        : 'İşçi yaradıldı.'
    });
  } catch (error) {
    console.error('❌ CREATE EMPLOYEE ERROR:', error);
    
    // Validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    // Duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu email artıq istifadə olunub'
      });
    }
    
    // Generic error
    res.status(500).json({ 
      success: false,
      message: error.message || 'İşçi yaradılarkən xəta baş verdi'
    });
  }
};

// ✅ UPLOAD FILE FOR EMPLOYEE - Təkmilləşdirilmiş
export const uploadEmployeeFile = async (req, res) => {
  try {
    console.log('📤 UPLOAD FILE REQUEST');
    console.log('👤 Employee ID:', req.params.id);
    console.log('📎 File info:', req.file ? req.file.originalname : 'No file');
    
    // Fayl yoxlanışı
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Fayl seçilməyib" 
      });
    }

    // İşçini tap
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // Fayl məlumatlarını yenilə
    employee.filename = req.file.fieldname || 'file';
    employee.contentType = req.file.mimetype;
    employee.data = req.file.buffer;
    employee.fileSize = req.file.size;
    employee.originalName = req.file.originalname;

    await employee.save();

    console.log('✅ Fayl yükləndi:', req.file.originalname);

    res.json({
      success: true,
      message: "Fayl uğurla yükləndi",
      data: {
        filename: employee.filename,
        originalName: employee.originalName,
        contentType: employee.contentType,
        fileSize: employee.fileSize,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('❌ UPLOAD FILE ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Fayl yüklənərkən xəta baş verdi'
    });
  }
};

// ✅ Bütün işçiləri getir - Təkmilləşdirilmiş
export const getAllEmployees = async (req, res) => {
  try {
    console.log('📋 GET ALL EMPLOYEES REQUEST');
    
    const { companyId, employeeType, department, salary_status, status } = req.query;
    let filter = {};
    
    // Company filter
    if (companyId) {
      filter.companyId = companyId;
    } else if (req.user && req.user._id) {
      filter.companyId = req.user._id; // Default olaraq current user'ın companyId'si
    }
    
    // Digər filter'lar
    if (employeeType) filter.employeeType = employeeType;
    if (department) filter.Department = department;
    if (salary_status) filter.salary_status = salary_status;
    if (status) filter.status = status;
    else filter.status = 'active'; // Default olaraq aktiv işçilər

    console.log('🔍 Filter criteria:', filter);

    const employees = await Employee.find(filter)
      .select("-data") // Fayl məlumatlarını göndərmə
      .sort({ createdAt: -1 });
    
    console.log('✅ Employees found:', employees.length);
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    console.error('❌ GET ALL EMPLOYEES ERROR:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};


// ✅ Fayl yüklə
// controllers/employeeController.js - DÜZELTİLMİŞ VERSİYON

// ✅ Fayl yüklə (download)
export const downloadEmployeeFile = async (req, res) => {
  try {
    console.log(`📥 Download request for employee: ${req.params.id}`);
    
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      console.log(`❌ Employee not found: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    if (!employee.data) {
      console.log(`❌ No file data for employee: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: "Fayl tapılmadı" 
      });
    }

    // Debug bilgileri
    console.log(`📄 File info:`);
    console.log(`  - Filename: ${employee.filename || 'N/A'}`);
    console.log(`  - Original Name: ${employee.originalName || 'N/A'}`);
    console.log(`  - Content Type: ${employee.contentType || 'N/A'}`);
    console.log(`  - File Size: ${employee.data.length} bytes`);
    console.log(`  - Buffer type: ${employee.data.constructor.name}`);

    // Buffer'ı kontrol et
    if (!Buffer.isBuffer(employee.data)) {
      console.log(`❌ Data is not a Buffer: ${typeof employee.data}`);
      return res.status(500).json({ 
        success: false,
        message: "Fayl formatı düzgün deyil" 
      });
    }

    if (employee.data.length === 0) {
      console.log(`❌ Buffer is empty`);
      return res.status(500).json({ 
        success: false,
        message: "Fayl boşdur" 
      });
    }

    // Dosya adını hazırla
    const filename = employee.originalName || 
                    employee.filename || 
                    `file_${employee._id}.${getFileExtension(employee.contentType)}`;
    
    // Header'ları ayarla
    res.set({
      "Content-Type": employee.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": employee.data.length,
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    
    console.log(`✅ Sending file: ${filename}, size: ${employee.data.length} bytes`);
    
    // Buffer'ı gönder
    res.send(employee.data);
    
  } catch (error) {
    console.error(`❌ Download error for ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: "Fayl yüklənərkən xəta baş verdi: " + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function: ContentType'dan dosya uzantısı al
function getFileExtension(contentType) {
  if (!contentType) return 'bin';
  
  const extensions = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  };
  
  return extensions[contentType] || 'bin';
}
// ✅ Fayl göstər


// Multer konfiqurasiyası (memory storage istifadə edirik)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Fayl tipini yoxlaya bilərsiniz (isteğe bağlı)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Destəklənməyən fayl formatı'), false);
    }
  }
});

// ✅ İŞÇİYƏ FAYL YÜKLƏMƏ FUNKSİYASI


// ✅ İŞÇİNİN FAYLINI GÖSTƏRƏN FUNKSİYA (Sizin hazır kodu)
export const viewEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || !employee.data) {
      return res.status(404).json({ 
        success: false,
        message: "Fayl tapılmadı" 
      });
    }

    res.set("Content-Type", employee.contentType);
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İŞÇİNİN FAYL MƏLUMATLARINI SİLƏN FUNKSİYA
// controllers/employeeController.js

// ✅ İŞÇİNİN FAYL MƏLUMATLARINI SİLƏN FUNKSİYA (DÜZELTİLMİŞ)
export const deleteEmployeeFile = async (req, res) => {
  try {
    const result = await Employee.updateOne(
      { _id: req.params.id },
      {
        $unset: {
          filename: "",
          contentType: "",
          data: "",
          fileSize: "",
          originalName: ""
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    if (result.modifiedCount === 0) {
      return res.json({
        success: true,
        message: "Fayl məlumatları artıq silinmiş"
      });
    }

    res.json({
      success: true,
      message: "Fayl uğurla silindi"
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ✅ ID ilə işçi getir
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-data");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi məlumatlarını yenilə (AVTOMATİK VERGİ İLƏ)
export const updateEmployee = async (req, res) => {
  try {
    const updateData = req.body;

    if (req.file) {
      updateData.filename = req.file.originalname;
      updateData.contentType = req.file.mimetype;
      updateData.data = req.file.buffer;
      updateData.originalName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }



    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: updateData.gross 
        ? 'İşçi yeniləndi. Vergilər avtomatik hesablandı.' 
        : 'İşçi yeniləndi.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçini sil
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }
    res.json({ 
      success: true,
      message: "İşçi silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 💰 VERGİ VƏ ÖDƏNİŞ FUNKSİYALARI =====================

// ✅ İşçi növünü yenilə (AVTOMATİK VERGİ İLƏ)
export const updateEmployeeType = async (req, res) => {
  try {
    const { employeeType } = req.body;

    if (!['state', 'private'].includes(employeeType)) {
      return res.status(400).json({ 
        success: false,
        message: "İşçi növü yalnız 'state' və ya 'private' ola bilər" 
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { employeeType },
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'İşçi növü və vergilər yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi ödənişlərini gətir
export const getEmployeePayments = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("paymentHistory taxPaymentHistory lastPaymentDate nextPaymentDate");
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: {
        payment_history: employee.paymentHistory,
        tax_payment_history: employee.taxPaymentHistory,
        last_payment_date: employee.lastPaymentDate,
        next_payment_date: employee.nextPaymentDate
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi ödənişi əlavə et
export const addEmployeePayment = async (req, res) => {
  try {
    const { 
      paymentType, 
      amount, 
      paymentDate, 
      forMonth, 
      description, 
      taxDetails 
    } = req.body;

    // Gerekli alan kontrolü
    if (!paymentType || !amount || !paymentDate || !forMonth) {
      return res.status(400).json({ 
        success: false,
        message: "paymentType, amount, paymentDate, forMonth alanları gereklidir" 
      });
    }

    const newPayment = {
      paymentType,
      amount,
      paymentDate: new Date(paymentDate),
      forMonth: new Date(forMonth),
      description: description || '',
      taxDetails: taxDetails || {},
      status: 'completed'
    };

    // Tarihleri hesapla
    const lastPaymentDate = new Date(paymentDate);
    const nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    // Direkt update ile payment ekle
    const result = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          paymentHistory: newPayment
        },
        $set: {
          lastPaymentDate: lastPaymentDate,
          nextPaymentDate: nextPaymentDate,
          salary_status: 'paid'
        }
      },
      {
        new: true, // Güncellenmiş dokümanı döndür
        runValidators: false, // ⭐ Validation'ı atla
        select: 'firstName lastName paymentHistory lastPaymentDate nextPaymentDate salary_status'
      }
    );

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: "Ödəniş əlavə edildi",
        employee: {
          id: result._id,
          name: `${result.firstName} ${result.lastName}`,
          paymentCount: result.paymentHistory.length
        },
        payment: newPayment,
        last_payment_date: result.lastPaymentDate,
        next_payment_date: result.nextPaymentDate,
        salary_status: result.salary_status
      }
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ 
      success: false,
      message: "Ödəniş əlavə edilərkən xəta baş verdi: " + error.message 
    });
  }
};

// ✅ İşçi vergi məlumatlarını yenilə (AVTOMATİK)
export const updateEmployeeTaxData = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;



    const updateData = {};
    if (gross !== undefined) updateData.gross = gross;
    if (employeeType) updateData.employeeType = employeeType;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Vergi məlumatları yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi vergilərini hesabla (demo üçün)
export const calculateEmployeeTaxes = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;



    const taxResult = taxCalculationService.calculateAllTaxes(
      gross, 
      employeeType || 'private'
    );

    res.json({
      success: true,
      data: taxResult
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 💰 MAAŞ FUNKSİYALARI =====================

// ✅ Maaş məlumatlarını yenilə (AVTOMATİK VERGİ İLƏ)
export const updateSalary = async (req, res) => {
  try {
    const { gross, employeeType, salary_status } = req.body;



    const updateData = {};
    if (gross !== undefined) updateData.gross = gross;
    if (employeeType) updateData.employeeType = employeeType;
    if (salary_status) updateData.salary_status = salary_status;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Maaş məlumatları yeniləndi. Vergilər avtomatik hesablandı.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 🔔 NOTIFICATION FUNKSİYALARI =====================

// ✅ Bütün notificationları getir
export const getNotifications = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("Recent_Notifications");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.Recent_Notifications,
      count: employee.Recent_Notifications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Xüsusi notificationu getir
export const getNotificationById = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const notification = employee.Recent_Notifications.find(
      notif => notif._id.toString() === notificationId
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Bildiriş tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification əlavə et
// controllers/employeeController.js

// ✅ Notification əlavə et (DÜZELTİLMİŞ)
export const addNotification = async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: "Message sahəsi mütləqdir" 
      });
    }

    const validTypes = ["info", "warning", "success", "error"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: "Type yalnız 'info', 'warning', 'success', 'error' ola bilər" 
      });
    }

    const newNotification = {
      _id: new mongoose.Types.ObjectId(),
      message: message,
      type: type,
      isRead: false,
      createdAt: new Date()
    };

    // findByIdAndUpdate kullan
    const result = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          Recent_Notifications: newNotification
        }
      },
      { 
        new: true,
        runValidators: false, // ⭐ Validation'ı atla
        select: 'firstName lastName Recent_Notifications'
      }
    );

    if (!result) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: result._id,
          name: `${result.firstName} ${result.lastName}`
        },
        notification: newNotification,
        totalNotifications: result.Recent_Notifications.length
      },
      message: 'Bildiriş əlavə edildi'
    });
  } catch (error) {
    console.error('Add notification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification yenilə
// ✅ Notification yenilə (TAM DÜZELTİLMİŞ)
// ✅ Notification yenilə (Alternatif çözüm)
// ✅ Notification yenilə (TAM ÇALIŞAN VERSİYON)
// ✅ Notification yenilə (GÜVENLİ VERSİYON)
export const updateNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;
    const { isRead, message, type } = req.body;

    console.log('🔔 Update Notification Request:', {
      employeeId: id,
      notificationId: notificationId,
      isRead: isRead
    });

    // 1. Employee'yi bul
    const employee = await Employee.findById(id);
    if (!employee) {
      console.log('❌ Employee not found:', id);
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // 2. Recent_Notifications kontrolü
    if (!employee.Recent_Notifications || !Array.isArray(employee.Recent_Notifications)) {
      console.log('❌ Recent_Notifications is not an array or undefined');
      return res.status(404).json({ 
        success: false,
        message: "Bildirişlər tapılmadı" 
      });
    }

    console.log(`📊 Employee has ${employee.Recent_Notifications.length} notifications`);

    // 3. Notification'ı GÜVENLİ şekilde bul
    let notificationToUpdate = null;
    let notificationIndex = -1;

    for (let i = 0; i < employee.Recent_Notifications.length; i++) {
      const notif = employee.Recent_Notifications[i];
      
      // _id'nin varlığını kontrol et
      if (!notif || !notif._id) {
        console.log(`⚠️ Notification at index ${i} has no _id field`);
        continue;
      }

      // _id'nin toString() methodu var mı kontrol et
      try {
        const notifIdString = notif._id.toString ? notif._id.toString() : String(notif._id);
        
        if (notifIdString === notificationId) {
          notificationToUpdate = notif;
          notificationIndex = i;
          console.log(`✅ Found notification at index ${i}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Error converting notification _id at index ${i}:`, error.message);
        continue;
      }
    }

    // 4. Eğer notification bulunamadıysa
    if (!notificationToUpdate || notificationIndex === -1) {
      console.log('❌ Notification not found with ID:', notificationId);
      
      // Debug: Tüm notification ID'lerini göster
      console.log('Available notification IDs:');
      employee.Recent_Notifications.forEach((notif, idx) => {
        if (notif && notif._id) {
          try {
            const idStr = notif._id.toString ? notif._id.toString() : String(notif._id);
            console.log(`  [${idx}] ID: ${idStr}, Message: ${notif.message || 'N/A'}`);
          } catch (e) {
            console.log(`  [${idx}] Invalid _id`);
          }
        } else {
          console.log(`  [${idx}] No _id field`);
        }
      });
      
      return res.status(404).json({ 
        success: false,
        message: `Bildiriş tapılmadı (ID: ${notificationId})` 
      });
    }

    // 5. Güncellenecek alanları hazırla
    const updates = {};
    if (isRead !== undefined) {
      updates.isRead = Boolean(isRead);
      console.log(`Setting isRead to: ${updates.isRead}`);
    }
    if (message !== undefined) updates.message = String(message);
    if (type !== undefined) updates.type = String(type);
    
    // updatedAt ekle
    updates.updatedAt = new Date();

    // 6. Notification'ı güncelle
    // Önce mevcut notification'ın kopyasını al
    const updatedNotification = {
      ...notificationToUpdate.toObject ? notificationToUpdate.toObject() : notificationToUpdate,
      ...updates
    };

    // Array'i güncelle
    employee.Recent_Notifications[notificationIndex] = updatedNotification;

    // 7. Database'e kaydet
    const updateResult = await Employee.updateOne(
      { _id: id },
      { 
        $set: { 
          Recent_Notifications: employee.Recent_Notifications 
        }
      }
    );

    console.log('📝 Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    });

    if (updateResult.modifiedCount === 0) {
      console.log('⚠️ No documents were modified');
    }

    // 8. Yanıtı hazırla
    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`
        },
        notification: {
          id: notificationId,
          isRead: updates.isRead,
          message: updates.message || notificationToUpdate.message,
          type: updates.type || notificationToUpdate.type,
          updatedAt: updates.updatedAt
        },
        totalNotifications: employee.Recent_Notifications.length
      },
      message: 'Bildiriş uğurla yeniləndi'
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in updateNotification:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: "Daxili server xətası",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// ✅ Notification sil
export const deleteNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.Recent_Notifications = employee.Recent_Notifications.filter(
      notif => notif._id.toString() !== notificationId
    );

    await employee.save();

    res.json({ 
      success: true,
      data: employee.Recent_Notifications,
      message: 'Bildiriş silindi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Bütün notificationları təmizlə
// ✅ Bütün notificationları təmizlə (GÜVENLİ VERSİYON)
// ✅ Bütün notificationları təmizlə (Alternatif)
// ✅ Bütün notificationları təmizlə (EN GÜVENLİ)
// Geçici olarak middleware'i devre dışı bırakan fonksiyon

// ✅ Notification filter et
export const getNotificationsByStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    let filteredNotifications = [];
    if (status === 'read') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === true);
    } else if (status === 'unread') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === false);
    } else {
      filteredNotifications = employee.Recent_Notifications;
    }

    res.json({
      success: true,
      data: filteredNotifications,
      count: filteredNotifications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 📅 LEAVE FUNKSİYALARI =====================

// ✅ Məzuniyyət əlavə et
// ✅ Məzuniyyət əlavə et (DÜZELTİLMİŞ)
export const addLeave = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const leaveData = req.body;

    console.log(`📅 Adding leave for employee: ${employeeId}`);

    // 1. Gerekli alan kontrolü
    if (!leaveData.leaveType || !leaveData.startDate || !leaveData.endDate) {
      return res.status(400).json({ 
        success: false,
        message: "leaveType, startDate, endDate alanları gereklidir" 
      });
    }

    // 2. Employee'yi bul
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // 3. Yeni leave objesi oluştur
    const newLeave = {
      _id: new mongoose.Types.ObjectId(),
      leaveId: `LV-${Date.now()}`,
      leaveType: leaveData.leaveType,
      startDate: new Date(leaveData.startDate),
      endDate: new Date(leaveData.endDate),
      totalDaysRequested: leaveData.totalDaysRequested || 0,
      daysUsed: leaveData.daysUsed || 0,
      daysRemaining: leaveData.daysRemaining || 0,
      status: leaveData.status || "pending",
      reason: leaveData.reason || "",
      notes: leaveData.notes || "",
      createdAt: new Date()
    };

    // 4. leaves array'ine ekle
    employee.leaves.push(newLeave);

    // 5. save() ile validation bypass
    await employee.save({ validateBeforeSave: false });

    // 6. Başarılı response
    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`
        },
        leave: newLeave,
        totalLeaves: employee.leaves.length
      },
      message: 'Məzuniyyət əlavə edildi'
    });

  } catch (error) {
    console.error('Add leave error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Məzuniyyət yenilə
// ✅ Məzuniyyət yenilə (validation bypass ile)
export const updateLeave = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;
    const updateData = req.body;

    console.log(`✏️ Updating leave ${leaveId} for employee ${employeeId}`);

    // 1. Employee'yi bul
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // 2. Leave'i bul
    const leave = employee.leaves.id(leaveId);
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: "Məzuniyyət tapılmadı" 
      });
    }

    console.log(`📋 Found leave:`, {
      leaveId: leave.leaveId,
      type: leave.leaveType,
      status: leave.status
    });

    // 3. Leave'i güncelle
    Object.assign(leave, updateData, {
      updatedAt: new Date()
    });

    // 4. save() with validation bypass
    await employee.save({ validateBeforeSave: false });

    console.log(`✅ Leave updated successfully`);

    // 5. Güncellenmiş leave'i bul
    const updatedLeave = employee.leaves.id(leaveId);

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`
        },
        leave: updatedLeave,
        totalLeaves: employee.leaves.length
      },
      message: 'Məzuniyyət yeniləndi'
    });

  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Məzuniyyət sil
export const deleteLeave = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.leaves.pull(leaveId);
    
    // ⭐ Validation bypass
    await employee.save({ validateBeforeSave: false });

    res.json({ 
      success: true,
      data: employee.leaves,
      message: "Məzuniyyət silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin bütün məzuniyyətlərini getir
export const getEmployeeLeaves = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("leaves");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.leaves,
      count: employee.leaves.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Xüsusi məzuniyyəti getir
export const getEmployeeLeaveById = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const leave = employee.leaves.find(leave => leave._id.toString() === leaveId);

    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: "Məzuniyyət tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== ⏰ ATTENDANCE FUNKSİYALARI =====================

// ✅ İş girişi əlavə et
export const addAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const attendanceData = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // Yeni attendance objesi
    const newAttendance = {
      _id: new mongoose.Types.ObjectId(),
      attendanceId: `ATT-${Date.now()}`,
      ...attendanceData,
      createdAt: new Date()
    };

    employee.attendances.push(newAttendance);
    
    // ⭐ Validation bypass
    await employee.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: employee.attendances,
      message: 'İş girişi əlavə edildi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { employeeId, attendanceId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const attendance = employee.attendances.id(attendanceId);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: "İş girişi tapılmadı" 
      });
    }

    Object.assign(attendance, updateData);
    
    // ⭐ Validation bypass
    await employee.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: employee.attendances,
      message: 'İş girişi yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İş girişi sil
export const deleteAttendance = async (req, res) => {
  try {
    const { employeeId, attendanceId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.attendances.pull(attendanceId);
    
    // ⭐ Validation bypass
    await employee.save({ validateBeforeSave: false });

    res.json({ 
      success: true,
      data: employee.attendances,
      message: "İş girişi silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ✅ Xüsusi iş girişini getir
export const getAttendanceById = async (req, res) => {
  try {
    const { employeeId, attendanceId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const attendance = employee.attendances.find(
      att => att._id.toString() === attendanceId
    );
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: "İş girişi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin bütün iş girişlərini getir
export const getEmployeeAttendances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("attendances");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.attendances,
      count: employee.attendances.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
export const getAllAccountingEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'date', 
      sortOrder = 'desc',
      startDate,
      endDate,
      accountCode,
      type,
      status,
      search
    } = req.query;

    // Filter yarat
    const filter = { userId: userId };

    // Tarix filteri
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Digər filterlər
    if (accountCode) filter.accountCode = accountCode;
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Axtarış filteri
    if (search) {
      filter.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { documentNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Sıralama
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorğuları paralel yerinə yetir
    const [entries, total, stats] = await Promise.all([
      // Yazılışları götür
      AccountingEntry.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      
      // Ümumi say
      AccountingEntry.countDocuments(filter),
      
      // Statistikalar
      AccountingEntry.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalDebit: { 
              $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } 
            },
            totalCredit: { 
              $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } 
            },
            totalAmount: { $sum: "$amount" },
            byAccountCode: {
              $push: {
                accountCode: "$accountCode",
                accountName: "$accountName",
                type: "$type",
                amount: "$amount"
              }
            },
            byStatus: {
              $push: {
                status: "$status",
                amount: "$amount"
              }
            }
          }
        }
      ])
    ]);

    // Statistikaları formatla
    const summaryStats = stats[0] || {
      totalDebit: 0,
      totalCredit: 0,
      totalAmount: 0,
      byAccountCode: [],
      byStatus: []
    };

    // Hesab kodu üzrə statistikalar
    const accountCodeStats = {};
    summaryStats.byAccountCode.forEach(item => {
      if (!accountCodeStats[item.accountCode]) {
        accountCodeStats[item.accountCode] = {
          accountName: item.accountName,
          debit: 0,
          credit: 0,
          total: 0
        };
      }
      if (item.type === 'debit') {
        accountCodeStats[item.accountCode].debit += item.amount;
      } else {
        accountCodeStats[item.accountCode].credit += item.amount;
      }
      accountCodeStats[item.accountCode].total += item.amount;
    });

    // Status üzrə statistikalar
    const statusStats = {};
    summaryStats.byStatus.forEach(item => {
      if (!statusStats[item.status]) {
        statusStats[item.status] = 0;
      }
      statusStats[item.status] += item.amount;
    });

    // Ümumi xülasə
    const summary = {
      totalEntries: total,
      totalDebit: summaryStats.totalDebit,
      totalCredit: summaryStats.totalCredit,
      totalAmount: summaryStats.totalAmount,
      balance: summaryStats.totalDebit - summaryStats.totalCredit,
      accountCodeStats: Object.entries(accountCodeStats).map(([code, data]) => ({
        accountCode: code,
        ...data
      })),
      statusStats
    };

    res.json({
      success: true,
      data: {
        entries: entries.map(entry => ({
          id: entry._id,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          amount: entry.amount,
          type: entry.type,
          description: entry.description,
          date: entry.date,
          documentNumber: entry.documentNumber,
          status: entry.status,
          relatedTransaction: entry.relatedTransaction,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        summary,
        filters: {
          startDate,
          endDate,
          accountCode,
          type,
          status,
          search
        }
      }
    });

  } catch (error) {
    console.error('Get all accounting entries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ===================== 🏢 ŞİRKƏT FUNKSİYALARI =====================

// ✅ Şirkətə görə işçiləri getir
export const getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const employees = await Employee.find({ companyId }).select("-data");
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi məlumatlarını Excel-ə çevir
// ✅ İşçi məlumatlarını Excel-ə çevir (DÜZELTİLMİŞ)
export const exportEmployeesToExcel = async (req, res) => {
  try {
    console.log('📊 Excel export başladı...');
    
    // 1. User kontrolü
    if (!req.user || !req.user._id) {
      console.error('❌ User authentication hatası');
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    const userId = req.user._id;
    const { companyId, includeSalary, includePersonalInfo } = req.query;
    
    console.log('Excel export için parametreler:', {
      userId,
      companyId,
      includeSalary,
      includePersonalInfo
    });

    // 2. Filter yaratmaq
    const filter = { companyId: companyId || userId };
    console.log('Database filter:', filter);

    // 3. İşçi məlumatlarını gətir
    const employees = await Employee.find(filter)
      .select("-data -contentType -filename -fileSize -originalName -__v")
      .lean();

    console.log(`✅ ${employees.length} işçi tapıldı`);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Excel üçün işçi tapılmadı"
      });
    }

    // 4. ExcelJS kontrolü
    if (!ExcelJS) {
      console.error('❌ ExcelJS not loaded');
      return res.status(500).json({
        success: false,
        message: "Excel kitabxanası yüklənmədi"
      });
    }

    // 5. Yeni Excel workbook yarat
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nummix HR System';
    workbook.created = new Date();
    
    // 6. İşçilər vərəqi
    const worksheet = workbook.addWorksheet('İşçilər');
    
    // 7. Sütun başlıqları
    const columns = [
      { header: '№', key: 'index', width: 5 },
      { header: 'Ad', key: 'firstName', width: 15 },
      { header: 'Soyad', key: 'lastName', width: 15 },
      { header: 'E-poçt', key: 'email', width: 25 },
      { header: 'Vəzifə', key: 'position', width: 20 },
      { header: 'Departament', key: 'Department', width: 15 },
      { header: 'İşçi Növü', key: 'employeeType', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'İşə Qəbul Tarixi', key: 'hireDate', width: 15 },
    ];

    // 8. Maaş məlumatları əlavə et
    if (includeSalary === 'true') {
      columns.push(
        { header: 'Brüt Maaş (AZN)', key: 'gross', width: 12 },
        { header: 'Net Maaş (AZN)', key: 'Net_salary', width: 12 },
        { header: 'Vergi (AZN)', key: 'tax', width: 10 },
        { header: 'Sosial Ödəniş (AZN)', key: 'social_pay', width: 15 },
        { header: 'Maaş Statusu', key: 'salary_status', width: 12 }
      );
    }

    // 9. Şəxsi məlumatlar əlavə et
    if (includePersonalInfo === 'true') {
      columns.push(
        { header: 'VÖEN', key: 'tin', width: 15 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'Şəxsiyyət No', key: 'idSerialNumber', width: 15 }
      );
    }

    worksheet.columns = columns;

    // 10. Məlumatları əlavə et
    employees.forEach((employee, index) => {
      const rowData = {
        index: index + 1,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        position: employee.position || '',
        Department: employee.Department || '',
        employeeType: employee.employeeType === 'state' ? 'Dövlət' : 'Özəl',
        status: employee.status === 'active' ? 'Aktiv' : 
                employee.status === 'on_leave' ? 'İcazədə' : 'İşdən çıxıb',
        hireDate: employee.hireDate ? 
          new Date(employee.hireDate).toLocaleDateString('az-AZ') : ''
      };

      // Maaş məlumatları
      if (includeSalary === 'true') {
        rowData.gross = employee.gross || 0;
        rowData.Net_salary = employee.Net_salary || 0;
        rowData.tax = employee.tax || 0;
        rowData.social_pay = employee.social_pay || 0;
        rowData.salary_status = employee.salary_status === 'paid' ? 'Ödənilib' : 
                               employee.salary_status === 'pending' ? 'Gözləmədə' : 'Ləğv edilib';
      }

      // Şəxsi məlumatlar
      if (includePersonalInfo === 'true') {
        rowData.tin = employee.tin || '';
        rowData.phone = employee.phone || '';
        rowData.idSerialNumber = employee.idSerialNumber || '';
      }

      worksheet.addRow(rowData);
    });

    // 11. Başlığı formatla
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // 12. Rəqəm formatı
    if (includeSalary === 'true') {
      const grossCol = worksheet.getColumn('gross');
      const netCol = worksheet.getColumn('Net_salary');
      const taxCol = worksheet.getColumn('tax');
      const socialCol = worksheet.getColumn('social_pay');
      
      [grossCol, netCol, taxCol, socialCol].forEach(col => {
        if (col) col.numFmt = '#,##0.00';
      });
    }

    // 13. Fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `isciler_${timestamp}.xlsx`;

    // 14. Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();

    console.log(`✅ Excel faylı yaradıldı: ${filename}, ${employees.length} işçi`);

    // 15. Header-ları təyin et
    res.setHeader('Content-Type', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // 16. Buffer göndər
    res.send(buffer);

  } catch (error) {
    console.error('❌ Excel export xətası:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Excel faylı yaradılarkən xəta baş verdi',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// ✅ Dashboard məlumatlarını Excel-ə çevir
export const exportDashboardToExcel = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Dashboard məlumatlarını gətir (sizin mövcud funksiyalarınızdan)
    const dashboardData = await getDashboardStatsData(userId);
    
    const workbook = new ExcelJS.Workbook();
    
    // 1. Ümumi məlumatlar
    const overviewSheet = workbook.addWorksheet('Ümumi Məlumatlar');
    overviewSheet.columns = [
      { header: 'Göstərici', key: 'indicator', width: 30 },
      { header: 'Dəyər', key: 'value', width: 20 }
    ];
    
    const overviewData = [
      { indicator: 'Ümumi İşçi Sayı', value: dashboardData.totalEmployees },
      { indicator: 'Ümumi Brüt Maaş (AZN)', value: dashboardData.totalGross },
      { indicator: 'Ümumi Net Maaş (AZN)', value: dashboardData.totalNet },
      { indicator: 'Orta Maaş (AZN)', value: dashboardData.averageSalary },
      { indicator: 'Davamlılıq Faizi (%)', value: dashboardData.attendanceRate },
      { indicator: 'Departament Sayı', value: dashboardData.departmentCount }
    ];
    
    overviewData.forEach(data => overviewSheet.addRow(data));
    
    // 2. Departament bölgüsü
    const deptSheet = workbook.addWorksheet('Departament Bölgüsü');
    deptSheet.columns = [
      { header: 'Departament', key: 'department', width: 20 },
      { header: 'İşçi Sayı', key: 'count', width: 12 },
      { header: 'Ümumi Maaş', key: 'totalSalary', width: 15 },
      { header: 'Faiz', key: 'percentage', width: 10 }
    ];
    
    dashboardData.departments.forEach(dept => {
      deptSheet.addRow({
        department: dept.name,
        count: dept.employeeCount,
        totalSalary: dept.totalGross,
        percentage: dept.percentage + '%'
      });
    });
    
    // 3. Maaş aralığı
    const salarySheet = workbook.addWorksheet('Maaş Aralığı');
    salarySheet.columns = [
      { header: 'Maaş Aralığı', key: 'range', width: 20 },
      { header: 'İşçi Sayı', key: 'count', width: 12 },
      { header: 'Faiz', key: 'percentage', width: 10 }
    ];
    
    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Fayl göndər
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Dashboard Excel export error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard Excel export xətası'
    });
  }
};

// Helper funksiya: Dashboard məlumatlarını gətir
const getDashboardStatsData = async (userId) => {
  // Burada sizin mövcud dashboard statistikalarınızı gətirə bilərsiniz
  const employees = await Employee.find({ companyId: userId });
  
  return {
    totalEmployees: employees.length,
    totalGross: employees.reduce((sum, emp) => sum + (emp.gross || 0), 0),
    totalNet: employees.reduce((sum, emp) => sum + (emp.Net_salary || 0), 0),
    averageSalary: employees.length > 0 ? 
      Math.round(employees.reduce((sum, emp) => sum + (emp.gross || 0), 0) / employees.length) : 0,
    attendanceRate: 85, // Nümunə dəyər
    departmentCount: new Set(employees.map(emp => emp.Department)).size,
    departments: [] // Departament statistikaları
  };
};

// ✅ Maaş ödənişləri Excel
export const exportPaymentsToExcel = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    // Ödəniş məlumatlarını gətir
    const employees = await Employee.find({ companyId: userId })
      .select("firstName lastName Department gross Net_salary tax social_pay salary_status")
      .lean();
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Maaş Ödənişləri');
    
    sheet.columns = [
      { header: 'İşçi Adı', key: 'employeeName', width: 25 },
      { header: 'Departament', key: 'department', width: 15 },
      { header: 'Brüt Maaş', key: 'gross', width: 12 },
      { header: 'Net Maaş', key: 'net', width: 12 },
      { header: 'Vergi', key: 'tax', width: 10 },
      { header: 'Sosial Ödəniş', key: 'social', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Ödəniləcək Məbləğ', key: 'payable', width: 15 }
    ];
    
    employees.forEach(employee => {
      sheet.addRow({
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.Department || '',
        gross: employee.gross || 0,
        net: employee.Net_salary || 0,
        tax: employee.tax || 0,
        social: employee.social_pay || 0,
        status: employee.salary_status === 'paid' ? 'Ödənilib' : 'Gözləmədə',
        payable: employee.Net_salary || 0
      });
    });
    
    // Son sətir: Ümumi
    sheet.addRow({});
    sheet.addRow({
      employeeName: 'ÜMUMİ',
      gross: employees.reduce((sum, emp) => sum + (emp.gross || 0), 0),
      net: employees.reduce((sum, emp) => sum + (emp.Net_salary || 0), 0),
      tax: employees.reduce((sum, emp) => sum + (emp.tax || 0), 0),
      social: employees.reduce((sum, emp) => sum + (emp.social_pay || 0), 0),
      payable: employees.reduce((sum, emp) => sum + (emp.Net_salary || 0), 0)
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="maas_odemeleri_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Payments Excel export error:', error);
    res.status(500).json({
      success: false,
      message: 'Ödənişlər Excel export xətası'
    });
  }
};

// ✅ Excel şablonu yüklə
export const downloadExcelTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('İşçi Şablonu');
    
    sheet.columns = [
      { header: 'Ad*', key: 'firstName', width: 15 },
      { header: 'Soyad*', key: 'lastName', width: 15 },
      { header: 'E-poçt*', key: 'email', width: 25 },
      { header: 'Vəzifə*', key: 'position', width: 20 },
      { header: 'Departament', key: 'Department', width: 15 },
      { header: 'Telefon', key: 'phone', width: 15 },
      { header: 'VÖEN', key: 'tin', width: 15 },
      { header: 'Şəxsiyyət No', key: 'idSerialNumber', width: 15 },
      { header: 'Brüt Maaş', key: 'gross', width: 12 },
      { header: 'İşçi Növü (state/private)', key: 'employeeType', width: 20 },
      { header: 'İşə Qəbul Tarixi (YYYY-MM-DD)', key: 'hireDate', width: 20 }
    ];
    
    // Nümunə məlumatlar
    sheet.addRow({
      firstName: 'Əli',
      lastName: 'Hüseynov',
      email: 'eli@example.com',
      position: 'Developer',
      Department: 'IT',
      phone: '0551234567',
      tin: '1234567890',
      idSerialNumber: 'AZE1234567',
      gross: 2500,
      employeeType: 'private',
      hireDate: '2024-01-15'
    });
    
    // Açıqlama
    const noteRow = sheet.addRow(['* ilə işarələnmiş sütunlar mütləq doldurulmalıdır']);
    noteRow.font = { italic: true, color: { argb: 'FF0000FF' } };
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="isci_sablonu.xlsx"');
    res.send(buffer);
    
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Şablon yüklənmə xətası'
    });
  }
};

export default {
  exportEmployeesToExcel,
  exportDashboardToExcel,
  exportPaymentsToExcel,
  downloadExcelTemplate
};
// ✅ Statusa görə işçiləri getir
export const getEmployeesByStatus = async (req, res) => {
  try {
    const { status, companyId, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Status filter
    if (status) {
      const statuses = status.split(','); // Çoxlu status üçün: status=active,inactive
      filter.status = { $in: statuses };
    }
    
    // Şirkət filter
    if (companyId) filter.companyId = companyId;
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // İşçiləri gətir
    const employees = await Employee.find(filter)
      .select("-password -data -__v") // Gizli field-ləri çıxar
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });
    
    // Ümumi say
    const total = await Employee.countDocuments(filter);
    
    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      count: employees.length
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin şəklini getir
export const getEmployeeImage = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || !employee.data) {
      return res.status(404).json({ 
        success: false,
        message: "Şəkil tapılmadı" 
      });
    }

    res.set("Content-Type", employee.contentType);
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 📊 HESABAT FUNKSİYALARI =====================

// ✅ Maaş hesabatı al
export const getSalaryReport = async (req, res) => {
  try {
    const { month, year, companyId, employeeType } = req.query;
    
    let filter = {};
    if (companyId) filter.companyId = companyId;
    if (employeeType) filter.employeeType = employeeType;
    
    const employees = await Employee.find(filter)
      .select("firstName lastName email position employeeType gross tax social_pay Net_salary salary_status Department");
    
    const summary = {
      totalEmployees: employees.length,
      totalGross: employees.reduce((sum, emp) => sum + (emp.gross || 0), 0),
      totalTax: employees.reduce((sum, emp) => sum + (emp.tax || 0), 0),
      totalSocial: employees.reduce((sum, emp) => sum + (emp.social_pay || 0), 0),
      totalNet: employees.reduce((sum, emp) => sum + (emp.Net_salary || 0), 0),
      stateEmployees: employees.filter(e => e.employeeType === 'state').length,
      privateEmployees: employees.filter(e => e.employeeType === 'private').length,
      paidEmployees: employees.filter(e => e.salary_status === 'paid').length,
      pendingEmployees: employees.filter(e => e.salary_status === 'pending').length
    };
    
    res.json({
      success: true,
      data: employees,
      summary,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Toplu maaş yeniləməsi (AVTOMATİK VERGİ İLƏ)
// ✅ Toplu maaş yeniləməsi
export const bulkUpdateSalaries = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ 
        success: false,
        message: 'Updates array göndərilməlidir' 
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { employeeId, gross, employeeType } = update;
        
   
        
        const updateData = {};
        if (gross !== undefined) updateData.gross = gross;
        if (employeeType) updateData.employeeType = employeeType;
        
        // ⭐ findByIdAndUpdate ile validation bypass
        const employee = await Employee.findByIdAndUpdate(
          employeeId,
          updateData,
          { 
            new: true,
            runValidators: false // Validation'ı atla
          }
        );
        
        if (!employee) {
          errors.push({ employeeId, message: 'İşçi tapılmadı' });
          continue;
        }

        results.push({
          employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          gross: employee.gross,
          tax: employee.tax,
          social_pay: employee.social_pay,
          Net_salary: employee.Net_salary
        });
      } catch (error) {
        errors.push({ employeeId: update.employeeId, message: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} işçinin maaşı yeniləndi`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ===================== 📥 EXCEL DOWNLOAD FUNKSİYALARI =====================

// ✅ Bütün işçiləri Excel faylı olaraq endir
export const downloadExcelEmployees = async (req, res) => {
  try {
    console.log("🔍 Excel download endpoint çağırıldı - DEBUG MODE");
    
    const employees = await Employee.find({})
      .select('-data -contentType -filename -fileSize -originalName -__v')
      .lean();

    console.log(`📊 Excel üçün ${employees.length} işçi tapıldı`);
    
    // DEBUG: İlk 3 işçini göstər
    if (employees.length > 0) {
      console.log("✅ İlk 3 işçi məlumatı:");
      employees.slice(0, 3).forEach((emp, index) => {
        console.log(`İşçi ${index + 1}:`, {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          gross: emp.gross,
          Net_salary: emp.Net_salary
        });
      });
    } else {
      console.log("⚠️ XƏBƏRDARLIQ: Heç bir işçi tapılmadı!");
      console.log("Verilənlər bazasında işçi var mı?");
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("İşçilər");
    
    // Sütun başlıqları
    console.log("📋 Sütun başlıqları təyin edilir...");
    worksheet.columns = [
      { header: "Ad", key: "firstName", width: 15 },
      { header: "Soyad", key: "lastName", width: 15 },
      { header: "E-poçt", key: "email", width: 25 },
      { header: "Vəzifə", key: "position", width: 20 },
      { header: "VÖEN", key: "tin", width: 15 },
      { header: "Telefon", key: "phone", width: 15 },
      { header: "İşçi Növü", key: "employeeType", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Brüt Maaş", key: "gross", width: 12 },
      { header: "Net Maaş", key: "Net_salary", width: 12 },
      { header: "Maaş Statusu", key: "salary_status", width: 15 },
      { header: "Departament", key: "Department", width: 20 }
    ];
    
    // DEBUG: Worksheet sütunlarını yoxla
    console.log("✅ Worksheet sütunları:", worksheet.columns.length);
    
    // Məlumatları əlavə et
    console.log(`➕ ${employees.length} işçi məlumatı əlavə edilir...`);
    let addedRows = 0;
    
    employees.forEach((employee, index) => {
      const rowData = {
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        position: employee.position || '',
        tin: employee.tin || '',
        phone: employee.phone || '',
        employeeType: employee.employeeType === 'state' ? 'Dövlət' : 'Özəl',
        status: employee.status === 'active' ? 'Aktiv' : 
                employee.status === 'on_leave' ? 'İcazədə' : 'İşdən çıxıb',
        gross: employee.gross || 0,
        Net_salary: employee.Net_salary || 0,
        salary_status: employee.salary_status === 'paid' ? 'Ödənilib' : 
                      employee.salary_status === 'pending' ? 'Gözləmədə' : 'Ləğv edilib',
        Department: employee.Department || ''
      };
      
      console.log(`Row ${index + 1} data:`, rowData);
      worksheet.addRow(rowData);
      addedRows++;
    });
    
    console.log(`✅ Ümumi ${addedRows} sətir əlavə edildi`);
    
    // Əgər heç bir məlumat yoxdursa, test məlumatı əlavə et
    if (addedRows === 0) {
      console.log("🧪 Test məlumatı əlavə edilir...");
      worksheet.addRow({
        firstName: "Test",
        lastName: "İşçi",
        email: "test@example.com",
        position: "Developer",
        tin: "1234567890",
        phone: "0551234567",
        employeeType: "Özəl",
        status: "Aktiv",
        gross: 2500,
        Net_salary: 2000,
        salary_status: "Ödənilib",
        Department: "IT"
      });
      console.log("✅ Test məlumatı əlavə edildi");
    }
    
    // Başlığı qalın et
    console.log("🎨 Başlıq formatlanır...");
    worksheet.getRow(1).font = { bold: true };
    
    // Rəqəm formatı
    worksheet.getColumn('gross').numFmt = '#,##0.00';
    worksheet.getColumn('Net_salary').numFmt = '#,##0.00';
    
    // DEBUG: Worksheet məlumatlarını yoxla
    console.log(`📊 Worksheet-də ${worksheet.rowCount} sətir var`);
    console.log(`📊 Worksheet-də ${worksheet.columnCount} sütun var`);
    
    // Tarix üçün fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `isciler_${timestamp}.xlsx`;
    
    console.log(`📁 Fayl adı: ${filename}`);
    
    // Header-ları təyin et
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    
    console.log("📤 Excel faylı göndərilir...");
    
    // Excel faylını Buffer olaraq yaradıb göndərək
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`✅ Excel faylı hazırdır. Ölçü: ${buffer.length} bytes`);
    
    res.send(buffer);
    res.end();
    
    console.log("✅ Excel faylı uğurla göndərildi");
    
  } catch (error) {
    console.error("❌ Excel export xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "Excel faylı yaradılarkən xəta baş verdi: " + error.message,
      stack: error.stack
    });
  }
};