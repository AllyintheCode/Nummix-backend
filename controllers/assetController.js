import User from "../models/User.js";
import { ExcelService } from '../services/excelServices.js';
import { PdfService } from '../services/pdfService.js';

// 🏢 VƏSAİT ƏMƏLİYYATLARI

// Yeni vəsait yarat (BUFFER İLƏ)
// Asset sənəd məlumatlarını gətir (DOWNLOAD YOX, GET METADATA)
export const getAssetDocument = async (req, res) => {
  try {
    console.log('🔍 GET ASSET DOCUMENT called');
    console.log('👤 User ID:', req.params.userId);
    console.log('🏢 Asset ID:', req.params.assetId);

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    console.log('📄 Asset document exists:', !!asset.document);
    
    if (!asset.document) {
      return res.status(404).json({ 
        success: false,
        message: "Sənəd tapılmadı",
        assetDetails: {
          id: asset._id,
          name: asset.name,
          hasDocument: false
        }
      });
    }

    // ƏSAS DƏYİŞİKLİK: downloadUrl düzgün formatda
    const documentInfo = {
      originalName: asset.document.originalName,
      mimeType: asset.document.mimeType,
      fileSize: asset.document.fileSize,
      uploadedAt: asset.document.uploadedAt,
      // ✅ DÜZGÜN DOWNLOAD LINKİ
      downloadUrl: `/api/${req.params.userId}/assets/${req.params.assetId}/download-document`,
      // ✅ Əlavə olaraq: direkt fayl linki
      directFileUrl: `/api/${req.params.userId}/assets/${req.params.assetId}/download-document?download=true`,
      // ✅ Frontend-də asanlıq üçün:
      downloadLink: `<a href="/api/${req.params.userId}/assets/${req.params.assetId}/download-document" download="${asset.document.originalName}">Yüklə</a>`
    };

    res.json({
      success: true,
      message: "Sənəd məlumatları uğurla gətirildi",
      data: {
        assetId: asset._id,
        assetName: asset.name,
        document: documentInfo,
        // ✅ Əlavə məlumat
        instructions: {
          download: "Download linkinə klik edin və fayl avtomatik yüklənəcək",
          directDownload: "Linki yeni tabda açmaq üçün sağ klik -> 'Yeni tabda aç'",
          frontendUsage: "Frontend-də: <a href='...' download>Yüklə</a> tag-ı istifadə edin"
        }
      }
    });

  } catch (error) {
    console.error('❌ GET ASSET DOCUMENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
export const createAsset = async (req, res) => {
  try {
    console.log('🔍 CREATE ASSET DEBUG:');
    console.log('📋 Request Body Keys:', Object.keys(req.body));
    console.log('📋 Request Body Values:', req.body);
    
    // Hər bir sahəni ayrıca logla
    console.log('📝 Checking account field:');
    console.log('- account in req.body:', req.body.account);
    console.log('- account type:', typeof req.body.account);
    console.log('- account trimmed:', req.body.account?.trim());
    console.log('- account after trim length:', req.body.account?.trim()?.length);
    
    const {
      inventoryNumber,
      name,
      category,
      account,
      location,
      initialValue,
      currentValue,
      purchaseDate,
      serviceLife,
      notes
    } = req.body;

    console.log('📝 Destructured account:', account);
    
    // Validation check
    if (!account || account.trim() === '') {
      console.log('❌ ERROR: Account is empty or missing');
      return res.status(400).json({
        success: false,
        message: "Account sahəsi tələb olunur",
        receivedBody: req.body,
        missingFields: ['account']
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const assetData = {
      inventoryNumber: inventoryNumber || `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name?.trim(),
      category: category?.trim(),
      account: account?.trim(), // ⬅️ BU MÜTLƏQ DOLU OLMALIDIR
      location: location?.trim(),
      initialValue: parseFloat(initialValue) || 0,
      currentValue: parseFloat(currentValue) || 0,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      serviceLife: parseInt(serviceLife) || 1,
      notes: notes?.trim(),
      status: "Aktiv",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Asset Data to save:', assetData);
    
    // Əgər fayl yüklənibsə
    if (req.file) {
      console.log('📁 File detected:', req.file.originalname);
      assetData.document = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        bufferData: req.file.buffer.toString('base64'),
        uploadedAt: new Date()
      };
    }

    console.log('💾 Saving to database...');
    user.assets.push(assetData);
    await user.save();
    
    console.log('✅ Asset saved successfully');
    
    const newAsset = user.assets[user.assets.length - 1];
    
    // Buffer data-sını client-ə göndərmirik
    const assetResponse = newAsset.toObject();
    if (assetResponse.document && assetResponse.document.bufferData) {
      delete assetResponse.document.bufferData;
    }

    res.status(201).json({
      success: true,
      data: assetResponse,
      message: "Vəsait uğurla əlavə edildi"
    });
    
  } catch (error) {
    console.error('❌ CREATE ASSET Error:', error.message);
    console.error('❌ Error Stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message,
      errorType: error.name
    });
  }
};

// Asset üçün sənəd yüklə (BUFFER İLƏ)
export const uploadAssetDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ message: "Vəsait tapılmadı" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Fayl seçilməyib" });
    }

    // ✅ YENİ: Asset-ə BUFFER məlumatlarını əlavə et
    asset.document = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      // ✅ BUFFER-I Base64-ə çevirib saxlayırıq
      bufferData: req.file.buffer.toString('base64'),
      uploadedAt: new Date()
    };

    asset.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Sənəd uğurla yükləndi",
      data: {
        document: {
          originalName: asset.document.originalName,
          mimeType: asset.document.mimeType,
          fileSize: asset.document.fileSize,
          uploadedAt: asset.document.uploadedAt
          // ✅ QAYTARMIRIQ: bufferData client-ə göndərmirik
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Asset sənədini sil (BUFFER İLƏ)
export const deleteAssetDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset || !asset.document) {
      return res.status(404).json({ message: "Sənəd tapılmadı" });
    }

    // ✅ YENİ: Sadəcə document sahəsini silirik (fiziki fayl yoxdur)
    asset.document = undefined;
    asset.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Sənəd uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Asset sənədini yüklə (BUFFER İLƏ)
export const downloadAssetDocument = async (req, res) => {
  try {
    console.log('⬇️ DOWNLOAD ASSET DOCUMENT (Universal Version)');
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset || !asset.document || !asset.document.bufferData) {
      return res.status(404).json({ 
        success: false,
        message: "Sənəd tapılmadı" 
      });
    }

    // Base64-dən Buffer-a çevir
    const fileBuffer = Buffer.from(asset.document.bufferData, 'base64');
    const fileName = asset.document.originalName;
    
    // ✅ BÜTÜN BRAUZERLƏR ÜÇÜN UYĞUN FİLENAME
    let encodedFileName;
    
    // Türkə və xüsusi simvollar üçün
    if (/[\u0080-\uFFFF]/.test(fileName) || /[^\x00-\x7F]/.test(fileName)) {
      // Unicode simvollar varsa
      encodedFileName = Buffer.from(fileName).toString('latin1');
    } else {
      // Normal ASCII simvollar
      encodedFileName = fileName;
    }
    
    // ✅ HTTP HEADER-LARI
    res.writeHead(200, {
      'Content-Type': asset.document.mimeType,
      'Content-Disposition': `attachment; filename="${encodedFileName}"`,
      'Content-Length': asset.document.fileSize,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Expose-Headers': 'Content-Disposition'
    });
    
    // ✅ BÜTÜN BRAUZERLƏR ÜÇÜN TEST EDİLMİŞ FORMAT
    // Chrome, Firefox, Safari, Edge üçün
    const userAgent = req.headers['user-agent'] || '';
    
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
      // Modern brauzerlər üçün
      res.setHeader('Content-Disposition', 
        `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      // Safari üçün (fərqli encoding)
      res.setHeader('Content-Disposition', 
        `attachment; filename="${encodeURIComponent(fileName)}"`
      );
    } else {
      // Digər brauzerlər üçün
      res.setHeader('Content-Disposition', 
        `attachment; filename="${encodedFileName}"`
      );
    }
    
    console.log('📤 Download started:', {
      fileName: fileName,
      encodedName: encodedFileName,
      size: asset.document.fileSize,
      type: asset.document.mimeType,
      userAgent: userAgent.substring(0, 50)
    });

    // Buffer-ı hissə-hissə göndər (böyük fayllar üçün)
    const chunkSize = 64 * 1024; // 64KB chunks
    let offset = 0;
    
    const sendChunk = () => {
      if (offset >= fileBuffer.length) {
        console.log('✅ File download completed');
        res.end();
        return;
      }
      
      const chunk = fileBuffer.slice(offset, offset + chunkSize);
      offset += chunkSize;
      
      if (res.write(chunk)) {
        process.nextTick(sendChunk);
      } else {
        res.once('drain', sendChunk);
      }
    };
    
    sendChunk();

  } catch (error) {
    console.error('❌ DOWNLOAD ERROR:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: error.message,
        details: {
          userId: req.params.userId,
          assetId: req.params.assetId
        }
      });
    }
  }
};

// Vəsaiti yenilə (BUFFER İLƏ)
export const updateAsset = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ message: "Vəsait tapılmadı" });
    }

    // Əsas məlumatları yenilə
    Object.assign(asset, {
      ...req.body,
      updatedAt: new Date()
    });

    // ✅ YENİ: Əgər yeni fayl yüklənibsə, BUFFER məlumatlarını yenilə
    if (req.file) {
      asset.document = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        // ✅ BUFFER-I Base64-ə çevirib saxlayırıq
        bufferData: req.file.buffer.toString('base64'),
        uploadedAt: new Date()
      };
    }

    // Amortizasiyanı yenidən hesabla
    const amortizationData = user.calculateAmortization(asset);
    asset.amortization = amortizationData.amortization;
    asset.amortizationPercentage = amortizationData.amortizationPercentage;

    await user.save();

    res.json({
      success: true,
      data: asset,
      message: "Vəsait uğurla yeniləndi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vəsaiti sil (BUFFER İLƏ)
export const deleteAsset = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const asset = user.assets.id(req.params.assetId);
    
    // ✅ YENİ: Əgər sənəd varsa, document sahəsini silirik (fiziki fayl yoxdur)
    if (asset && asset.document) {
      asset.document = undefined;
    }

    user.assets.pull(req.params.assetId);
    await user.save();

    res.json({
      success: true,
      message: "Vəsait uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bütün vəsaitləri gətir
export const getAllAssets = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const { category, location, status } = req.query;
    let assets = user.assets;

    // Filterləmə
    if (category) {
      assets = assets.filter(asset => asset.category === category);
    }
    if (location) {
      assets = assets.filter(asset => asset.location === location);
    }
    if (status) {
      assets = assets.filter(asset => asset.status === status);
    }

    // Sıralama (ən yeni üstə)
    assets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // ✅ YENİ: Buffer data-sını client-ə göndərmirik
    const assetsWithoutBuffer = assets.map(asset => {
      const { document, ...assetWithoutDoc } = asset.toObject();
      if (document) {
        // ✅ Yalnız metadata göndəririk, bufferData yox
        assetWithoutDoc.document = {
          originalName: document.originalName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt
        };
      }
      return assetWithoutDoc;
    });

    res.json({
      success: true,
      data: assetsWithoutBuffer,
      count: assets.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vəsaiti ID ilə gətir
export const getAssetById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const asset = user.assets.id(req.params.assetId);
    if (!asset) {
      return res.status(404).json({ message: "Vəsait tapılmadı" });
    }

    // ✅ YENİ: Buffer data-sını client-ə göndərmirik
    const assetWithoutBuffer = asset.toObject();
    if (assetWithoutBuffer.document) {
      delete assetWithoutBuffer.document.bufferData;
    }

    res.json({
      success: true,
      data: assetWithoutBuffer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Excel yarat və yüklə (BUFFER İLƏ)
export const generateAndDownloadExcel = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const activeAssets = user.assets.filter(asset => asset.status === "Aktiv");
    
    // Excel faylı yarat
    const excelResult = await ExcelService.generateAssetsExcel(activeAssets, user);

    // Database-də qeyd et
    const excelReport = {
      title: "Ümumi hesabat",
      description: "Vəsait siyahısını Excel kimi yüklə",
      fileName: excelResult.fileName,
      filePath: excelResult.filePath,
      fileSize: excelResult.fileSize,
      generatedAt: new Date(),
      data: activeAssets.map(asset => ({
        inventoryNumber: asset.inventoryNumber,
        name: asset.name,
        category: asset.category,
        account: asset.account,
        location: asset.location,
        initialValue: asset.initialValue,
        currentValue: asset.currentValue,
        amortization: asset.amortization,
        status: asset.status
      }))
    };

    user.assetExcelReports.push(excelReport);
    await user.save();

    // Faylı yüklə
    res.download(excelResult.filePath, excelResult.fileName, (err) => {
      if (err) {
        console.error('Fayl yüklənərkən xəta:', err);
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Excel faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};

// PDF hesabatı yarat və yüklə (BUFFER İLƏ)
export const generateAndDownloadPdf = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const activeAssets = user.assets.filter(asset => asset.status === "Aktiv");
    
    // PDF faylı yarat
    const pdfResult = await PdfService.generateAmortizationPdf(activeAssets, user);

    // Database-də qeyd et
    const pdfReport = {
      title: "Amortizasiya hesabatı",
      description: "Amortizasiya detalları",
      fileName: pdfResult.fileName,
      filePath: pdfResult.filePath,
      fileSize: pdfResult.fileSize,
      generatedAt: new Date(),
      data: activeAssets.map(asset => ({
        inventoryNumber: asset.inventoryNumber,
        name: asset.name,
        category: asset.category,
        initialValue: asset.initialValue,
        currentValue: asset.currentValue,
        amortization: asset.amortization,
        amortizationPercentage: asset.amortizationPercentage
      }))
    };

    user.assetPdfReports.push(pdfReport);
    await user.save();

    // Faylı yüklə
    res.download(pdfResult.filePath, pdfResult.fileName);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'PDF faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};

// Kateqoriya üzrə Excel yüklə
export const downloadCategoryExcel = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const categoryReport = user.generateCategoryReport();
    const excelResult = await ExcelService.generateCategoryExcel(categoryReport, user);

    res.download(excelResult.filePath, excelResult.fileName);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Kateqoriya Excel faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};

// Kateqoriya üzrə PDF yüklə
export const downloadCategoryPdf = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const categoryReport = user.generateCategoryReport();
    const pdfResult = await PdfService.generateCategoryPdf(categoryReport, user);

    res.download(pdfResult.filePath, pdfResult.fileName);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Kateqoriya PDF faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};

// Əvvəlki hesabatları gətir
export const getPreviousReports = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json({
      success: true,
      data: {
        excelReports: user.assetExcelReports,
        pdfReports: user.assetPdfReports
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 KATEQORİYA ƏMƏLİYYATLARI
// ... (kateqoriya funksiyaları eyni qalır - getCategories, createCategory, updateCategory, deleteCategory)

// 📈 HESABAT ƏMƏLİYYATLARI
// ... (hesabat funksiyaları eyni qalır - generateExcelReport, generatePdfReport, generateCategoryReport, generateDepartmentReport, getReports)

// 📊 STATİSTİKA ƏMƏLİYYATLARI
// ... (statistika funksiyaları eyni qalır - getAssetStatistics, getDepartmentValues)

// Bütün kateqoriyaları gətir
export const getCategories = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json({
      success: true,
      data: user.assetCategories,
      count: user.assetCategories.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yeni kateqoriya yarat
export const createCategory = async (req, res) => {
  try {
    const { name, description, amortizationRate } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Kateqoriya adı unikallığını yoxla
    const existingCategory = user.assetCategories.find(cat => cat.name === name);
    if (existingCategory) {
      return res.status(400).json({ message: "Bu kateqoriya adı artıq mövcuddur" });
    }

    const newCategory = {
      name,
      description,
      amortizationRate,
      createdAt: new Date()
    };

    user.assetCategories.push(newCategory);
    await user.save();

    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Kateqoriya uğurla əlavə edildi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kateqoriyanı yenilə
export const updateCategory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const category = user.assetCategories.id(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Kateqoriya tapılmadı" });
    }

    Object.assign(category, req.body);
    await user.save();

    res.json({
      success: true,
      data: category,
      message: "Kateqoriya uğurla yeniləndi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kateqoriyanı sil
export const deleteCategory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Bu kateqoriyaya aid vəsaitləri yoxla
    const assetsInCategory = user.assets.filter(asset => asset.category === user.assetCategories.id(req.params.categoryId).name);
    if (assetsInCategory.length > 0) {
      return res.status(400).json({ 
        message: "Bu kateqoriyaya aid vəsaitlər var. Əvvəlcə onları silin və ya başqa kateqoriyaya köçürün." 
      });
    }

    user.assetCategories.pull(req.params.categoryId);
    await user.save();

    res.json({
      success: true,
      message: "Kateqoriya uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Excel hesabatı yarat
export const generateExcelReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const activeAssets = user.assets.filter(asset => asset.status === "Aktiv");
    
    const reportData = activeAssets.map(asset => ({
      inventoryNumber: asset.inventoryNumber,
      name: asset.name,
      category: asset.category,
      account: asset.account,
      location: asset.location,
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      amortization: asset.amortization,
      status: asset.status
    }));

    const excelReport = {
      title: "Ümumi hesabat",
      description: "Vəsait siyahısını Excel kimi yüklə",
      fileName: `assets_report_${Date.now()}.xlsx`,
      filePath: `/reports/excel/assets_report_${Date.now()}.xlsx`,
      fileSize: 0,
      generatedAt: new Date(),
      data: reportData
    };

    user.assetExcelReports.push(excelReport);
    await user.save();

    res.json({
      success: true,
      data: excelReport,
      message: "Excel hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PDF hesabatı yarat
export const generatePdfReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const activeAssets = user.assets.filter(asset => asset.status === "Aktiv");
    
    const reportData = activeAssets.map(asset => ({
      inventoryNumber: asset.inventoryNumber,
      name: asset.name,
      category: asset.category,
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      amortization: asset.amortization,
      amortizationPercentage: asset.amortizationPercentage
    }));

    const pdfReport = {
      title: "Amortizasiya hesabatı",
      description: "Amortizasiya detalları",
      fileName: `amortization_report_${Date.now()}.pdf`,
      filePath: `/reports/pdf/amortization_report_${Date.now()}.pdf`,
      fileSize: 0,
      generatedAt: new Date(),
      data: reportData
    };

    user.assetPdfReports.push(pdfReport);
    await user.save();

    res.json({
      success: true,
      data: pdfReport,
      message: "PDF hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kateqoriya hesabatı yarat
export const generateCategoryReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const categoryReport = user.generateCategoryReport();
    
    user.assetCategoryReports.push(categoryReport);
    await user.save();

    res.json({
      success: true,
      data: categoryReport,
      message: "Kateqoriya hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Şöbə hesabatı yarat
export const generateDepartmentReport = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const departmentData = Array.from(user.departmentValues.entries()).map(([location, stats]) => {
      const totalCurrentValue = user.assetStatistics.totalCurrentValue;
      const percentage = totalCurrentValue > 0 ? (stats.currentValue / totalCurrentValue) * 100 : 0;
      
      return {
        location,
        assetCount: stats.assetCount,
        initialValue: stats.initialValue,
        currentValue: stats.currentValue,
        percentage: Number(percentage.toFixed(2))
      };
    });

    const departmentReport = {
      title: "Şöbə/filial üzrə",
      description: "Şöbələr üzrə xülasə",
      generatedAt: new Date(),
      data: departmentData,
      summary: {
        totalAssets: user.assetStatistics.totalAssets,
        totalInitialValue: user.assetStatistics.totalInitialValue,
        totalCurrentValue: user.assetStatistics.totalCurrentValue
      }
    };

    user.assetDepartmentReports.push(departmentReport);
    await user.save();

    res.json({
      success: true,
      data: departmentReport,
      message: "Şöbə hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bütün hesabatları gətir
export const getReports = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json({
      success: true,
      data: {
        excelReports: user.assetExcelReports,
        pdfReports: user.assetPdfReports,
        categoryReports: user.assetCategoryReports,
        departmentReports: user.assetDepartmentReports
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vəsait statistikalarını gətir
export const getAssetStatistics = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json({
      success: true,
      data: user.assetStatistics
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Şöbə dəyərlərini gətir
export const getDepartmentValues = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const departmentArray = Array.from(user.departmentValues.entries()).map(([location, stats]) => ({
      location,
      ...stats
    }));

    res.json({
      success: true,
      data: departmentArray
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};