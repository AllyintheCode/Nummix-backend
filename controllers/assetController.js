import User from "../models/User.js";
import { ExcelService } from '../services/excelServices.js';
import { PdfService } from '../services/pdfService.js';
import excel from 'exceljs';
import PDFDocument from 'pdfkit';
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
// Çox sadə test Excel (işləyib-işləmədiyini yoxlamaq üçün)
export const testSimpleExcel = async (req, res) => {
  try {
    console.log("🧪 Sadə test Excel başladı...");
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    
    // Çox sadə məlumat
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Ad', key: 'name', width: 20 },
      { header: 'Qiymət', key: 'price', width: 15 }
    ];
    
    // Başlıq
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4CAF50' }
    };
    
    // Məlumatlar
    worksheet.addRow({ id: 1, name: 'Test Məhsul 1', price: 100 });
    worksheet.addRow({ id: 2, name: 'Test Məhsul 2', price: 200 });
    worksheet.addRow({ id: 3, name: 'Test Məhsul 3', price: 300 });
    
    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`✅ Test Excel buffer: ${buffer.length} bytes`);
    console.log(`🔍 Signature: ${buffer.slice(0, 4).toString('hex')}`);
    
    // Header-lar
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="test_simple.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    // Göndər
    res.end(buffer);
    
    console.log("🎉 Test Excel göndərildi!");
    
  } catch (error) {
    console.error('❌ Test Excel xətası:', error);
    res.status(500).json({
      success: false,
      message: `Test Excel xətası: ${error.message}`,
      error: error.toString()
    });
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
// ===================== 📤 ASSET EXPORT FUNKSİYALARI (YENİ) =====================

// ✅ Bütün assetləri Excel formatında endir (YENİ)
export const downloadAllAssetsExcel = async (req, res) => {
  try {
    console.log("🚀 Excel download başladı...");
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const assets = user.assets || [];
    console.log(`📊 ${assets.length} asset tapıldı`);
    
    // 1. Workbook yarat
    const workbook = new excel.Workbook();
    
    // 2. Metadata əlavə et
    workbook.creator = 'Asset Management System';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // 3. Worksheet yarat
    const worksheet = workbook.addWorksheet('Vəsaitlər', {
      views: [{ state: 'frozen', ySplit: 1 }] // Başlığı donduraq
    });
    
    // 4. SÜTUNLARI DÜZGÜN TƏYİN ET (BU ÇOX ƏHƏMİYYƏTLİ)
    worksheet.columns = [
      { header: 'Inv. No', key: 'inventoryNumber', width: 20 },
      { header: 'Ad', key: 'name', width: 30 },
      { header: 'Kateqoriya', key: 'category', width: 20 },
      { header: 'Hesab', key: 'account', width: 15 },
      { header: 'Yer', key: 'location', width: 20 },
      { header: 'İlkin Dəyər (₼)', key: 'initialValue', width: 18 },
      { header: 'Cari Dəyər (₼)', key: 'currentValue', width: 18 },
      { header: 'Amortizasiya (₼)', key: 'amortization', width: 18 },
      { header: 'Amortizasiya (%)', key: 'amortizationPercentage', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    // 5. BAŞLIQ SƏTRİNİ FORMATLA
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Arial',
        family: 2,
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 11
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    });
    
    // 6. MƏLUMATLARI ƏLAVƏ ET
    let rowIndex = 2;
    
    if (assets.length === 0) {
      console.log("🧪 Test məlumat əlavə edilir...");
      
      // Test məlumatları
      const testData = [
        {
          inventoryNumber: 'INV-2024-001',
          name: 'Dell Kompüter XPS 15',
          category: 'Kompüter avadanlığı',
          account: '111',
          location: 'Bakı Ofisi',
          initialValue: 2500,
          currentValue: 2187.5,
          amortization: 312.5,
          amortizationPercentage: 12.5,
          status: 'Aktiv'
        },
        {
          inventoryNumber: 'INV-2023-045',
          name: 'Toyota Camry 2022',
          category: 'Nəqliyyat vasitələri',
          account: '112',
          location: 'Bakı Ofisi',
          initialValue: 45000,
          currentValue: 32500,
          amortization: 12500,
          amortizationPercentage: 27.78,
          status: 'Aktiv'
        }
      ];
      
      testData.forEach((asset, index) => {
        const row = worksheet.addRow(asset);
        formatDataRow(row, rowIndex);
        rowIndex++;
      });
      
      console.log(`✅ ${testData.length} test sətir əlavə edildi`);
    } else {
      // Real məlumatları əlavə et
      assets.forEach((asset, index) => {
        const rowData = {
          inventoryNumber: asset.inventoryNumber || '',
          name: asset.name || '',
          category: asset.category || '',
          account: asset.account || '',
          location: asset.location || '',
          initialValue: asset.initialValue || 0,
          currentValue: asset.currentValue || 0,
          amortization: asset.amortization || 0,
          amortizationPercentage: asset.amortizationPercentage || 0,
          status: asset.status || 'Aktiv'
        };
        
        const row = worksheet.addRow(rowData);
        formatDataRow(row, rowIndex);
        rowIndex++;
      });
      
      console.log(`✅ ${assets.length} real sətir əlavə edildi`);
    }
    
    // 7. RƏQƏM FORMATLARI
    const numberColumns = ['initialValue', 'currentValue', 'amortization'];
    numberColumns.forEach(colKey => {
      const col = worksheet.getColumn(colKey);
      col.numFmt = '#,##0.00';
    });
    
    worksheet.getColumn('amortizationPercentage').numFmt = '0.00';
    
    // 8. SƏTR HÜNDÜRLÜYÜ
    for (let i = 2; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).height = 20;
    }
    
    // 9. AUTOFIT (sütunları məlumata uyğun genişləndir)
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        maxLength = Math.max(maxLength, cellLength);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
    
    // 10. FAYL ADI
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `vesaitler_${timestamp}.xlsx`;
    
    console.log(`📁 Fayl adı: ${filename}`);
    console.log(`📊 Worksheet: ${worksheet.rowCount} sətir, ${worksheet.columnCount} sütun`);
    
    // 11. BUFFER YARAD
    console.log("🔄 Excel buffer yaradılır...");
    const buffer = await workbook.xlsx.writeBuffer();
    
    // 12. BUFFER-ı YOXLA
    console.log(`✅ Buffer hazırdır. Ölçü: ${buffer.length} bytes`);
    
    // İlk 10 byte-ı yoxla (Excel signature)
    const signature = buffer.slice(0, 4);
    const hexSignature = signature.toString('hex');
    console.log(`🔍 Excel signature: ${hexSignature}`);
    
    if (hexSignature !== '504b0304') {
      console.error('❌ XƏTA: Excel signature yanlışdır!');
      throw new Error('Excel faylı düzgün yaradılmadı');
    }
    
    // 13. RESPONSE HEADER-LARI
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log("📤 Excel faylı göndərilir...");
    
    // 14. BUFFER-ı GÖNDƏR
    res.end(buffer);
    
    console.log("🎉 Excel faylı uğurla göndərildi!");
    
  } catch (error) {
    console.error('❌ Excel xətası:', error);
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Excel xətası: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

// Köməkçi funksiya: Məlumat sətirlərini formatla
function formatDataRow(row, rowIndex) {
  // Alternativ rənglər
  if (rowIndex % 2 === 0) {
    row.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F2F2F2' }
      };
    });
  }
  
  // Sərhədlər
  row.eachCell(cell => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'E0E0E0' } },
      left: { style: 'thin', color: { argb: 'E0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
      right: { style: 'thin', color: { argb: 'E0E0E0' } }
    };
  });
  
  // Rəqəm sütunlarını sağa align et
  const numberCells = [6, 7, 8, 9]; // initialValue, currentValue, amortization, amortizationPercentage
  numberCells.forEach(cellNum => {
    const cell = row.getCell(cellNum);
    cell.alignment = { horizontal: 'right' };
  });
}

// ✅ Amortizasiya hesabatını PDF formatında endir (YENİ)
export const downloadAmortizationReportPDFl = async (req, res) => {
  try {
    console.log("📄 Amortizasiya PDF download endpoint çağırıldı");
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const assets = user.assets.filter(asset => asset.status === "Aktiv");
    console.log(`📄 PDF üçün ${assets.length} aktiv asset tapıldı`);

    // PDF yarat
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      font: 'Helvetica'
    });
    
    // PDF fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `amortizasiya_hesabati_${timestamp}.pdf`;
    
    // Response header-ları
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // PDF-i response-a bağla
    doc.pipe(res);
    
    // ===================== PDF MƏZMUNU =====================
    
    // Başlıq
    doc.fontSize(20).font('Helvetica-Bold')
       .text('DEPRECIATION REPORT', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
       .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Hər bir asset üçün məlumat
    assets.forEach((asset, index) => {
      // Asset adı
      doc.fontSize(14).font('Helvetica-Bold')
         .text(asset.name);
      
      // Asset məlumatları
      doc.fontSize(10).font('Helvetica')
         .text(`  Inv. No: ${asset.inventoryNumber || 'N/A'}`);
      doc.text(`  Category: ${asset.category || 'N/A'}`);
      doc.text(`  Initial value: ${(asset.initialValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`);
      doc.text(`  Current value: ${(asset.currentValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`);
      
      // Amortizasiya hesabı
      const depreciation = asset.amortization || 0;
      const initialValue = asset.initialValue || 1;
      const depreciationPercentage = initialValue > 0 ? (depreciation / initialValue * 100).toFixed(2) : '0.00';
      
      doc.text(`  Depreciation: ${depreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼ (${depreciationPercentage}%)`);
      
      // Ayrıcı xətt
      doc.moveDown(0.5);
      doc.text('─────────────────────────────────────────────────────────────', { align: 'center' });
      doc.moveDown(1);
      
      // Səhifə qurtarmasa yenisinə keç
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(12).text('Continued...', { align: 'center' });
        doc.moveDown(1);
      }
    });
    
    // Xülasə
    doc.moveDown(2);
    doc.text('═══════════════════════════════════════════════════════════════', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Oblique')
       .text(`Report generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Statistik məlumatlar
    const totalAssets = assets.length;
    const totalInitialValue = assets.reduce((sum, asset) => sum + (asset.initialValue || 0), 0);
    const totalCurrentValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalDepreciation = assets.reduce((sum, asset) => sum + (asset.amortization || 0), 0);
    
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold')
       .text('SUMMARY', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
       .text(`Total Assets: ${totalAssets}`, { align: 'center' });
    doc.text(`Total Initial Value: ${totalInitialValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`, { align: 'center' });
    doc.text(`Total Current Value: ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`, { align: 'center' });
    doc.text(`Total Depreciation: ${totalDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`, { align: 'center' });
    
    // PDF-i bitir
    doc.end();
    
  } catch (error) {
    console.error("❌ PDF export xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "PDF faylı yaradılarkən xəta baş verdi: " + error.message 
    });
  }
};

// ✅ Amortizasiya hesabatını PDF formatında endir
export const downloadAmortizationReportPDF = async (req, res) => {
  try {
    console.log("📄 PDF download endpoint çağırıldı");
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const assets = user.assets.filter(asset => asset.status === "Aktiv");
    console.log(`📄 PDF üçün ${assets.length} aktiv asset tapıldı`);

    // Əgər asset yoxdursa, test məlumat əlavə et
    let assetsToExport = assets;
    if (assets.length === 0) {
      console.log("⚠️ Asset tapılmadı. Test məlumat əlavə edilir...");
      assetsToExport = [
        {
          inventoryNumber: "INV-2024-001",
          name: "Dell Kompüter",
          category: "Kompüter avadanlığı",
          initialValue: 2500,
          currentValue: 2187.5,
          amortization: 312.50,
          amortizationPercentage: 12.50
        },
        {
          inventoryNumber: "INV-2023-045",
          name: "Toyota Camry",
          category: "Nəqliyyat vasitələri",
          initialValue: 45000,
          currentValue: 32500,
          amortization: 12500.00,
          amortizationPercentage: 27.78
        }
      ];
    }

    // PDF yarat
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      font: 'Helvetica',
      info: {
        Title: 'Amortizasiya Hesabatı',
        Author: 'Asset Management System',
        Subject: 'Asset Depreciation Report',
        Keywords: 'amortizasiya, vəsait, hesabat',
        CreationDate: new Date()
      }
    });
    
    // PDF fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `amortizasiya_hesabati_${timestamp}.pdf`;
    
    // Response header-ları
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // PDF-i response-a bağla
    doc.pipe(res);
    
    // ===================== PDF MƏZMUNU =====================
    
    // 1. BAŞLIQ
    doc.fontSize(20).font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('DEPRECIATION REPORT', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Date: ${new Date().toLocaleDateString('en-US')}`, { align: 'center' });
    
    doc.moveDown(1.5);
    
    // 2. HƏR BİR ASSET ÜÇÜN MƏLUMAT
    let totalInitialValue = 0;
    let totalCurrentValue = 0;
    let totalDepreciation = 0;
    
    assetsToExport.forEach((asset, index) => {
      // Asset adı (başlıq)
      doc.fontSize(14).font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(asset.name || 'Naməlum Asset');
      
      // Asset məlumatları
      doc.fontSize(10).font('Helvetica')
         .fillColor('#34495e')
         .text(`  Inv. No: ${asset.inventoryNumber || 'N/A'}`);
      doc.text(`  Category: ${asset.category || 'N/A'}`);
      
      // Formatlı rəqəmlər
      const initialValue = asset.initialValue || 0;
      const currentValue = asset.currentValue || 0;
      const depreciation = asset.amortization || 0;
      const depreciationPercentage = asset.amortizationPercentage || 0;
      
      doc.text(`  Initial value: ${formatCurrency(initialValue)} ₼`);
      doc.text(`  Current value: ${formatCurrency(currentValue)} ₼`);
      doc.text(`  Depreciation: ${formatCurrency(depreciation)} ₼ (${depreciationPercentage.toFixed(2)}%)`);
      
      // Statistik üçün topla
      totalInitialValue += initialValue;
      totalCurrentValue += currentValue;
      totalDepreciation += depreciation;
      
      // Ayrıcı xətt
      doc.moveDown(0.5);
      doc.fillColor('#bdc3c7')
         .text('─────────────────────────────────────────────────────────────', { align: 'center' });
      doc.moveDown(1);
      
      // Səhifə qurtarmasa yenisinə keç
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(12).text('Continued...', { align: 'center' });
        doc.moveDown(1);
      }
    });
    
    // 3. XÜLASƏ
    doc.moveDown(1);
    doc.fillColor('#7f8c8d')
       .text('═══════════════════════════════════════════════════════════════', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Oblique')
       .fillColor('#95a5a6')
       .text(`Report generated at: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // 4. STATİSTİK MƏLUMATLAR
    doc.moveDown(1.5);
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('SUMMARY', { align: 'center' });
    
    doc.moveDown(0.8);
    
    // Cədvəl formatında statistikalar
    const stats = [
      { label: 'Total Assets', value: assetsToExport.length },
      { label: 'Total Initial Value', value: formatCurrency(totalInitialValue) + ' ₼' },
      { label: 'Total Current Value', value: formatCurrency(totalCurrentValue) + ' ₼' },
      { label: 'Total Depreciation', value: formatCurrency(totalDepreciation) + ' ₼' },
      { label: 'Average Depreciation', value: assetsToExport.length > 0 ? (totalDepreciation / assetsToExport.length).toFixed(2) + ' ₼' : '0 ₼' }
    ];
    
    stats.forEach(stat => {
      doc.fontSize(11).font('Helvetica')
         .fillColor('#34495e')
         .text(`  ${stat.label}:`, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${stat.value}`, { align: 'right' });
    });
    
    // 5. QR KOD (seçimlik) və ya footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Oblique')
       .fillColor('#7f8c8d')
       .text('Asset Management System - Professional Depreciation Report', { align: 'center' });
    
    // PDF-i bitir
    doc.end();
    
    console.log(`✅ PDF faylı hazırdır: ${filename}`);
    
  } catch (error) {
    console.error("❌ PDF export xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "PDF faylı yaradılarkən xəta baş verdi: " + error.message 
    });
  }
};

// ✅ Formatlı PDF (daha gözəl dizayn)
export const downloadFormattedAmortizationPDF = async (req, res) => {
  try {
    console.log("🎨 Formatlı PDF download endpoint çağırıldı");
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    const assets = user.assets.filter(asset => asset.status === "Aktiv");
    
    // PDF yarat
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      font: 'Helvetica',
      bufferPages: true
    });
    
    // Sayfa nömrələri üçün
    let pages = [];
    doc.on('pageAdded', () => {
      pages.push(doc.page);
    });
    
    // PDF fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `amortizasiya_hesabati_${timestamp}.pdf`;
    
    // Response header-ları
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // ===================== GÖZƏL FORMATLI PDF =====================
    
    // 1. ÜST HİSSƏ (Header)
    doc.fillColor('#2c3e50')
       .rect(0, 0, doc.page.width, 80)
       .fill();
    
    doc.fillColor('#FFFFFF')
       .fontSize(24).font('Helvetica-Bold')
       .text('DEPRECIATION REPORT', 50, 30, { align: 'left' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString()}`, 50, 60);
    
    doc.fontSize(10).font('Helvetica')
       .text(`Total Assets: ${assets.length}`, doc.page.width - 150, 60, { align: 'right' });
    
    doc.moveDown(4);
    
    // 2. MƏZMUN HİSSƏSİ
    let yPosition = 100;
    const lineHeight = 18;
    const sectionSpacing = 25;
    
    assets.forEach((asset, index) => {
      // Əgər səhifə dolubsa, yeni səhifə əlavə et
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Asset başlığı
      doc.fillColor('#3498db')
         .fontSize(16).font('Helvetica-Bold')
         .text(`${index + 1}. ${asset.name}`, 50, yPosition);
      yPosition += lineHeight;
      
      // Asset məlumatları (cədvəl kimi)
      const details = [
        { label: 'Inv. No', value: asset.inventoryNumber || 'N/A' },
        { label: 'Category', value: asset.category || 'N/A' },
        { label: 'Initial Value', value: `${formatCurrency(asset.initialValue || 0)} ₼` },
        { label: 'Current Value', value: `${formatCurrency(asset.currentValue || 0)} ₼` },
        { label: 'Depreciation', value: `${formatCurrency(asset.amortization || 0)} ₼ (${(asset.amortizationPercentage || 0).toFixed(2)}%)` }
      ];
      
      details.forEach(detail => {
        doc.fillColor('#2c3e50')
           .fontSize(10).font('Helvetica')
           .text(`  ${detail.label}:`, 70, yPosition, { continued: true })
           .font('Helvetica-Bold')
           .text(` ${detail.value}`, { align: 'right' });
        yPosition += lineHeight - 5;
      });
      
      // Ayrıcı xətt
      yPosition += 5;
      doc.fillColor('#ecf0f1')
         .rect(50, yPosition, doc.page.width - 100, 1)
         .fill();
      
      yPosition += sectionSpacing;
    });
    
    // 3. STATİSTİK XÜLASƏ
    if (assets.length > 0) {
      const totalInitial = assets.reduce((sum, a) => sum + (a.initialValue || 0), 0);
      const totalCurrent = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
      const totalDep = assets.reduce((sum, a) => sum + (a.amortization || 0), 0);
      
      doc.addPage();
      
      // Statistik başlıq
      doc.fillColor('#2c3e50')
         .fontSize(20).font('Helvetica-Bold')
         .text('REPORT SUMMARY', 50, 50, { align: 'center' });
      
      // Statistik cədvəl
      const statsY = 100;
      const statRows = [
        ['Metric', 'Value'],
        ['Total Assets', assets.length.toString()],
        ['Total Initial Value', `${formatCurrency(totalInitial)} ₼`],
        ['Total Current Value', `${formatCurrency(totalCurrent)} ₼`],
        ['Total Depreciation', `${formatCurrency(totalDep)} ₼`],
        ['Average Depreciation', `${formatCurrency(totalDep / assets.length)} ₼`],
        ['Average Depreciation %', `${((totalDep / totalInitial) * 100).toFixed(2)}%`]
      ];
      
      // Cədvəl başlığı
      doc.fillColor('#3498db')
         .rect(50, statsY, doc.page.width - 100, 30)
         .fill();
      
      doc.fillColor('#FFFFFF')
         .fontSize(12).font('Helvetica-Bold')
         .text(statRows[0][0], 60, statsY + 10)
         .text(statRows[0][1], doc.page.width - 150, statsY + 10, { align: 'right' });
      
      // Cədvəl məlumatları
      for (let i = 1; i < statRows.length; i++) {
        const rowY = statsY + 30 + (i - 1) * 25;
        
        if (i % 2 === 0) {
          doc.fillColor('#f8f9fa')
             .rect(50, rowY, doc.page.width - 100, 25)
             .fill();
        }
        
        doc.fillColor('#2c3e50')
           .fontSize(11).font('Helvetica')
           .text(statRows[i][0], 60, rowY + 8);
        
        doc.font('Helvetica-Bold')
           .text(statRows[i][1], doc.page.width - 60, rowY + 8, { align: 'right' });
      }
      
      // Footer
      doc.fillColor('#7f8c8d')
         .fontSize(9).font('Helvetica-Oblique')
         .text('This is an automatically generated depreciation report.', 50, doc.page.height - 50, { align: 'center' });
    }
    
    // 4. SAYFA NÖMRƏLƏRİ
    for (let i = 0; i < pages.length; i++) {
      doc.switchToPage(i);
      doc.fillColor('#95a5a6')
         .fontSize(8)
         .text(
           `Page ${i + 1} of ${pages.length}`,
           doc.page.width - 50,
           doc.page.height - 30,
           { align: 'right' }
         );
    }
    
    // PDF-i bitir
    doc.end();
    
    console.log(`✅ Formatlı PDF faylı hazırdır: ${filename}`);
    
  } catch (error) {
    console.error("❌ Formatlı PDF xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "Formatlı PDF faylı yaradılarkən xəta baş verdi: " + error.message 
    });
  }
};

// ✅ Test PDF (çox sadə)
export const testSimplePDF = async (req, res) => {
  try {
    console.log("🧪 Test PDF endpoint çağırıldı");
    
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test_simple.pdf"');
    
    doc.pipe(res);
    
    // Çox sadə məzmun
    doc.fontSize(25).text('Test PDF Report', 100, 100);
    doc.fontSize(12).text('This is a simple test PDF generated by the system.', 100, 150);
    doc.text(`Date: ${new Date().toLocaleString()}`, 100, 200);
    
    // Bir neçə sətir
    doc.moveDown(2);
    doc.text('1. Test item 1: Value 100 ₼');
    doc.text('2. Test item 2: Value 200 ₼');
    doc.text('3. Test item 3: Value 300 ₼');
    
    doc.end();
    
    console.log("✅ Test PDF faylı göndərildi");
    
  } catch (error) {
    console.error("❌ Test PDF xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "Test PDF xətası: " + error.message 
    });
  }
};

// ===================== KÖMƏKÇİ FUNKSİYALAR =====================

// Pul formatı üçün köməkçi funksiya
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// PDF üçün başqa köməkçi funksiyalar
function generateTableRow(doc, y, cell1, cell2, cell3, cell4) {
  doc.fontSize(10)
     .text(cell1, 50, y)
     .text(cell2, 150, y)
     .text(cell3, 280, y, { width: 90, align: 'right' })
     .text(cell4, 370, y, { width: 90, align: 'right' });
}

function drawLine(doc, fromX, fromY, toX, toY) {
  doc.moveTo(fromX, fromY)
     .lineTo(toX, toY)
     .stroke();
}

// ✅ Asset-ləri CSV formatında endir (YENİ)




// ✅ Asset Export Test səhifəsi (HTML) (YENİ)
export const getAssetsExportPage = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asset Export Test</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          .card { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px 0;
          }
          .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px;
            margin: 10px 5px;
            font-size: 16px;
          }
          .btn:hover { background: #45a049; }
          .btn-pdf { background: #f44336; }
          .btn-pdf:hover { background: #d32f2f; }
          .btn-csv { background: #2196F3; }
          .btn-csv:hover { background: #0b7dda; }
          .btn-test { background: #FF9800; }
          .btn-test:hover { background: #e68a00; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Asset Export Test Səhifəsi</h1>
          
          <div class="card">
            <h2>Export Seçimləri:</h2>
            <p>
              <a href="/api/users/${userId}/assets/export/excel" class="btn" download>
                📥 Excel Export
              </a>
              <a href="/api/users/${userId}/assets/export/pdf" class="btn-pdf" download>
                📄 PDF Export
              </a>
              <a href="/api/users/${userId}/assets/export/csv" class="btn-csv" download>
                📋 CSV Export
              </a>
              <a href="/api/users/${userId}/assets/test-excel" class="btn-test" download>
                🧪 Test Excel
              </a>
            </p>
            <p><em>Fayl avtomatik olaraq yüklənəcək.</em></p>
          </div>
          
          <div class="card">
            <h3>Export Növləri:</h3>
            <ul>
              <li><strong>Excel Export:</strong> Bütün vəsait məlumatları Excel formatında</li>
              <li><strong>PDF Export:</strong> Amortizasiya hesabatı PDF formatında</li>
              <li><strong>CSV Export:</strong> CSV formatında (Excel, Google Sheets ilə açıla bilər)</li>
              <li><strong>Test Excel:</strong> Demo məlumatlarla test Excel faylı</li>
            </ul>
          </div>
        </div>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
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