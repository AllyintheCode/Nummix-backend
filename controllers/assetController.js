import User from "../models/User.js";
import excel from 'exceljs';
// controllers/assetController.js
import Asset from "../models/Asset.js";
import { ExcelService } from '../services/exceleService.js';

import { PdfService } from '../services/pdfService.js';
import PDFDocument from 'pdfkit';
import mongoose from "mongoose";
const mapDepreciationMethodToBackend = (method) => {
  const map = {
    'straightLine': 'Düz xətt',
    'decliningBalance': 'Azalan qalıq',
    'unitsOfProduction': 'İstehsal həcmi'
  };
  return map[method] || 'Düz xətt';
};

const mapDepreciationMethodToFrontend = (method) => {
  const map = {
    'Düz xətt': 'straightLine',
    'Azalan qalıq': 'decliningBalance',
    'İstehsal həcmi': 'unitsOfProduction'
  };
  return map[method] || 'straightLine';
};

// 🏢 BÜTÜN VƏSAİTLƏRİ GƏTİR
export const getAllAssets = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { 
      category, 
      location, 
      status,
      department,      // frontend-dən gələn department adı (string)
      responsiblePerson,
      isInsured,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Filter obyekti yarat
    const filter = { userId, isDeleted: false };
    
    // Sadə sahə filtrləri
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (responsiblePerson) filter.responsiblePerson = responsiblePerson;
    if (isInsured !== undefined) filter.isInsured = isInsured === 'true';

    // 🔁 Department adı ilə filter (əgər göndərilibsə)
    if (department) {
      // Department adını ObjectId-ə çevir
      const dept = await Department.findOne({ 
        userId, 
        name: department,
        isActive: true 
      }).select('_id');
      
      if (dept) {
        filter.department = dept._id;  // ObjectId ilə filter
      } else {
        // Uyğun department tapılmadısa, heç bir nəticə qaytarma
        return res.json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 },
          stats: {
            assetCount: 0,
            totalValue: 0,
            currentValue: 0,
            depreciation: 0,
            activeAssets: 0
          }
        });
      }
    }

    // Sıralama
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Əsas sorğu: department adını da gətir
    const assets = await Asset.find(filter)
      .populate('department', 'name')           // department adını əlavə et
      .select('-document.bufferData -__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Ümumi say
    const totalCount = await Asset.countDocuments(filter);

    // 🔄 Frontend-in gözlədiyi formata çevir
    const formattedAssets = assets.map(asset => ({
      invNo: asset.inventoryNumber,
      name: asset.name,
      category: asset.category,
      account: asset.account,
      location: asset.department?.name || asset.location || 'Müəyyən edilməyib',
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      status: asset.status,
      _id: asset._id  // Edit və delete üçün ID əlavə et
    }));

    // 📊 Statistika (bütün assetlər üzrə, filter tətbiq edilmir)
    const stats = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $group: {
          _id: null,
          assetCount: { $sum: 1 },
          totalValue: { $sum: "$initialValue" },
          currentValue: { $sum: "$currentValue" },
          depreciation: { $sum: "$amortization" },
          activeAssets: { 
            $sum: { $cond: [{ $eq: ["$status", "Aktiv"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statResult = stats[0] || {
      assetCount: 0,
      totalValue: 0,
      currentValue: 0,
      depreciation: 0,
      activeAssets: 0
    };

    res.json({
      success: true,
      data: formattedAssets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: statResult  // Birbaşa statResult qaytarılır (artıq düzgün adlarla)
    });
  } catch (error) {
    console.error('❌ GET ALL ASSETS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// controllers/assetReportController.js


// 📊 BÜTÜN HESABATLARI GƏTİR
export const getReports = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { 
      type, 
      startDate, 
      endDate, 
      limit = 50,
      page = 1 
    } = req.query;

    console.log(`📊 Reports requested for user: ${userId}, type: ${type || 'all'}`);

    // 1. TARİX FİLTRİ YARAT
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // 2. İSTİFADƏÇİNİN BÜTÜN ASSETLƏRİNİN REPORTLARINI TOPLA
    const assets = await Asset.find({ userId })
      .select('excelReports pdfReports inventoryNumber name category department responsiblePerson')
      .lean();

    console.log(`✅ Found ${assets.length} assets for user ${userId}`);

    // 3. BÜTÜN REPORTLARI BİR YERDƏ TOPLA
    const allReports = [];

    assets.forEach(asset => {
      // Excel reportlarını əlavə et
      if (asset.excelReports && asset.excelReports.length > 0) {
        asset.excelReports.forEach(report => {
          // Tarix filterini tətbiq et
          if (Object.keys(dateFilter).length > 0) {
            const reportDate = new Date(report.generatedAt);
            if (dateFilter.$gte && reportDate < dateFilter.$gte) return;
            if (dateFilter.$lte && reportDate > dateFilter.$lte) return;
          }

          allReports.push({
            type: 'excel',
            reportId: report._id,
            title: report.title || 'Excel Hesabatı',
            description: report.description || '',
            fileName: report.fileName || 'report.xlsx',
            fileSize: report.fileSize || 0,
            fileSizeFormatted: formatFileSize(report.fileSize),
            generatedAt: report.generatedAt,
            assetId: asset._id,
            assetName: asset.name,
            assetInventory: asset.inventoryNumber,
            assetCategory: asset.category,
            assetDepartment: asset.department,
            assetResponsiblePerson: asset.responsiblePerson,
            dataCount: report.data ? report.data.length : 0,
            downloadUrl: `/api/users/${userId}/assets/export/excel?reportId=${report._id}`,
            previewUrl: `/api/users/${userId}/reports/${report._id}/preview`
          });
        });
      }
      
      // PDF reportlarını əlavə et
      if (asset.pdfReports && asset.pdfReports.length > 0) {
        asset.pdfReports.forEach(report => {
          // Tarix filterini tətbiq et
          if (Object.keys(dateFilter).length > 0) {
            const reportDate = new Date(report.generatedAt);
            if (dateFilter.$gte && reportDate < dateFilter.$gte) return;
            if (dateFilter.$lte && reportDate > dateFilter.$lte) return;
          }

          allReports.push({
            type: 'pdf',
            reportId: report._id,
            title: report.title || 'PDF Hesabatı',
            description: report.description || '',
            fileName: report.fileName || 'report.pdf',
            fileSize: report.fileSize || 0,
            fileSizeFormatted: formatFileSize(report.fileSize),
            generatedAt: report.generatedAt,
            assetId: asset._id,
            assetName: asset.name,
            assetInventory: asset.inventoryNumber,
            assetCategory: asset.category,
            assetDepartment: asset.department,
            assetResponsiblePerson: asset.responsiblePerson,
            dataCount: report.data ? report.data.length : 0,
            downloadUrl: `/api/users/${userId}/assets/export/pdf?reportId=${report._id}`,
            previewUrl: `/api/users/${userId}/reports/${report._id}/preview`
          });
        });
      }
    });

    console.log(`✅ Total reports found: ${allReports.length}`);

    // 4. TYPE FİLTRİ
    let filteredReports = allReports;
    if (type && type !== 'all') {
      filteredReports = allReports.filter(report => report.type === type);
      console.log(`✅ Filtered by type "${type}": ${filteredReports.length} reports`);
    }

    // 5. TARİXƏ GÖRƏ SIRALA
    filteredReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    // 6. PAGINATION
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = pageInt * limitInt;
    
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredReports.length / limitInt);

    // 7. STATİSTİKALARI HESABLA
    const stats = {
      totalReports: filteredReports.length,
      excelReports: filteredReports.filter(r => r.type === 'excel').length,
      pdfReports: filteredReports.filter(r => r.type === 'pdf').length,
      totalFileSize: filteredReports.reduce((sum, report) => sum + (report.fileSize || 0), 0),
      recentReports: filteredReports.filter(r => {
        const reportDate = new Date(r.generatedAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return reportDate >= thirtyDaysAgo;
      }).length
    };

    // 8. KATEQORİYA ÜZRƏ STATİSTİKA
    const categoryStats = filteredReports.reduce((acc, report) => {
      const category = report.assetCategory || 'Müəyyən edilməyib';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalSize: 0,
          lastReport: null
        };
      }
      acc[category].count++;
      acc[category].totalSize += report.fileSize || 0;
      
      const reportDate = new Date(report.generatedAt);
      if (!acc[category].lastReport || reportDate > new Date(acc[category].lastReport)) {
        acc[category].lastReport = report.generatedAt;
      }
      
      return acc;
    }, {});

    // 9. AYLAR ÜZRƏ STATİSTİKA (son 6 ay)
    const monthlyStats = {};
    const last6Months = [];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months.unshift(monthKey);
      monthlyStats[monthKey] = {
        excel: 0,
        pdf: 0,
        total: 0
      };
    }

    filteredReports.forEach(report => {
      const reportDate = new Date(report.generatedAt);
      const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey][report.type]++;
        monthlyStats[monthKey].total++;
      }
    });

    // 10. RESPONSE DATA STRUCTURE
    const responseData = {
      success: true,
      data: {
        reports: paginatedReports.map(report => ({
          ...report,
          generatedAtFormatted: formatDate(report.generatedAt),
          timeAgo: getTimeAgo(report.generatedAt)
        })),
        
        pagination: {
          page: pageInt,
          limit: limitInt,
          totalItems: filteredReports.length,
          totalPages: totalPages,
          hasNextPage: endIndex < filteredReports.length,
          hasPrevPage: startIndex > 0
        },

        statistics: {
          summary: {
            total: stats.totalReports,
            excel: stats.excelReports,
            pdf: stats.pdfReports,
            totalFileSize: stats.totalFileSize,
            totalFileSizeFormatted: formatFileSize(stats.totalFileSize),
            averageFileSize: stats.totalReports > 0 
              ? formatFileSize(stats.totalFileSize / stats.totalReports)
              : '0 KB',
            recentReports: stats.recentReports
          },

          byCategory: Object.entries(categoryStats).map(([category, data]) => ({
            category: category,
            count: data.count,
            percentage: stats.totalReports > 0 
              ? parseFloat(((data.count / stats.totalReports) * 100).toFixed(2))
              : 0,
            totalSize: formatFileSize(data.totalSize),
            averageSize: formatFileSize(data.totalSize / data.count),
            lastReport: data.lastReport ? formatDate(data.lastReport) : 'Yoxdur'
          })).sort((a, b) => b.count - a.count),

          byMonth: last6Months.map(month => ({
            month: month,
            excel: monthlyStats[month]?.excel || 0,
            pdf: monthlyStats[month]?.pdf || 0,
            total: monthlyStats[month]?.total || 0,
            trend: getTrend(monthlyStats, month)
          })),

          timeline: generateTimelineStats(filteredReports)
        },

        filters: {
          applied: {
            type: type || 'all',
            startDate: startDate || null,
            endDate: endDate || null,
            limit: limitInt,
            page: pageInt
          },
          availableTypes: [
            { value: 'all', label: 'Bütün Hesabatlar' },
            { value: 'excel', label: 'Excel Hesabatları' },
            { value: 'pdf', label: 'PDF Hesabatları' }
          ]
        },

        actions: {
          generateExcel: `/api/users/${userId}/reports/generate/excel`,
          generatePDF: `/api/users/${userId}/reports/generate/pdf`,
          exportAll: `/api/users/${userId}/reports/export/all`,
          deleteOldReports: `/api/users/${userId}/reports/cleanup`
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timezone: 'Asia/Baku',
        reportCount: filteredReports.length,
        oldestReport: filteredReports.length > 0 
          ? filteredReports[filteredReports.length - 1].generatedAt 
          : null,
        newestReport: filteredReports.length > 0 
          ? filteredReports[0].generatedAt 
          : null
      }
    };

    console.log("✅ Reports data prepared successfully");
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ GET REPORTS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// controllers/assetExportController.js (və ya harada istifadə edirsənsə)


// ✅ Bütün assetləri Excel formatında endir
export const downloadAllAssetsExcel = async (req, res) => {
  try {
    const userId = req.params.userId;
    const assets = await Asset.find({ userId }).select('-document.bufferData -__v');

    const columns = [
      { header: 'Inventory No', key: 'inventoryNumber', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Initial Value', key: 'initialValue', width: 15 },
      { header: 'Current Value', key: 'currentValue', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    const data = assets.map(a => ({
      inventoryNumber: a.inventoryNumber,
      name: a.name,
      category: a.category,
      location: a.location,
      initialValue: a.initialValue,
      currentValue: a.currentValue,
      status: a.status
    }));

    const filename = ExcelService.sanitizeFilename(`assets_${Date.now()}.xlsx`);
    const buffer = await ExcelService.generateExcel(data, 'Assets', columns, filename, {
      headerColor: '4CAF50',
      numberColumns: ['initialValue', 'currentValue']
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (error) {
    console.error('Excel error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 📊 HESABAT TƏFƏRRÜATLARI
export const getReportDetails = async (req, res) => {
  try {
    const { userId, reportId } = req.params;

    console.log(`📊 Report details requested: ${reportId} for user: ${userId}`);

    // Asset-ləri tap və reportu axtar
    const assets = await Asset.find({ userId })
      .select('excelReports pdfReports name inventoryNumber category')
      .lean();

    let foundReport = null;
    let sourceAsset = null;

    // Bütün assetlərdə reportu axtar
    for (const asset of assets) {
      // Excel reportlarında axtar
      if (asset.excelReports && asset.excelReports.length > 0) {
        const excelReport = asset.excelReports.find(r => r._id.toString() === reportId);
        if (excelReport) {
          foundReport = { ...excelReport, type: 'excel' };
          sourceAsset = asset;
          break;
        }
      }
      
      // PDF reportlarında axtar
      if (asset.pdfReports && asset.pdfReports.length > 0) {
        const pdfReport = asset.pdfReports.find(r => r._id.toString() === reportId);
        if (pdfReport) {
          foundReport = { ...pdfReport, type: 'pdf' };
          sourceAsset = asset;
          break;
        }
      }
    }

    if (!foundReport) {
      return res.status(404).json({ 
        success: false,
        message: 'Hesabat tapılmadı' 
      });
    }

    // Data analizi
    const dataAnalysis = analyzeReportData(foundReport.data || []);

    const responseData = {
      success: true,
      data: {
        report: {
          ...foundReport,
          generatedAtFormatted: formatDate(foundReport.generatedAt),
          fileSizeFormatted: formatFileSize(foundReport.fileSize || 0)
        },
        
        source: {
          assetId: sourceAsset._id,
          assetName: sourceAsset.name,
          assetInventory: sourceAsset.inventoryNumber,
          assetCategory: sourceAsset.category
        },

        content: {
          dataCount: foundReport.data ? foundReport.data.length : 0,
          sampleData: foundReport.data ? foundReport.data.slice(0, 5) : [],
          fields: foundReport.data && foundReport.data.length > 0 
            ? Object.keys(foundReport.data[0]) 
            : []
        },

        analysis: {
          ...dataAnalysis,
          qualityScore: calculateReportQualityScore(foundReport, dataAnalysis)
        },

        actions: {
          download: `/api/users/${userId}/reports/${reportId}/download`,
          preview: `/api/users/${userId}/reports/${reportId}/preview`,
          regenerate: `/api/users/${userId}/reports/${reportId}/regenerate`,
          delete: `/api/users/${userId}/reports/${reportId}`
        }
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('❌ GET REPORT DETAILS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// 📊 HESABATI SİL
export const deleteReport = async (req, res) => {
  try {
    const { userId, reportId } = req.params;

    console.log(`🗑️ Deleting report: ${reportId} for user: ${userId}`);

    const assets = await Asset.find({ userId });

    let deleted = false;
    let assetName = '';

    // Bütün assetlərdə reportu sil
    for (const asset of assets) {
      // Excel reportlarında sil
      if (asset.excelReports && asset.excelReports.length > 0) {
        const originalLength = asset.excelReports.length;
        asset.excelReports = asset.excelReports.filter(r => r._id.toString() !== reportId);
        
        if (asset.excelReports.length < originalLength) {
          await asset.save();
          deleted = true;
          assetName = asset.name;
          break;
        }
      }
      
      // PDF reportlarında sil
      if (asset.pdfReports && asset.pdfReports.length > 0) {
        const originalLength = asset.pdfReports.length;
        asset.pdfReports = asset.pdfReports.filter(r => r._id.toString() !== reportId);
        
        if (asset.pdfReports.length < originalLength) {
          await asset.save();
          deleted = true;
          assetName = asset.name;
          break;
        }
      }
    }

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'Hesabat tapılmadı' 
      });
    }

    res.json({
      success: true,
      message: 'Hesabat uğurla silindi',
      data: {
        reportId,
        assetName
      }
    });

  } catch (error) {
    console.error('❌ DELETE REPORT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// 📊 KÖHNƏ HESABATLARI TƏMİZLƏ
export const cleanupOldReports = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { days = 90 } = req.body;

    console.log(`🧹 Cleaning up reports older than ${days} days for user: ${userId}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const assets = await Asset.find({ userId });

    let deletedExcelCount = 0;
    let deletedPdfCount = 0;
    let totalFreedSize = 0;

    // Hər asset üçün köhnə reportları sil
    for (const asset of assets) {
      // Excel reportlarını təmizlə
      if (asset.excelReports && asset.excelReports.length > 0) {
        const originalLength = asset.excelReports.length;
        
        asset.excelReports = asset.excelReports.filter(report => {
          const reportDate = new Date(report.generatedAt);
          if (reportDate >= cutoffDate) {
            return true;
          }
          deletedExcelCount++;
          totalFreedSize += report.fileSize || 0;
          return false;
        });

        if (asset.excelReports.length < originalLength) {
          await asset.save();
        }
      }
      
      // PDF reportlarını təmizlə
      if (asset.pdfReports && asset.pdfReports.length > 0) {
        const originalLength = asset.pdfReports.length;
        
        asset.pdfReports = asset.pdfReports.filter(report => {
          const reportDate = new Date(report.generatedAt);
          if (reportDate >= cutoffDate) {
            return true;
          }
          deletedPdfCount++;
          totalFreedSize += report.fileSize || 0;
          return false;
        });

        if (asset.pdfReports.length < originalLength) {
          await asset.save();
        }
      }
    }

    const totalDeleted = deletedExcelCount + deletedPdfCount;

    res.json({
      success: true,
      message: `Köhnə hesabatlar uğurla təmizləndi`,
      data: {
        deletedExcelReports: deletedExcelCount,
        deletedPdfReports: deletedPdfCount,
        totalDeletedReports: totalDeleted,
        freedStorage: formatFileSize(totalFreedSize),
        cutoffDate: cutoffDate,
        remainingReports: await getTotalReportCount(userId)
      }
    });

  } catch (error) {
    console.error('❌ CLEANUP REPORTS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// 📊 HESABAT SAYINI GƏTİR
async function getTotalReportCount(userId) {
  const assets = await Asset.find({ userId })
    .select('excelReports pdfReports')
    .lean();

  let total = 0;
  
  assets.forEach(asset => {
    total += (asset.excelReports?.length || 0);
    total += (asset.pdfReports?.length || 0);
  });

  return total;
}

// ===================== KÖMƏKÇİ FUNKSİYALAR =====================

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} gün əvvəl`;
  } else if (diffHours > 0) {
    return `${diffHours} saat əvvəl`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} dəqiqə əvvəl`;
  } else {
    return 'indi';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTrend(monthlyStats, currentMonth) {
  const months = Object.keys(monthlyStats);
  const currentIndex = months.indexOf(currentMonth);
  
  if (currentIndex <= 0) return 'stable';
  
  const prevMonth = months[currentIndex - 1];
  const currentTotal = monthlyStats[currentMonth]?.total || 0;
  const prevTotal = monthlyStats[prevMonth]?.total || 0;
  
  if (prevTotal === 0) return 'up';
  if (currentTotal > prevTotal * 1.2) return 'up';
  if (currentTotal < prevTotal * 0.8) return 'down';
  return 'stable';
}

function generateTimelineStats(reports) {
  const timeline = {};
  
  // Son 12 ay üçün timeline yarat
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    timeline[monthKey] = 0;
  }
  
  // Reportları timeline-ə əlavə et
  reports.forEach(report => {
    const reportDate = new Date(report.generatedAt);
    const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (timeline[monthKey] !== undefined) {
      timeline[monthKey]++;
    }
  });
  
  // Array formatına çevir
  return Object.entries(timeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

function analyzeReportData(data) {
  if (!data || data.length === 0) {
    return {
      totalItems: 0,
      dataQuality: 'empty',
      completeness: 0,
      fields: [],
      hasNumericData: false
    };
  }

  const sample = data[0];
  const fields = Object.keys(sample);
  
  // Data tamlığını hesabla
  let completeFields = 0;
  fields.forEach(field => {
    const hasData = data.some(item => item[field] !== undefined && item[field] !== null && item[field] !== '');
    if (hasData) completeFields++;
  });
  
  const completeness = fields.length > 0 
    ? parseFloat(((completeFields / fields.length) * 100).toFixed(2))
    : 0;
  
  // Rəqəmsal data olub-olmadığını yoxla
  const numericFields = fields.filter(field => {
    return data.some(item => typeof item[field] === 'number');
  });
  
  return {
    totalItems: data.length,
    dataQuality: completeness >= 80 ? 'high' : completeness >= 60 ? 'medium' : 'low',
    completeness: completeness,
    fields: fields,
    fieldCount: fields.length,
    numericFields: numericFields,
    hasNumericData: numericFields.length > 0,
    sampleSize: data.length > 10 ? 10 : data.length
  };
}

function calculateReportQualityScore(report, analysis) {
  let score = 0;
  
  // Data sayı (0-30 bal)
  if (analysis.totalItems > 100) score += 30;
  else if (analysis.totalItems > 50) score += 25;
  else if (analysis.totalItems > 20) score += 20;
  else if (analysis.totalItems > 10) score += 15;
  else if (analysis.totalItems > 5) score += 10;
  else score += 5;
  
  // Data tamlığı (0-40 bal)
  if (analysis.completeness >= 90) score += 40;
  else if (analysis.completeness >= 80) score += 35;
  else if (analysis.completeness >= 70) score += 30;
  else if (analysis.completeness >= 60) score += 25;
  else if (analysis.completeness >= 50) score += 20;
  else score += 10;
  
  // Fayl ölçüsü (0-20 bal)
  const fileSizeMB = (report.fileSize || 0) / (1024 * 1024);
  if (fileSizeMB > 10 && report.type === 'excel') score += 20;
  else if (fileSizeMB > 5) score += 15;
  else if (fileSizeMB > 1) score += 10;
  else score += 5;
  
  // Rəqəmsal data (0-10 bal)
  if (analysis.hasNumericData) score += 10;
  
  return Math.min(score, 100);
}

// 🏢 ƏLAVƏ ƏMƏLİYYATLAR

// Vəsait statistikası
export const getAssetStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const stats = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          assetCount: { $sum: 1 },
          totalValue: { $sum: "$initialValue" },
          currentValue: { $sum: "$currentValue" },
          depreciation: { $sum: "$amortization" },
          activeAssets: { 
            $sum: { $cond: [{ $eq: ["$status", "Aktiv"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const summary = stats[0] || {
      assetCount: 0,
      totalValue: 0,
      currentValue: 0,
      depreciation: 0,
      activeAssets: 0
    };

    // Kateqoriyalara görə qruplaşdırma
    const byCategory = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: { $sum: "$currentValue" }
        }
      },
      { $sort: { totalValue: -1 } },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          totalValue: 1
        }
      }
    ]);

    // Statuslara görə qruplaşdırma
    const byStatus = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$currentValue" }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
          totalValue: 1
        }
      }
    ]);

    // Aylıq amortizasiya
    const monthlyDepreciationResult = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: "Aktiv" } },
      {
        $group: {
          _id: null,
          totalMonthlyDepreciation: { 
            $sum: { 
              $divide: ["$initialValue", { $multiply: ["$serviceLife", 12] }]
            }
          }
        }
      }
    ]);

    const monthlyDepreciation = monthlyDepreciationResult[0]?.totalMonthlyDepreciation || 0;

    res.json({
      success: true,
      data: {
        summary,
        byCategory,
        byStatus,
        monthlyDepreciation
      }
    });
  } catch (error) {
    console.error('❌ GET ASSET STATS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// 🏢 YENİ VƏSAİT YARAT (BUFFER İLƏ)
export const createAsset = async (req, res) => {
  try {
    console.log('🔍 CREATE ASSET DEBUG:');
    console.log('📋 Request Body Keys:', Object.keys(req.body));
    console.log('📋 Request Body Values:', req.body);
    
    // Frontend-dən gələn sahələr (invNo, residualValue, warranty, branch, responsible, serialNo, depreciationMethod)
    const {
      invNo,                // inventar nömrəsi
      name,
      category,
      account,
      location,             // yer (əgər department yoxdursa backup)
      initialValue,
      residualValue,        // cari dəyər (currentValue)
      purchaseDate,
      warranty,             // ay olaraq istifadə müddəti
      notes,
      depreciationMethod,   // frontend metod adı (straightLine, decliningBalance, unitsOfProduction)
      // Əlavə sahələr (frontend-də ola bilər, yoxdursa undefined)
      supplier,             // frontend-də 'responsible' kimi gəlir? Aşağıda bax
      serialNo,             // seriya nömrəsi
      branch,               // şöbə adı (department adı)
      responsiblePerson,    // məsul şəxs (əgər varsa)
      isInsured,
      tags
    } = req.body;

    // Validation check
    if (!account || account.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Account sahəsi tələb olunur"
      });
    }

    const userId = req.params.userId;
    
    // 1. Department ID-ni tap (əgər branch göndərilibsə)
    let departmentId = null;
    if (branch && branch.trim() !== '') {
      const department = await Department.findOne({ 
        userId, 
        name: branch.trim(),
        isActive: true 
      }).select('_id');
      if (department) {
        departmentId = department._id;
      } else {
        console.log(`⚠️ Department "${branch}" tapılmadı, location kimi saxlanılacaq.`);
        // departmentId null qalır, location istifadə olunacaq
      }
    }

    // 2. Dəyərləri parse et
    const parsedInitialValue = parseFloat(initialValue) || 0;
    const parsedResidualValue = parseFloat(residualValue) || undefined;
    
    // 3. ServiceLife: warranty (ay) -> il
    const warrantyMonths = parseInt(warranty) || 12; // default 12 ay
    const parsedServiceLife = Math.ceil(warrantyMonths / 12); // ilə çevir, yuxarı yuvarla
    // Minimum 1 il olsun (modeldə min 1)
    const finalServiceLife = Math.max(parsedServiceLife, 1);
    
    // 4. PurchaseDate
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
    
    // 5. Cari dəyər məntiqi (backend-dəki hesablama)
    let finalCurrentValue;
    let finalAmortization;
    let finalAmortizationPercentage;
    let finalStatus;
    
    if (parsedResidualValue !== undefined && !isNaN(parsedResidualValue)) {
      // Əgər frontend residualValue göndəribsə, onu istifadə et
      finalCurrentValue = parsedResidualValue;
      if (finalCurrentValue > parsedInitialValue) {
        return res.status(400).json({
          success: false,
          message: `Cari dəyər (${finalCurrentValue}) ilkin dəyərdən (${parsedInitialValue}) böyük ola bilməz`
        });
      }
      finalAmortization = parsedInitialValue - finalCurrentValue;
      finalAmortizationPercentage = parsedInitialValue > 0 ? (finalAmortization / parsedInitialValue) * 100 : 0;
      finalStatus = finalCurrentValue > 0 ? "Aktiv" : "Sıradan çıxıb";
    } else {
      // Avtomatik hesabla (köhnə funksiya)
      const calculated = calculateCurrentValueByTime(parsedInitialValue, parsedPurchaseDate, finalServiceLife);
      finalCurrentValue = calculated.currentValue;
      finalAmortization = calculated.amortization;
      finalAmortizationPercentage = calculated.amortizationPercentage;
      finalStatus = calculated.status;
    }

    // 6. Depreciation metodunu çevir
    const backendDepreciationMethod = mapDepreciationMethodToBackend(depreciationMethod || 'straightLine');

    // 7. Supplier: frontend-də 'responsible' ola bilər, yoxsa 'supplier'?
    // Frontend formunda 'responsible' inputu var (təchizatçı). Onu 'supplier' kimi qəbul edirik.
    const finalSupplier = req.body.responsible || supplier || '';

    // 8. Serial number
    const finalSerialNumber = serialNo || serialNumber || '';

    // 9. Tags
    let finalTags = [];
    if (tags) {
      finalTags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    // Asset datasını yığ
    const assetData = {
      userId,
      inventoryNumber: invNo || `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name?.trim(),
      category: category?.trim(),
      account: account?.trim(),
      location: location?.trim(),  // əgər department yoxdursa, bu işə düşəcək
      initialValue: parsedInitialValue,
      currentValue: finalCurrentValue,
      amortization: finalAmortization,
      amortizationPercentage: finalAmortizationPercentage,
      status: finalStatus,
      purchaseDate: parsedPurchaseDate,
      serviceLife: finalServiceLife,
      notes: notes?.trim(),
      depreciationMethod: backendDepreciationMethod,
      supplier: finalSupplier,
      serialNumber: finalSerialNumber,
      department: departmentId,  // ObjectId və ya null
      responsiblePerson: responsiblePerson?.trim(),
      isInsured: Boolean(isInsured),
      tags: finalTags
      // digər sahələr (warrantyExpiryDate, nextMaintenanceDate, barcode, insuranceExpiryDate) əgər frontenddən gəlirsə əlavə et
    };

    // Əgər frontenddən əlavə tarixlər gəlibsə, onları da əlavə et
    if (req.body.warrantyExpiryDate) assetData.warrantyExpiryDate = new Date(req.body.warrantyExpiryDate);
    if (req.body.nextMaintenanceDate) assetData.nextMaintenanceDate = new Date(req.body.nextMaintenanceDate);
    if (req.body.insuranceExpiryDate) assetData.insuranceExpiryDate = new Date(req.body.insuranceExpiryDate);
    if (req.body.barcode) assetData.barcode = req.body.barcode;

    // Fayl yükləmə
    if (req.file) {
      assetData.document = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        bufferData: req.file.buffer.toString('base64'),
        uploadedAt: new Date()
      };
    }

    const newAsset = await Asset.create(assetData);
    
    // Cavabı frontend formatına çevir
    const assetResponse = {
      invNo: newAsset.inventoryNumber,
      name: newAsset.name,
      category: newAsset.category,
      account: newAsset.account,
      location: newAsset.department ? (await newAsset.populate('department', 'name')).department.name : newAsset.location,
      initialValue: newAsset.initialValue,
      currentValue: newAsset.currentValue,
      status: newAsset.status,
      // əlavə məlumatlar (əgər lazımdırsa)
      id: newAsset._id
    };

    res.status(201).json({
      success: true,
      data: assetResponse,
      message: "Vəsait uğurla əlavə edildi"
    });
    
  } catch (error) {
    console.error('❌ CREATE ASSET Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// 🏢 BÜTÜN VƏSAİTLƏRİ GƏTİR

// 🏢 VƏSAİTİ ID İLƏ GƏTİR
export const getAssetById = async (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ 
      _id: assetId, 
      userId,
      isDeleted: false 
    })
    .populate('department', 'name')
    .select('-document.bufferData -__v');

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    // Frontend formatına çevir
    const formattedAsset = {
      invNo: asset.inventoryNumber,
      name: asset.name,
      category: asset.category,
      account: asset.account,
      location: asset.department?.name || asset.location || 'Müəyyən edilməyib',
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      status: asset.status,
      // Əlavə məlumatlar (əgər frontend tələb edirsə)
      purchaseDate: asset.purchaseDate,
      serviceLife: asset.serviceLife,
      depreciationMethod: asset.depreciationMethod,
      serialNumber: asset.serialNumber,
      supplier: asset.supplier,
      notes: asset.notes,
      departmentId: asset.department?._id,
      responsiblePerson: asset.responsiblePerson,
      warrantyExpiryDate: asset.warrantyExpiryDate,
      isInsured: asset.isInsured
    };

    res.json({
      success: true,
      data: formattedAsset
    });
  } catch (error) {
    console.error('❌ GET ASSET BY ID Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};


// 🏢 VƏSAİTİ YENİLƏ
export const updateAsset = async (req, res) => {
  try {
    const { userId, assetId } = req.params;
    
    // Əvvəlcə asset-i tap
    const asset = await Asset.findOne({ _id: assetId, userId, isDeleted: false });
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    // Frontend-dən gələn məlumatlar (yenə eyni formatda)
    const {
      invNo,
      name,
      category,
      account,
      location,
      initialValue,
      residualValue,
      purchaseDate,
      warranty,
      notes,
      depreciationMethod,
      supplier,
      serialNo,
      branch,
      responsiblePerson,
      isInsured,
      tags
    } = req.body;

    // Update datasını yığ
    const updateData = {};

    if (invNo !== undefined) updateData.inventoryNumber = invNo;
    if (name !== undefined) updateData.name = name.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (account !== undefined) updateData.account = account.trim();
    if (location !== undefined) updateData.location = location.trim();
    
    // İlkin dəyər dəyişərsə, cari dəyəri yenidən hesablamaq olar, amma sadəcə qəbul edək
    if (initialValue !== undefined) {
      const parsedInitial = parseFloat(initialValue);
      if (!isNaN(parsedInitial)) updateData.initialValue = parsedInitial;
    }
    
    // Cari dəyər (residualValue)
    if (residualValue !== undefined) {
      const parsedResidual = parseFloat(residualValue);
      if (!isNaN(parsedResidual)) {
        updateData.currentValue = parsedResidual;
        // Amortizasiyanı yenidən hesabla
        const initial = updateData.initialValue !== undefined ? updateData.initialValue : asset.initialValue;
        updateData.amortization = initial - parsedResidual;
        updateData.amortizationPercentage = initial > 0 ? (updateData.amortization / initial) * 100 : 0;
        updateData.status = parsedResidual > 0 ? "Aktiv" : "Sıradan çıxıb";
      }
    }

    // Warranty (ay) -> serviceLife (il)
    if (warranty !== undefined) {
      const warrantyMonths = parseInt(warranty) || 12;
      updateData.serviceLife = Math.ceil(warrantyMonths / 12);
    }

    if (purchaseDate) updateData.purchaseDate = new Date(purchaseDate);
    if (notes !== undefined) updateData.notes = notes.trim();
    
    // Depreciation method
    if (depreciationMethod !== undefined) {
      updateData.depreciationMethod = mapDepreciationMethodToBackend(depreciationMethod);
    }

    // Supplier (frontend-də 'responsible' və ya 'supplier')
    const finalSupplier = req.body.responsible || supplier;
    if (finalSupplier !== undefined) updateData.supplier = finalSupplier.trim();

    // Serial number
    if (serialNo !== undefined) updateData.serialNumber = serialNo.trim();

    // Department (branch adı -> ObjectId)
    if (branch !== undefined) {
      if (branch && branch.trim() !== '') {
        const department = await Department.findOne({ 
          userId, 
          name: branch.trim(),
          isActive: true 
        }).select('_id');
        if (department) {
          updateData.department = department._id;
          // location-u təmizləmək istəyiriksə, edə bilərik, amma saxlanıla da bilər
        } else {
          // Tapılmadısa, department-i null et, location olduğu kimi qalsın
          updateData.department = null;
        }
      } else {
        updateData.department = null;
      }
    }

    if (responsiblePerson !== undefined) updateData.responsiblePerson = responsiblePerson.trim();
    if (isInsured !== undefined) updateData.isInsured = Boolean(isInsured);

    // Tags
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }

    // Tarixlər (əgər gəlibsə)
    if (req.body.warrantyExpiryDate) updateData.warrantyExpiryDate = new Date(req.body.warrantyExpiryDate);
    if (req.body.nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(req.body.nextMaintenanceDate);
    if (req.body.insuranceExpiryDate) updateData.insuranceExpiryDate = new Date(req.body.insuranceExpiryDate);
    if (req.body.barcode) updateData.barcode = req.body.barcode;

    // Fayl yükləmə
    if (req.file) {
      updateData.document = {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        bufferData: req.file.buffer.toString('base64'),
        uploadedAt: new Date()
      };
    }

    // Asset-i yenilə
    const updatedAsset = await Asset.findOneAndUpdate(
      { _id: assetId, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name');

    // Cavabı frontend formatına çevir
    const assetResponse = {
      invNo: updatedAsset.inventoryNumber,
      name: updatedAsset.name,
      category: updatedAsset.category,
      account: updatedAsset.account,
      location: updatedAsset.department?.name || updatedAsset.location,
      initialValue: updatedAsset.initialValue,
      currentValue: updatedAsset.currentValue,
      status: updatedAsset.status,
      id: updatedAsset._id
    };

    res.json({
      success: true,
      data: assetResponse,
      message: "Vəsait uğurla yeniləndi"
    });

  } catch (error) {
    console.error('❌ UPDATE ASSET Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// 🏢 VƏSAİTİ SİL
export const deleteAsset = async (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const asset = await Asset.findOneAndDelete({ 
      _id: assetId, 
      userId 
    });

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    res.json({
      success: true,
      message: "Vəsait uğurla silindi",
      data: {
        id: asset._id,
        name: asset.name
      }
    });
  } catch (error) {
    console.error('❌ DELETE ASSET Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// controllers/assetController.js

// 🗑️ Vəsaiti inventar nömrəsinə görə sil (frontend üçün)
export const deleteAssetByInvNo = async (req, res) => {
  try {
    const { userId, invNo } = req.params;

    const asset = await Asset.findOneAndDelete({ 
      inventoryNumber: invNo, 
      userId 
    });

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Bu inventar nömrəsinə aid vəsait tapılmadı" 
      });
    }

    res.json({
      success: true,
      message: "Vəsait uğurla silindi",
      data: {
        id: asset._id,
        name: asset.name,
        invNo: asset.inventoryNumber
      }
    });
  } catch (error) {
    console.error('❌ DELETE ASSET BY INVNO Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// 🏢 VƏSAİT SƏNƏD ƏMƏLİYYATLARI

// Sənəd məlumatlarını gətir
export const getAssetDocument = async (req, res) => {
  try {
    console.log('🔍 GET ASSET DOCUMENT called');
    const { userId, assetId } = req.params;

    // ⭐ bufferData sahəsini də gətirmək üçün select istifadə et
    const asset = await Asset.findOne({ 
      _id: assetId, 
      userId 
    }).select('+document.bufferData'); // ⭐ BU ƏLAVƏ EDİLDİ

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    console.log('📄 Asset document exists:', !!asset.document);
    console.log('📦 Document structure:', asset.document ? {
      keys: Object.keys(asset.document),
      hasBufferData: !!asset.document.bufferData,
      bufferDataLength: asset.document.bufferData ? asset.document.bufferData.length : 0,
      mimeType: asset.document.mimeType,
      originalName: asset.document.originalName
    } : 'No document');
    
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

    // bufferData yoxdursa error ver
    if (!asset.document.bufferData) {
      console.error('❌ bufferData not found in document');
      return res.status(500).json({
        success: false,
        message: "Fayl məlumatı tapılmadı",
        documentKeys: Object.keys(asset.document)
      });
    }

    // Content-Type təyin et
    res.set('Content-Type', asset.document.mimeType || 'application/octet-stream');
    
    // Faylı attachment kimi göndər (avtomatik download)
    res.set('Content-Disposition', `attachment; filename="${asset.document.originalName || 'document.pdf'}"`);
    
    // Base64 string'i Buffer-ə çevir və göndər
    const fileBuffer = Buffer.from(asset.document.bufferData, 'base64');
    console.log(`✅ Sending file: ${asset.document.originalName}, Size: ${fileBuffer.length} bytes`);
    
    return res.send(fileBuffer);

  } catch (error) {
    console.error('❌ GET ASSET DOCUMENT Error:', error);
    
    // Əgər JSON istəyirsə, JSON qaytar
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false,
        message: error.message,
        errorType: error.constructor.name
      });
    }
    
    // Əks halda sadə error mesajı
    res.status(500).send(`Server xətası: ${error.message}`);
  }
};

// Sənəd yüklə
export const uploadAssetDocument = async (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Fayl seçilməyib" 
      });
    }

    // Sənəd məlumatlarını yenilə
    asset.document = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      bufferData: req.file.buffer.toString('base64'),
      uploadedAt: new Date()
    };

    await asset.save();

    res.json({
      success: true,
      message: "Sənəd uğurla yükləndi",
      data: {
        document: {
          originalName: asset.document.originalName,
          mimeType: asset.document.mimeType,
          fileSize: asset.document.fileSize,
          uploadedAt: asset.document.uploadedAt
        }
      }
    });
  } catch (error) {
    console.error('❌ UPLOAD DOCUMENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Sənədi sil
export const deleteAssetDocument = async (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset || !asset.document) {
      return res.status(404).json({ 
        success: false,
        message: "Sənəd tapılmadı" 
      });
    }

    // Sənəd sahəsini sil
    asset.document = undefined;
    await asset.save();

    res.json({
      success: true,
      message: "Sənəd uğurla silindi"
    });
  } catch (error) {
    console.error('❌ DELETE DOCUMENT Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Sənədi yüklə (download) - DÜZƏLDİLMİŞ
export const downloadAssetDocument = async (req, res) => {
  try {
    console.log('⬇️ DOWNLOAD ASSET DOCUMENT');
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset || !asset.document || !asset.document.bufferData) {
      return res.status(404).json({ 
        success: false,
        message: "Sənəd tapılmadı" 
      });
    }

    // Base64-dən Buffer-a çevir
    const fileBuffer = Buffer.from(asset.document.bufferData, 'base64');
    const fileName = asset.document.originalName;
    
    // Təhlükəsiz fayl adı yarat
    const safeFileName = fileName.replace(/[^\w\s.-]/gi, '_');
    
    // Content-Disposition header-ını təyin et
    const contentDisposition = `attachment; filename="${safeFileName}"`;
    
    // Headers
    res.writeHead(200, {
      'Content-Type': asset.document.mimeType,
      'Content-Disposition': contentDisposition,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('📤 Download started:', {
      fileName: safeFileName,
      size: fileBuffer.length,
      type: asset.document.mimeType
    });

    // Buffer-ı göndər
    res.end(fileBuffer);

  } catch (error) {
    console.error('❌ DOWNLOAD ERROR:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: error.message
      });
    }
  }
};

// ===================== EXCEL EXPORT FUNKSİYALARI =====================



// ===================== PDF EXPORT FUNKSİYALARI =====================

// ✅ Aktiv assetləri PDF formatında endir - DÜZƏLDİLMİŞ VERSİYA
// ✅ YENİ DƏYİŞDİRİLMİŞ VERSİYA
// ✅ DÜZGÜN FONTLAR İLƏ PDF GENERATOR
export const generateAndDownloadPdf = async (req, res) => {
  try {
    console.log("📄 generateAndDownloadPdf çağırıldı");
    
    const userId = req.params.userId;
    
    // BÜTÜN ASSETLƏRİ GƏTİR
    const allAssets = await Asset.find({ 
      userId,
      isDeleted: { $ne: true }
    }).select('-document.bufferData -__v');

    console.log(`📊 Cəmi ${allAssets.length} asset tapıldı`);
    
    // Statuslarına görə qruplaşdır
    const statusGroups = {};
    allAssets.forEach(asset => {
      const status = asset.status || 'Statussuz';
      if (!statusGroups[status]) {
        statusGroups[status] = 0;
      }
      statusGroups[status]++;
    });
    
    console.log('📋 Asset statusları:', statusGroups);
    
    // ƏGƞR HƏÇ BİR ASSET YOXDURSA, TEST MƏLUMAT VER
    let assetsToExport = allAssets;
    if (allAssets.length === 0) {
      console.log("⚠️ Heç bir asset tapılmadı. Test məlumat əlavə edilir...");
      assetsToExport = [
        {
          inventoryNumber: "INV-TEST-001",
          name: "Test Kompyuter",
          category: "Test Kateqoriya",
          initialValue: 1000,
          currentValue: 800,
          amortization: 200,
          amortizationPercentage: 20
        }
      ];
    }

    // ✅ PDF YARADARKƏN FONT TƏYİN ET
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
      // Font burada təyin edilmir - aşağıda təyin edəcəyik
    });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `assets_report_${timestamp}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // ✅ FONT SEÇİMİ:
    // 1. Helvetica (əgər mövcuddursa)
    // 2. Arial Unicode MS (daha yaxşı Unicode dəstəyi)
    // 3. Unicode simvollar olmadan yazmaq
    
    // Başlıq - Unicode simvollar olmadan
    doc.fontSize(20)
       .fillColor('#2c3e50')
       .text('BUTUN VESAITLERIN HESABATI', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .fillColor('#7f8c8d')
       .text(`Tarix: ${new Date().toLocaleDateString('az-AZ')}`, { align: 'center' });
    
    // Unicode simvollar olmadan yaz
    doc.text(`Umumi sayi: ${assetsToExport.length}`, { align: 'center' });
    
    // Status statistikası
    doc.moveDown(0.5);
    doc.fontSize(10)
       .text('Status statistikasi:');
    
    Object.entries(statusGroups).forEach(([status, count], index) => {
      // Status adını sadələşdir
      let safeStatus = status;
      // Xüsusi Azərbaycan simvollarını əvəz et
      safeStatus = safeStatus
        .replace(/ə/g, 'e')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/Ə/g, 'E')
        .replace(/Ç/g, 'C')
        .replace(/Ş/g, 'S')
        .replace(/Ü/g, 'U')
        .replace(/Ö/g, 'O')
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G');
      
      doc.text(`  ${safeStatus}: ${count} asset`);
    });
    
    doc.moveDown(1.5);
    
    // HƏR BİR ASSET ÜÇÜN MƏLUMAT
    assetsToExport.forEach((asset, index) => {
      // Asset adını sadələşdir
      let safeName = asset.name || 'Adsz Vəsait';
      safeName = safeName
        .replace(/ə/g, 'e')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/Ə/g, 'E')
        .replace(/Ç/g, 'C')
        .replace(/Ş/g, 'S')
        .replace(/Ü/g, 'U')
        .replace(/Ö/g, 'O')
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G');
      
      // Kateqoriyanı sadələşdir
      let safeCategory = asset.category || 'Yoxdur';
      safeCategory = safeCategory
        .replace(/ə/g, 'e')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g');
      
      // Statusu sadələşdir
      let safeStatus = asset.status || 'Yoxdur';
      safeStatus = safeStatus
        .replace(/ə/g, 'e')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/Ə/g, 'E')
        .replace(/Ç/g, 'C')
        .replace(/Ş/g, 'S')
        .replace(/Ü/g, 'U')
        .replace(/Ö/g, 'O')
        .replace(/İ/g, 'I')
        .replace(/Ğ/g, 'G');
      
      doc.fontSize(14)
         .fillColor('#2c3e50')
         .text(`${index + 1}. ${safeName}`);
      
      doc.fontSize(10)
         .fillColor('#34495e')
         .text(`  Inventar №: ${asset.inventoryNumber || 'Yoxdur'}`);
      doc.text(`  Kateqoriya: ${safeCategory}`);
      doc.text(`  Status: ${safeStatus}`);
      
      const initialValue = asset.initialValue || 0;
      const currentValue = asset.currentValue || 0;
      const depreciation = asset.amortization || 0;
      const depreciationPercentage = asset.amortizationPercentage || 0;
      
      doc.text(`  Ilkin deyer: ${formatCurrency(initialValue)} AZN`);
      doc.text(`  Cari deyer: ${formatCurrency(currentValue)} AZN`);
      doc.text(`  Amortizasiya: ${formatCurrency(depreciation)} AZN (${depreciationPercentage.toFixed(2)}%)`);
      
      doc.moveDown(0.5);
      doc.fillColor('#bdc3c7')
         .text('-------------------------------------------------------', { align: 'center' });
      doc.moveDown(1);
      
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(12).text('Davam...', { align: 'center' });
        doc.moveDown(1);
      }
    });
    
    doc.end();
    
    console.log(`✅ PDF faylı hazırdır: ${filename}`);
    
  } catch (error) {
    console.error("❌ PDF export xətası:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: "PDF faylı yaradılarkən xəta baş verdi: " + error.message 
      });
    }
  }
};
// ✅ Amortizasiya hesabatını PDF formatında endir - DÜZƏLDİLMİŞ
export const downloadAmortizationReportPDF = async (req, res) => {
  try {
    console.log("📄 PDF download endpoint çağırıldı");
    
    const userId = req.params.userId;

    const assets = await Asset.find({ 
      userId, 
      status: "Aktiv",
      isDeleted: false 
    }).select('-document.bufferData -__v');

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
        }
      ];
    }

    // PDF yarat
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      font: 'Helvetica'
    });
    
    // Təhlükəsiz fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `depreciation_report_${timestamp}.pdf`;
    
    // Response header-ları
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // ===================== PDF MƏZMUNU =====================
    
    // 1. BAŞLIQ
    doc.fontSize(20).font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('DEPRECIATION REPORT', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Date: ${new Date().toLocaleDateString('az-AZ')}`, { align: 'center' });
    
    doc.moveDown(1.5);
    
    // 2. HƏR BİR ASSET ÜÇÜN MƏLUMAT
    assetsToExport.forEach((asset, index) => {
      // Asset adı (başlıq)
      doc.fontSize(14).font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(asset.name || 'Unknown Asset');
      
      // Asset məlumatları
      doc.fontSize(10).font('Helvetica')
         .fillColor('#34495e')
         .text(`  Inventory No: ${asset.inventoryNumber || 'None'}`);
      doc.text(`  Category: ${asset.category || 'None'}`);
      
      // Formatlı rəqəmlər
      const initialValue = asset.initialValue || 0;
      const currentValue = asset.currentValue || 0;
      const depreciation = asset.amortization || 0;
      const depreciationPercentage = asset.amortizationPercentage || 0;
      
      doc.text(`  Initial Value: ${formatCurrency(initialValue)} AZN`);
      doc.text(`  Current Value: ${formatCurrency(currentValue)} AZN`);
      doc.text(`  Depreciation: ${formatCurrency(depreciation)} AZN (${depreciationPercentage.toFixed(2)}%)`);
      
      // Ayrıcı xətt
      doc.moveDown(0.5);
      doc.fillColor('#bdc3c7')
         .text('-------------------------------------------------------', { align: 'center' });
      doc.moveDown(1);
      
      // Səhifə qurtarmasa yenisinə keç
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(12).text('Continue...', { align: 'center' });
        doc.moveDown(1);
      }
    });
    
    // 3. XÜLASƏ
    doc.moveDown(1);
    doc.fillColor('#7f8c8d')
       .text('=======================================================', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('SUMMARY', { align: 'center' });
    
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

// ✅ Test PDF (çox sadə) - DÜZƏLDİLMİŞ
export const testSimplePDF = async (req, res) => {
  try {
    console.log("🧪 Test PDF endpoint çağırıldı");
    
    const doc = new PDFDocument();
    
    // Təhlükəsiz fayl adı
    const filename = "test_simple.pdf";
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);
    
    // Çox sadə məzmun
    doc.fontSize(25).text('Test PDF Report', 100, 100);
    doc.fontSize(12).text('This is a simple test PDF report generated by the system.', 100, 150);
    doc.text(`Date: ${new Date().toLocaleString('az-AZ')}`, 100, 200);
    
    // Bir neçə sətir
    doc.moveDown(2);
    doc.text('1. Test asset 1: Value 100 AZN');
    doc.text('2. Test asset 2: Value 200 AZN');
    doc.text('3. Test asset 3: Value 300 AZN');
    
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

// Formatlı valyuta göstəricisi
function formatCurrency(amount) {
  return new Intl.NumberFormat('az-AZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}


// ✅ Kateqoriya üzrə Excel yüklə
export const downloadCategoryExcel = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kateqoriya reportunu yarat
    const categoryReport = await Asset.generateCategoryReport(userId);

    // Excel faylı yarat
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Kateqoriyalar');

    // Sütun başlıqları
    worksheet.columns = [
      { header: 'Kateqoriya', key: 'category', width: 30 },
      { header: 'Sayı', key: 'count', width: 15 },
      { header: 'Ümumi İlkin Dəyər', key: 'totalInitial', width: 20 },
      { header: 'Ümumi Cari Dəyər', key: 'totalCurrent', width: 20 },
      { header: 'Ümumi Amortizasiya', key: 'totalAmortization', width: 20 }
    ];

    // Məlumatları əlavə et
    categoryReport.forEach(cat => {
      worksheet.addRow({
        category: cat._id,
        count: cat.count,
        totalInitial: cat.totalInitialValue,
        totalCurrent: cat.totalCurrentValue,
        totalAmortization: cat.totalAmortization
      });
    });

    // Formatla
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.font = { bold: true };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E6F3FF' }
        };
      }
      
      // Rəqəm formatı
      const numberCells = [3, 4, 5];
      numberCells.forEach(col => {
        const cell = row.getCell(col);
        cell.numFmt = '#,##0.00';
      });
    });

    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="kateqoriya_hesabati.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    res.end(buffer);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Kateqoriya Excel faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};
export const exportAssetsToExcel = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const assets = await Asset.find({ userId })
      .select('-document.bufferData -__v');

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Vəsaitlər');

    // Sütun başlıqları
    worksheet.columns = [
      { header: 'Inventar №', key: 'inventoryNumber', width: 20 },
      { header: 'Ad', key: 'name', width: 30 },
      { header: 'Kateqoriya', key: 'category', width: 20 },
      { header: 'Hesab', key: 'account', width: 15 },
      { header: 'Yer', key: 'location', width: 20 },
      { header: 'Şöbə', key: 'department', width: 20 },
      { header: 'Məsul şəxs', key: 'responsiblePerson', width: 25 },
      { header: 'İlkin Dəyər', key: 'initialValue', width: 15 },
      { header: 'Cari Dəyər', key: 'currentValue', width: 15 },
      { header: 'Amortizasiya', key: 'amortization', width: 15 },
      { header: 'Amortizasiya %', key: 'amortizationPercentage', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Alış Tarixi', key: 'purchaseDate', width: 15 },
      { header: 'Xidmət Müddəti (il)', key: 'serviceLife', width: 15 },
      { header: 'Seriya №', key: 'serialNumber', width: 20 },
      { header: 'Təchizatçı', key: 'supplier', width: 20 },
      { header: 'Qeydlər', key: 'notes', width: 40 }
    ];

    // Başlıq formatı
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4CAF50' }
    };

    // Məlumatları əlavə et
    assets.forEach(asset => {
      worksheet.addRow({
        inventoryNumber: asset.inventoryNumber,
        name: asset.name,
        category: asset.category,
        account: asset.account,
        location: asset.location,
        department: asset.department,
        responsiblePerson: asset.responsiblePerson,
        initialValue: asset.initialValue,
        currentValue: asset.currentValue,
        amortization: asset.amortization,
        amortizationPercentage: `${asset.amortizationPercentage}%`,
        status: asset.status,
        purchaseDate: asset.purchaseDate.toLocaleDateString('az-AZ'),
        serviceLife: asset.serviceLife,
        serialNumber: asset.serialNumber,
        supplier: asset.supplier,
        notes: asset.notes
      });
    });

    // Formatla
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Rəqəm formatı
        const valueColumns = [8, 9, 10]; // İlkin, Cari, Amortizasiya sütunları
        valueColumns.forEach(col => {
          const cell = row.getCell(col);
          cell.numFmt = '#,##0.00';
        });
        
        // Mərkəzə düzlə
        row.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="vesaitler.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    res.end(buffer);
    
    console.log('✅ Excel export completed');

  } catch (error) {
    console.error('❌ EXPORT TO EXCEL Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
export const generateAndDownloadExcel = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Active assetləri tap
    const activeAssets = await Asset.find({ 
      userId, 
      status: "Aktiv" 
    }).select('-document.bufferData -__v');

    // Excel faylı yarat
    const excelResult = await generateExcelBuffer(activeAssets, "Aktiv Vəsaitlər");
    
    // Database-də qeyd et (ilk asset-ə report əlavə et)
    if (activeAssets.length > 0) {
      const firstAsset = await Asset.findById(activeAssets[0]._id);
      if (firstAsset) {
        const excelReport = {
          title: "Ümumi hesabat",
          description: "Vəsait siyahısını Excel kimi yüklə",
          fileName: `aktiv_vesaitler_${new Date().toISOString().split('T')[0]}.xlsx`,
          fileSize: excelResult.buffer.length,
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
        
        await firstAsset.addExcelReport(excelReport);
      }
    }

    // Faylı yüklə
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="aktiv_vesaitler.xlsx"`);
    res.setHeader('Content-Length', excelResult.buffer.length);
    
    res.end(excelResult.buffer);

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Excel faylı yaradılarkən xəta baş verdi',
      message: error.message 
    });
  }
};
export const searchAssets = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { q, field = 'name' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Axtarış termini tələb olunur"
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    let filter = { userId };
    
    // Fərqli sahələrdə axtar
    if (field === 'all') {
      filter.$or = [
        { name: searchRegex },
        { inventoryNumber: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
        { serialNumber: searchRegex },
        { account: searchRegex },
        { department: searchRegex },
        { responsiblePerson: searchRegex },
        { notes: searchRegex }
      ];
    } else {
      filter[field] = searchRegex;
    }

    const assets = await Asset.find(filter)
      .select('-document.bufferData -__v')
      .limit(50);

    res.json({
      success: true,
      data: assets,
      count: assets.length
    });
  } catch (error) {
    console.error('❌ SEARCH ASSETS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// Excel yarat və yüklə (BUFFER İLƏ)
// 📤 EXCEL EXPORT FUNKSİYALARI (Asset modeli ilə)

// ✅ Bütün assetləri Excel formatında endir

// ✅ Əvvəlki hesabatları gətir
export const testSimpleExcel = async (req, res) => {
  try {
    console.log("🧪 Sadə test Excel başladı...");
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Ad', key: 'name', width: 20 },
      { header: 'Qiymət', key: 'price', width: 15 }
    ];
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4CAF50' }
    };
    
    worksheet.addRow({ id: 1, name: 'Test Məhsul 1', price: 100 });
    worksheet.addRow({ id: 2, name: 'Test Məhsul 2', price: 200 });
    worksheet.addRow({ id: 3, name: 'Test Məhsul 3', price: 300 });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`✅ Test Excel buffer: ${buffer.length} bytes`);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="test_simple.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    
    res.end(buffer);
    
    console.log("🎉 Test Excel göndərildi!");
    
  } catch (error) {
    console.error('❌ Test Excel xətası:', error);
    res.status(500).json({
      success: false,
      message: `Test Excel xətası: ${error.message}`
    });
  }
};

// Vəsait statusunu yenilə
export const updateAssetStatus = async (req, res) => {
  try {
    const { userId, assetId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status tələb olunur"
      });
    }

    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    // Statusu yenilə
    asset.updateStatus(status);
    await asset.save();

    res.json({
      success: true,
      data: asset,
      message: `Vəsait statusu "${status}" olaraq yeniləndi`
    });
  } catch (error) {
    console.error('❌ UPDATE ASSET STATUS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Axtarış endpoint-i

export const getPreviousReports = async (req, res) => {
  try {
    const userId = req.params.userId;

    // İstifadəçinin bütün assetlərini götür
    const assets = await Asset.find({ userId })
      .select('excelReports pdfReports')
      .sort({ 'excelReports.generatedAt': -1 });

    // Bütün reportları bir yerdə topla
    const allExcelReports = [];
    const allPdfReports = [];

    assets.forEach(asset => {
      if (asset.excelReports && asset.excelReports.length > 0) {
        allExcelReports.push(...asset.excelReports);
      }
      if (asset.pdfReports && asset.pdfReports.length > 0) {
        allPdfReports.push(...asset.pdfReports);
      }
    });

    // Tarixə görə sırala
    allExcelReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    allPdfReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    res.json({
      success: true,
      data: {
        excelReports: allExcelReports.slice(0, 20), // Son 20 report
        pdfReports: allPdfReports.slice(0, 20)
      }
    });

  } catch (error) {
    console.error('❌ GET PREVIOUS REPORTS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// ✅ AXTARIŞ NƏTİCƏLƏRİNİ EXCEL-Ə ÇIXAR
export const exportSearchResultsToExcel = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { q, field = 'name' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Axtarış termini tələb olunur"
      });
    }

    const searchRegex = new RegExp(q, 'i');
    let filter = { userId };
    
    if (field === 'all') {
      filter.$or = [
        { name: searchRegex },
        { inventoryNumber: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
        { serialNumber: searchRegex }
      ];
    } else {
      filter[field] = searchRegex;
    }

    const assets = await Asset.find(filter)
      .select('-document.bufferData -__v');

    // Excel yarat
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Axtarış Nəticələri');

    worksheet.columns = [
      { header: 'Inv. No', key: 'inventoryNumber', width: 20 },
      { header: 'Ad', key: 'name', width: 30 },
      { header: 'Kateqoriya', key: 'category', width: 20 },
      { header: 'Yer', key: 'location', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Cari Dəyər', key: 'currentValue', width: 15 }
    ];

    // Başlıq formatı
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE599' }
    };

    // Məlumatları əlavə et
    assets.forEach(asset => {
      worksheet.addRow({
        inventoryNumber: asset.inventoryNumber,
        name: asset.name,
        category: asset.category,
        location: asset.location,
        status: asset.status,
        currentValue: asset.currentValue
      });
    });

    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `axtaris_${q}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.end(buffer);

  } catch (error) {
    console.error('❌ EXPORT SEARCH RESULTS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// ===================== KÖMƏKÇİ FUNKSİYALAR =====================

async function generateExcelBuffer(assets, sheetName = 'Vəsaitlər') {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = [
    { header: 'Inv. No', key: 'inventoryNumber', width: 20 },
    { header: 'Ad', key: 'name', width: 30 },
    { header: 'Kateqoriya', key: 'category', width: 20 },
    { header: 'Hesab', key: 'account', width: 15 },
    { header: 'Yer', key: 'location', width: 20 },
    { header: 'İlkin Dəyər', key: 'initialValue', width: 15 },
    { header: 'Cari Dəyər', key: 'currentValue', width: 15 },
    { header: 'Amortizasiya', key: 'amortization', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  // Başlıq formatı
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  // Məlumatları əlavə et
  assets.forEach(asset => {
    worksheet.addRow({
      inventoryNumber: asset.inventoryNumber,
      name: asset.name,
      category: asset.category,
      account: asset.account,
      location: asset.location,
      initialValue: asset.initialValue,
      currentValue: asset.currentValue,
      amortization: asset.amortization,
      status: asset.status
    });
  });

  // Rəqəm formatı
  worksheet.getColumn('initialValue').numFmt = '#,##0.00';
  worksheet.getColumn('currentValue').numFmt = '#,##0.00';
  worksheet.getColumn('amortization').numFmt = '#,##0.00';

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    fileName: `${sheetName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
  };
}

async function generatePdfBuffer(assets) {
  // Burada real PDF yaradılması üçün PDFService istifadə etmək lazımdır
  // Sadə versiya:
  const doc = new PDFDocument();
  const buffers = [];
  
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});
  
  doc.fontSize(20).text('Amortizasiya Hesabatı', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12);
  assets.forEach((asset, index) => {
    doc.text(`${index + 1}. ${asset.name}`);
    doc.text(`   Inv. No: ${asset.inventoryNumber}`);
    doc.text(`   Kateqoriya: ${asset.category}`);
    doc.text(`   İlkin Dəyər: ${asset.initialValue.toFixed(2)} ₼`);
    doc.text(`   Cari Dəyər: ${asset.currentValue.toFixed(2)} ₼`);
    doc.text(`   Amortizasiya: ${asset.amortization.toFixed(2)} ₼ (${asset.amortizationPercentage.toFixed(2)}%)`);
    doc.moveDown();
  });
  
  doc.end();
  
  return Buffer.concat(buffers);
}

// ✅ Amortizasiya hesabatını PDF formatında endir (YENİ)
// controllers/assetExportController.js




// ✅ Formatlı PDF (daha gözəl dizayn)
export const downloadFormattedAmortizationPDF = async (req, res) => {
  try {
    console.log("🎨 Formatlı PDF download endpoint çağırıldı");
    
    const userId = req.params.userId;

    // Asset modelindən aktiv assetləri tap
    const assets = await Asset.find({ 
      userId, 
      status: "Aktiv",
      isDeleted: false 
    }).select('-document.bufferData -__v');

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
       .text('AMORTİZASİYA HESABATI', 50, 30, { align: 'left' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Yaradılma tarixi: ${new Date().toLocaleString('az-AZ')}`, 50, 60);
    
    doc.fontSize(10).font('Helvetica')
       .text(`Ümumi Vəsait: ${assets.length}`, doc.page.width - 150, 60, { align: 'right' });
    
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
        { label: 'İnventar №', value: asset.inventoryNumber || 'Yoxdur' },
        { label: 'Kateqoriya', value: asset.category || 'Yoxdur' },
        { label: 'İlkin Dəyər', value: `${formatCurrency(asset.initialValue || 0)} ₼` },
        { label: 'Cari Dəyər', value: `${formatCurrency(asset.currentValue || 0)} ₼` },
        { label: 'Amortizasiya', value: `${formatCurrency(asset.amortization || 0)} ₼ (${(asset.amortizationPercentage || 0).toFixed(2)}%)` }
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
         .text('HESABAT XÜLASƏSİ', 50, 50, { align: 'center' });
      
      // Statistik cədvəl
      const statsY = 100;
      const statRows = [
        ['Göstərici', 'Dəyər'],
        ['Ümumi Vəsait Sayı', assets.length.toString()],
        ['Ümumi İlkin Dəyər', `${formatCurrency(totalInitial)} ₼`],
        ['Ümumi Cari Dəyər', `${formatCurrency(totalCurrent)} ₼`],
        ['Ümumi Amortizasiya', `${formatCurrency(totalDep)} ₼`],
        ['Orta Amortizasiya', `${formatCurrency(totalDep / assets.length)} ₼`],
        ['Orta Amortizasiya %', `${((totalDep / totalInitial) * 100).toFixed(2)}%`]
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
         .text('Bu hesabat avtomatik olaraq sistem tərəfindən yaradılmışdır.', 50, doc.page.height - 50, { align: 'center' });
    }
    
    // 4. SAYFA NÖMRƏLƏRİ
    for (let i = 0; i < pages.length; i++) {
      doc.switchToPage(i);
      doc.fillColor('#95a5a6')
         .fontSize(8)
         .text(
           `Səhifə ${i + 1} / ${pages.length}`,
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

export const getAssetStatistics = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { fields = 'overview,byCategory,byStatus' } = req.query;
    const requestedFields = fields.split(',').map(f => f.trim());

    console.log(`📊 Asset stats requested for user: ${userId}, fields: ${requestedFields}`);

    const responseData = { success: true, data: {}, metadata: {} };

    // Həmişə lazım olan əsas statistika (overview) – sürətli
    if (requestedFields.includes('overview') || requestedFields.length === 0) {
      const overallStats = await Asset.getUserAssetStats(userId);
      responseData.data.overview = {
        totalAssets: overallStats.totalAssets || 0,
        totalInitialValue: parseFloat((overallStats.totalInitialValue || 0).toFixed(2)),
        totalCurrentValue: parseFloat((overallStats.totalCurrentValue || 0).toFixed(2)),
        totalAmortization: parseFloat((overallStats.totalAmortization || 0).toFixed(2)),
        activeAssets: overallStats.activeAssets || 0,
        passiveAssets: overallStats.passiveAssets || 0,
        soldAssets: overallStats.soldAssets || 0,
        averageAmortizationPercentage: overallStats.totalInitialValue > 0
          ? parseFloat(((overallStats.totalAmortization / overallStats.totalInitialValue) * 100).toFixed(2))
          : 0
      };
    }

    // Kateqoriya statistikası
    if (requestedFields.includes('byCategory')) {
      const categoryStats = await Asset.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
        { $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalInitialValue: { $sum: "$initialValue" },
            totalCurrentValue: { $sum: "$currentValue" },
            totalAmortization: { $sum: "$amortization" },
            averageAmortizationPercentage: { $avg: "$amortizationPercentage" }
        } },
        { $sort: { totalCurrentValue: -1 } }
      ]);
      responseData.data.byCategory = categoryStats.map(cat => ({
        category: cat._id || 'Müəyyən edilməyib',
        count: cat.count,
        totalInitialValue: parseFloat((cat.totalInitialValue || 0).toFixed(2)),
        totalCurrentValue: parseFloat((cat.totalCurrentValue || 0).toFixed(2)),
        totalAmortization: parseFloat((cat.totalAmortization || 0).toFixed(2)),
        averageAmortizationPercentage: parseFloat((cat.averageAmortizationPercentage || 0).toFixed(2))
      }));
    }

    // Status statistikası
    if (requestedFields.includes('byStatus')) {
      const statusStats = await Asset.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
        { $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalInitialValue: { $sum: "$initialValue" },
            totalCurrentValue: { $sum: "$currentValue" },
            totalAmortization: { $sum: "$amortization" }
        } }
      ]);
      responseData.data.byStatus = statusStats.map(stat => ({
        status: stat._id || 'Müəyyən edilməyib',
        count: stat.count,
        totalInitialValue: parseFloat((stat.totalInitialValue || 0).toFixed(2)),
        totalCurrentValue: parseFloat((stat.totalCurrentValue || 0).toFixed(2)),
        totalAmortization: parseFloat((stat.totalAmortization || 0).toFixed(2))
      }));
    }

    // Metadata (həmişə əlavə et)
    responseData.metadata = {
      generatedAt: new Date().toISOString(),
      fields: requestedFields
    };

    console.log("✅ Asset statistics prepared successfully");
    res.json(responseData);

  } catch (error) {
    console.error('❌ GET ASSET STATISTICS Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 📊 SADƏ VERSİYA (Daha sürətli)
export const getSimpleAssetStatistics = async (req, res) => {
  try {
    const userId = req.params.userId;

    const overallStats = await Asset.getUserAssetStats(userId);

    const categoryStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalCurrentValue: { $sum: "$currentValue" }
        }
      },
      { $sort: { totalCurrentValue: -1 } }
    ]);

    const statusStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalAssets: overallStats.totalAssets || 0,
          totalValue: parseFloat(overallStats.totalCurrentValue?.toFixed(2)) || 0,
          activeAssets: overallStats.activeAssets || 0
        },
        byCategory: categoryStats.map(cat => ({
          category: cat._id || 'Müəyyən edilməyib',
          count: cat.count,
          totalValue: parseFloat(cat.totalCurrentValue?.toFixed(2)) || 0
        })),
        byStatus: statusStats.map(stat => ({
          status: stat._id || 'Müəyyən edilməyib',
          count: stat.count
        }))
      }
    });

  } catch (error) {
    console.error('❌ GET SIMPLE ASSET STATISTICS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};
// controllers/assetDepartmentController.js


// 📊 ŞÖBƏ DƏYƏRLƏRİNİ GƏTİR
// controllers/departmentController.js (optimallaşdırılmış)
export const getDepartmentValues = async (req, res) => {
  try {
    const userId = req.params.userId;

    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $facet: {
          // 1. Department statistikaları
          departmentStats: [
            {
              $group: {
                _id: { $ifNull: ["$department", "Müəyyən edilməyib"] },
                assetCount: { $sum: 1 },
                totalInitialValue: { $sum: "$initialValue" },
                totalCurrentValue: { $sum: "$currentValue" },
                totalAmortization: { $sum: "$amortization" },
                avgAmortizationPercentage: { $avg: "$amortizationPercentage" },
                maintenanceCost: { $sum: "$maintenanceCost" },
                insuranceAmount: { $sum: "$insuranceAmount" }
              }
            },
            {
              $project: {
                department: "$_id",
                assetCount: 1,
                totalInitialValue: { $round: ["$totalInitialValue", 2] },
                totalCurrentValue: { $round: ["$totalCurrentValue", 2] },
                totalAmortization: { $round: ["$totalAmortization", 2] },
                avgAmortizationPercentage: { $round: ["$avgAmortizationPercentage", 2] },
                maintenanceCost: { $round: ["$maintenanceCost", 2] },
                insuranceAmount: { $round: ["$insuranceAmount", 2] },
                _id: 0
              }
            }
          ],

          // 2. Aktivlik statistikaları
          activityStats: [
            {
              $group: {
                _id: { $ifNull: ["$department", "Müəyyən edilməyib"] },
                recentAssetsCount: {
                  $sum: {
                    $cond: [
                      { $gte: ["$createdAt", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                      1,
                      0
                    ]
                  }
                },
                maintenanceDueCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$nextMaintenanceDate", null] },
                          { $lte: ["$nextMaintenanceDate", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                warrantyActiveCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$warrantyExpiryDate", null] },
                          { $gte: ["$warrantyExpiryDate", new Date()] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],

          // 3. Kateqoriya paylanması
          categoryStats: [
            {
              $match: {
                department: { $exists: true, $ne: "" },
                category: { $exists: true, $ne: "" }
              }
            },
            {
              $group: {
                _id: {
                  department: "$department",
                  category: "$category"
                },
                count: { $sum: 1 },
                totalValue: { $sum: "$currentValue" }
              }
            },
            {
              $group: {
                _id: "$_id.department",
                categories: {
                  $push: {
                    category: "$_id.category",
                    count: "$count",
                    totalValue: "$totalValue"
                  }
                },
                totalCategories: { $sum: 1 }
              }
            }
          ],

          // 4. Məsul şəxslər
          personnelStats: [
            {
              $match: {
                department: { $exists: true, $ne: "" },
                responsiblePerson: { $exists: true, $ne: "" }
              }
            },
            {
              $group: {
                _id: {
                  department: "$department",
                  responsiblePerson: "$responsiblePerson"
                },
                assetCount: { $sum: 1 },
                totalValue: { $sum: "$currentValue" }
              }
            },
            {
              $group: {
                _id: "$_id.department",
                personnel: {
                  $push: {
                    responsiblePerson: "$_id.responsiblePerson",
                    assetCount: "$assetCount",
                    totalValue: "$totalValue"
                  }
                },
                totalPersonnel: { $sum: 1 }
              }
            }
          ],

          // 5. Yaş analizi
          ageStats: [
            {
              $match: {
                department: { $exists: true, $ne: "" },
                purchaseDate: { $exists: true }
              }
            },
            {
              $addFields: {
                assetAgeInYears: {
                  $divide: [
                    { $subtract: [new Date(), "$purchaseDate"] },
                    1000 * 60 * 60 * 24 * 365
                  ]
                }
              }
            },
            {
              $group: {
                _id: "$department",
                avgAssetAge: { $avg: "$assetAgeInYears" },
                oldestAssetAge: { $max: "$assetAgeInYears" },
                newestAssetAge: { $min: "$assetAgeInYears" },
                assetCount: { $sum: 1 }
              }
            }
          ],

          // 6. Ümumi statistika
          overallStats: [
            {
              $group: {
                _id: null,
                totalAssets: { $sum: 1 },
                totalCurrentValue: { $sum: "$currentValue" }
              }
            }
          ]
        }
      }
    ];

    const result = await Asset.aggregate(pipeline);
    const data = result[0] || {};

    // Məlumatları birləşdir və formatla
    const departmentStats = data.departmentStats || [];
    const activityStats = data.activityStats || [];
    const categoryStats = data.categoryStats || [];
    const personnelStats = data.personnelStats || [];
    const ageStats = data.ageStats || [];
    const overall = data.overallStats?.[0] || { totalAssets: 0, totalCurrentValue: 0 };

    // Department məlumatlarını birləşdir
    const departments = departmentStats.map(dept => {
      const activity = activityStats.find(a => a._id === dept.department) || {};
      const category = categoryStats.find(c => c._id === dept.department) || {};
      const personnel = personnelStats.find(p => p._id === dept.department) || {};
      const age = ageStats.find(a => a._id === dept.department) || {};

      return {
        ...dept,
        activity: {
          recentAssetsCount: activity.recentAssetsCount || 0,
          maintenanceDueCount: activity.maintenanceDueCount || 0,
          warrantyActiveCount: activity.warrantyActiveCount || 0
        },
        categories: category.categories?.slice(0, 5) || [],
        personnel: personnel.personnel?.slice(0, 5) || [],
        ageAnalysis: {
          avgAssetAge: age.avgAssetAge || 0,
          oldestAssetAge: age.oldestAssetAge || 0,
          newestAssetAge: age.newestAssetAge || 0
        },
        percentageOfTotal: overall.totalCurrentValue > 0
          ? parseFloat(((dept.totalCurrentValue / overall.totalCurrentValue) * 100).toFixed(2))
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        departments,
        summary: {
          totalDepartments: departments.length,
          totalAssets: overall.totalAssets,
          totalValue: parseFloat(overall.totalCurrentValue.toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('❌ GET DEPARTMENT VALUES Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📊 SADƏ VERSİYA (Daha sürətli)
export const getSimpleDepartmentValues = async (req, res) => {
  try {
    const userId = req.params.userId;

    const departmentStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false
        } 
      },
      {
        $group: {
          _id: {
            $ifNull: ["$department", "Müəyyən edilməyib"]
          },
          assetCount: { $sum: 1 },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" }
        }
      },
      {
        $project: {
          department: "$_id",
          assetCount: 1,
          totalCurrentValue: { $round: ["$totalCurrentValue", 2] },
          totalAmortization: { $round: ["$totalAmortization", 2] },
          _id: 0
        }
      },
      { $sort: { totalCurrentValue: -1 } }
    ]);

    const overallStats = await Asset.getUserAssetStats(userId);

    res.json({
      success: true,
      data: {
        departments: departmentStats.map(dept => ({
          department: dept.department,
          assetCount: dept.assetCount,
          totalCurrentValue: dept.totalCurrentValue,
          totalAmortization: dept.totalAmortization,
          percentageOfTotal: overallStats.totalCurrentValue > 0
            ? parseFloat(((dept.totalCurrentValue / overallStats.totalCurrentValue) * 100).toFixed(2))
            : 0,
          avgAmortization: dept.assetCount > 0
            ? parseFloat((dept.totalAmortization / dept.assetCount).toFixed(2))
            : 0
        })),
        summary: {
          totalDepartments: departmentStats.length,
          totalAssets: overallStats.totalAssets || 0,
          totalValue: parseFloat(overallStats.totalCurrentValue?.toFixed(2)) || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ GET SIMPLE DEPARTMENT VALUES Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// ===================== KÖMƏKÇİ FUNKSİYALAR =====================

function calculateEfficiencyScore(department, performance) {
  let score = 0;
  
  // Dəyər saxlanması (0-40 bal)
  if (performance?.valueRetentionRate >= 80) score += 40;
  else if (performance?.valueRetentionRate >= 60) score += 30;
  else if (performance?.valueRetentionRate >= 40) score += 20;
  else score += 10;

  // Amortizasiya dərəcəsi (0-30 bal)
  if (department.avgAmortizationPercentage <= 20) score += 30;
  else if (department.avgAmortizationPercentage <= 40) score += 20;
  else if (department.avgAmortizationPercentage <= 60) score += 10;

  // Saxlanma xərcləri (0-20 bal)
  if (performance?.maintenanceRate <= 5) score += 20;
  else if (performance?.maintenanceRate <= 10) score += 10;
  else if (performance?.maintenanceRate <= 20) score += 5;

  // Aktivlik (0-10 bal)
  if (department.assetCount > 10) score += 10;
  else if (department.assetCount > 5) score += 5;
  else score += 2;

  return Math.min(score, 100);
}

function getAgeCategory(age) {
  if (age < 1) return 'Yeni';
  if (age < 3) return 'Orta';
  if (age < 5) return 'Köhnə';
  return 'Çox köhnə';
}

function calculateGrowthRate(department, monthly) {
  if (!monthly || !monthly.monthlyActivity || monthly.monthlyActivity.length < 2) {
    return 0;
  }

  const recentMonths = monthly.monthlyActivity.slice(-2);
  if (recentMonths.length < 2) return 0;

  const [prev, current] = recentMonths;
  if (prev.assetCount === 0) return 100;

  return parseFloat((((current.assetCount - prev.assetCount) / prev.assetCount) * 100).toFixed(2));
}

function getValueTrend(department, overallStats) {
  const percentage = department.totalCurrentValue / overallStats.totalCurrentValue;
  
  if (percentage > 0.3) return 'Yüksək';
  if (percentage > 0.15) return 'Orta';
  if (percentage > 0.05) return 'Aşağı';
  return 'Çox aşağı';
}

function getDepartmentPriority(department, activity) {
  let priority = 'Aşağı';
  
  // Təmir tələb olunanlar üçün yüksək prioritet
  if (activity?.maintenanceDueCount > 0) priority = 'Yüksək';
  
  // Yüksək amortizasiya üçün orta prioritet
  else if (department.avgAmortizationPercentage > 70) priority = 'Orta';
  
  // Böyük dəyər üçün orta prioritet
  else if (department.totalCurrentValue > 100000) priority = 'Orta';
  
  return priority;
}

function getValueRange(value) {
  if (value >= 1000000) return '1M+ ₼';
  if (value >= 500000) return '500K-1M ₼';
  if (value >= 100000) return '100K-500K ₼';
  if (value >= 50000) return '50K-100K ₼';
  if (value >= 10000) return '10K-50K ₼';
  if (value >= 1000) return '1K-10K ₼';
  return '1K-dan az ₼';
}

function getAssetCountRange(count) {
  if (count >= 50) return '50+';
  if (count >= 20) return '20-49';
  if (count >= 10) return '10-19';
  if (count >= 5) return '5-9';
  if (count >= 1) return '1-4';
  return '0';
}

function generateDepartmentRecommendations(departmentStats, activityStats) {
  const recommendations = [];

  // Ümumi tövsiyələr
  if (departmentStats.some(d => d.department === "Müəyyən edilməyib" && d.assetCount > 0)) {
    recommendations.push({
      type: 'critical',
      title: 'Şöbəsi müəyyən edilməyən vəsaitlər',
      description: `${departmentStats.find(d => d.department === "Müəyyən edilməyib").assetCount} vəsaitin şöbəsi müəyyən edilməyib.`,
      action: 'Bu vəsaitlərə şöbə təyin edin.'
    });
  }

  // Təmir tələb olunan şöbələr
  const departmentsWithMaintenance = activityStats
    .filter(a => a.maintenanceDueCount > 0)
    .map(a => a._id);

  if (departmentsWithMaintenance.length > 0) {
    recommendations.push({
      type: 'high',
      title: 'Təmir tələb olunan vəsaitlər',
      description: `${departmentsWithMaintenance.length} şöbədə təmir tələb olunan vəsaitlər var.`,
      action: 'Təmir planını tərtib edin.'
    });
  }

  // Yüksək amortizasiya olan şöbələr
  const highDepreciationDepts = departmentStats
    .filter(d => d.avgAmortizationPercentage > 70)
    .map(d => d.department);

  if (highDepreciationDepts.length > 0) {
    recommendations.push({
      type: 'medium',
      title: 'Yüksək amortizasiya dərəcəsi',
      description: `${highDepreciationDepts.length} şöbədə orta amortizasiya 70%-dən yüksəkdir.`,
      action: 'Bu vəsaitləri yeniləməyi nəzərdən keçirin.'
    });
  }

  // Dəyəri az olan şöbələr
  const lowValueDepts = departmentStats
    .filter(d => d.totalCurrentValue < 1000)
    .map(d => d.department);

  if (lowValueDepts.length > 0) {
    recommendations.push({
      type: 'low',
      title: 'Aşağı dəyərli şöbələr',
      description: `${lowValueDepts.length} şöbənin ümumi dəyəri 1000 ₼-dən azdır.`,
      action: 'Bu şöbələrdəki vəsaitləri birləşdirməyi nəzərdən keçirin.'
    });
  }

  return recommendations;
}
// ✅ Asset Export Test səhifəsi (HTML)
export const getAssetsExportPage = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vəsait Export Test</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 { 
            color: #333; 
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            background: linear-gradient(90deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          h2 {
            color: #444;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
          }
          .card { 
            background: #f8f9fa; 
            padding: 25px; 
            border-radius: 15px; 
            margin: 25px 0;
            border-left: 5px solid #667eea;
          }
          .btn-group {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
          }
          .btn { 
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 15px 25px; 
            background: #667eea; 
            color: white; 
            text-decoration: none; 
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            min-width: 180px;
          }
          .btn:hover { 
            background: #5a67d8; 
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }
          .btn i {
            margin-right: 10px;
            font-size: 20px;
          }
          .btn-excel { 
            background: #4CAF50; 
          }
          .btn-excel:hover { 
            background: #45a049; 
          }
          .btn-pdf { 
            background: #f44336; 
          }
          .btn-pdf:hover { 
            background: #d32f2f; 
          }
          .btn-csv { 
            background: #2196F3; 
          }
          .btn-csv:hover { 
            background: #0b7dda; 
          }
          .btn-test { 
            background: #FF9800; 
          }
          .btn-test:hover { 
            background: #e68a00; 
          }
          .btn-html { 
            background: #9C27B0; 
          }
          .btn-html:hover { 
            background: #7b1fa2; 
          }
          .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin: 30px 0;
          }
          .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .feature-item h4 {
            color: #667eea;
            margin-top: 0;
          }
          @media (max-width: 768px) {
            body { padding: 20px; }
            .container { padding: 20px; }
            .btn-group { flex-direction: column; }
            .btn { width: 100%; }
          }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      </head>
      <body>
        <div class="container">
          <h1><i class="fas fa-file-export"></i> Vəsait Export Test Səhifəsi</h1>
          
          <div class="card">
            <h2><i class="fas fa-download"></i> Export Seçimləri:</h2>
            <div class="btn-group">
              <a href="/api/users/${userId}/assets/export/excel" class="btn btn-excel" download>
                <i class="fas fa-file-excel"></i> Excel Export
              </a>
              <a href="/api/users/${userId}/assets/export/pdf" class="btn btn-pdf" download>
                <i class="fas fa-file-pdf"></i> PDF Export
              </a>
              <a href="/api/users/${userId}/assets/export/csv" class="btn btn-csv" download>
                <i class="fas fa-file-csv"></i> CSV Export
              </a>
              <a href="/api/users/${userId}/assets/test-excel" class="btn btn-test" download>
                <i class="fas fa-vial"></i> Test Excel
              </a>
              <a href="/api/users/${userId}/assets/test-pdf" class="btn btn-pdf" download>
                <i class="fas fa-vial"></i> Test PDF
              </a>
              <a href="/api/users/${userId}/assets/export-page" class="btn btn-html">
                <i class="fas fa-redo"></i> Yenilə
              </a>
            </div>
            <p><em><i class="fas fa-info-circle"></i> Fayl avtomatik olaraq yüklənəcək.</em></p>
          </div>
          
          <div class="instructions">
            <h3><i class="fas fa-info-circle"></i> İstifadə Təlimatı:</h3>
            <ol>
              <li>Yükləmək istədiyiniz format üçün düyməni klikləyin</li>
              <li>Fayl avtomatik olaraq yüklənəcək</li>
              <li>Excel və CSV faylları Microsoft Excel və ya Google Sheets ilə açıla bilər</li>
              <li>PDF faylları istənilən PDF oxuyucu ilə açıla bilər</li>
            </ol>
          </div>
          
          <div class="feature-list">
            <div class="feature-item">
              <h4><i class="fas fa-file-excel"></i> Excel Export</h4>
              <p>Bütün vəsait məlumatları Excel formatında. Formatlaşdırılmış sütunlar, rəng kodları və avtomatik hesablamalar.</p>
            </div>
            <div class="feature-item">
              <h4><i class="fas fa-file-pdf"></i> PDF Export</h4>
              <p>Amortizasiya hesabatı PDF formatında. Professional dizayn, statistik məlumatlar və xülasə.</p>
            </div>
            <div class="feature-item">
              <h4><i class="fas fa-file-csv"></i> CSV Export</h4>
              <p>CSV formatında (Excel, Google Sheets ilə açıla bilər). Sadə format, asanlıqla emal edilə bilər.</p>
            </div>
            <div class="feature-item">
              <h4><i class="fas fa-vial"></i> Test Fayllar</h4>
              <p>Demo məlumatlarla test faylları. Sistemin düzgün işlədiyini yoxlamaq üçün ideal.</p>
            </div>
          </div>
          
          <div class="card">
            <h3><i class="fas fa-history"></i> Son Exportlar:</h3>
            <p><em>Bu funksiya hazırlanma prosesindədir...</em></p>
            <p>Qısa zamanda əvvəlki exportların siyahısı və statistikalar burada görünəcək.</p>
          </div>
        </div>
        
        <script>
          // Yükləmə statusunu göstər
          document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
              const btnText = this.querySelector('i').nextSibling.textContent.trim();
              this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Hazırlanır...';
              this.style.opacity = '0.7';
              
              setTimeout(() => {
                this.innerHTML = \`<i class="fas fa-check"></i> \${btnText}\`;
                this.style.opacity = '1';
              }, 2000);
            });
          });
        </script>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Asset-ləri CSV formatında endir
export const downloadAssetsCSV = async (req, res) => {
  try {
    console.log("📊 CSV download endpoint çağırıldı");
    
    const userId = req.params.userId;

    // Asset modelindən assetləri tap
    const assets = await Asset.find({ 
      userId,
      isDeleted: false 
    }).select('-document.bufferData -__v');

    console.log(`📊 CSV üçün ${assets.length} asset tapıldı`);

    // CSV başlıqları
    const headers = [
      'Inventar №',
      'Ad',
      'Kateqoriya',
      'Hesab',
      'Yer',
      'İlkin Dəyər (₼)',
      'Cari Dəyər (₼)',
      'Amortizasiya (₼)',
      'Amortizasiya (%)',
      'Status',
      'Alış Tarixi',
      'Xidmət Müddəti (il)',
      'Şöbə',
      'Məsul Şəxs'
    ];

    // CSV məzmunu
    let csvContent = headers.join(',') + '\n';

    assets.forEach(asset => {
      const row = [
        `"${asset.inventoryNumber || ''}"`,
        `"${asset.name || ''}"`,
        `"${asset.category || ''}"`,
        `"${asset.account || ''}"`,
        `"${asset.location || ''}"`,
        asset.initialValue || 0,
        asset.currentValue || 0,
        asset.amortization || 0,
        asset.amortizationPercentage || 0,
        `"${asset.status || ''}"`,
        `"${asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : ''}"`,
        asset.serviceLife || 1,
        `"${asset.department || ''}"`,
        `"${asset.responsiblePerson || ''}"`
      ];
      
      csvContent += row.join(',') + '\n';
    });

    // CSV fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `vesaitler_${timestamp}.csv`;
    
    // Response header-ları
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    // CSV məzmununu göndər
    res.end(csvContent);
    
    console.log(`✅ CSV faylı hazırdır: ${filename}`);
    
  } catch (error) {
    console.error("❌ CSV export xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "CSV faylı yaradılarkən xəta baş verdi: " + error.message 
    });
  }
};

// ===================== KÖMƏKÇİ FUNKSİYALAR =====================

// Pul formatı üçün köməkçi funksiya
// controllers/categoryController.js
// controllers/categoryController.js
import Category from "../models/Category.js";

// 📊 KATEQORİYA ƏMƏLİYYATLARI

// Bütün kateqoriyaları gətir (dashboard üçün)
export const getCategories = async (req, res) => {
  try {
    const userId = req.params.userId;

    const categories = await Category.findByUserId(userId);

    // Hər kateqoriya üçün statistikaları yenilə
    for (const category of categories) {
      await category.updateStats();
    }

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('❌ GET CATEGORIES Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Yeni kateqoriya yarat
export const createCategory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, description, amortizationRate, colorCode, icon } = req.body;

    // Kateqoriya adı unikallığını yoxla
    const existingCategory = await Category.findOne({ 
      userId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "Bu kateqoriya adı artıq mövcuddur" 
      });
    }

    const newCategory = await Category.create({
      userId,
      name,
      description,
      amortizationRate: parseFloat(amortizationRate) || 0,
      colorCode: colorCode || '#3498db',
      icon: icon || '📁'
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: "Kateqoriya uğurla əlavə edildi"
    });
  } catch (error) {
    console.error('❌ CREATE CATEGORY Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Kateqoriyanı yenilə
export const updateCategory = async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    const category = await Category.findOne({ 
      _id: categoryId, 
      userId 
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    // Əgər ad dəyişirsə, unikallığı yoxla
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        userId, 
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } 
      });

      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          message: "Bu kateqoriya adı artıq mövcuddur" 
        });
      }
    }

    Object.assign(category, req.body);
    
    // Statistikaları yenilə
    await category.updateStats();
    
    const updatedCategory = await category.save();

    res.json({
      success: true,
      data: updatedCategory,
      message: "Kateqoriya uğurla yeniləndi"
    });
  } catch (error) {
    console.error('❌ UPDATE CATEGORY Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Kateqoriyanı sil
export const deleteCategory = async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    const category = await Category.findOne({ 
      _id: categoryId, 
      userId 
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    // Bu kateqoriyaya aid vəsaitləri yoxla
    const assetsInCategory = await Asset.find({ 
      userId, 
      category: categoryId,
      isDeleted: false 
    });

    if (assetsInCategory.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Bu kateqoriyaya aid vəsaitlər var. Əvvəlcə onları silin və ya başqa kateqoriyaya köçürün.",
        data: {
          assetsCount: assetsInCategory.length,
          assets: assetsInCategory.map(asset => ({
            id: asset._id,
            name: asset.name,
            inventoryNumber: asset.inventoryNumber
          }))
        }
      });
    }

    // Əgər default kateqoriyadırsa, sadəcə deaktiv et
    if (category.isDefault) {
      category.isActive = false;
      await category.save();
      
      return res.json({
        success: true,
        message: "Default kateqoriya deaktiv edildi",
        data: category
      });
    }

    // Normal kateqoriyanı sil
    await category.deleteOne();

    res.json({
      success: true,
      message: "Kateqoriya uğurla silindi"
    });
  } catch (error) {
    console.error('❌ DELETE CATEGORY Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Kateqoriya təfərrüatlarını gətir
export const getCategoryDetails = async (req, res) => {
  try {
    const { userId, categoryId } = req.params;

    const category = await Category.findOne({ 
      _id: categoryId, 
      userId 
    }).populate({
      path: 'assets',
      select: '-document.bufferData -__v',
      match: { isDeleted: false },
      options: { sort: { currentValue: -1 } }
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    // Statistikaları hesabla
    const assets = category.assets || [];
    const statistics = {
      totalAssets: assets.length,
      totalInitialValue: assets.reduce((sum, asset) => sum + (asset.initialValue || 0), 0),
      totalCurrentValue: assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0),
      totalAmortization: assets.reduce((sum, asset) => sum + (asset.amortization || 0), 0),
      averageAmortizationPercentage: assets.length > 0 
        ? assets.reduce((sum, asset) => sum + (asset.amortizationPercentage || 0), 0) / assets.length
        : 0
    };

    res.json({
      success: true,
      data: {
        category,
        assets,
        statistics
      }
    });
  } catch (error) {
    console.error('❌ GET CATEGORY DETAILS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// Default kateqoriyaları yüklə
export const loadDefaultCategories = async (req, res) => {
  try {
    const userId = req.params.userId;

    // İstifadəçinin artıq kateqoriyaları var mı?
    const existingCategories = await Category.find({ userId, isActive: true });
    
    if (existingCategories.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "İstifadəçinin artıq kateqoriyaları mövcuddur"
      });
    }

    // Default kateqoriyaları yüklə
    const categories = await Category.initializeUserCategories(userId);

    res.json({
      success: true,
      data: categories,
      message: "Default kateqoriyalar uğurla yükləndi"
    });
  } catch (error) {
    console.error('❌ LOAD DEFAULT CATEGORIES Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
};

// ==============================================
// 🆕 YENİ CONTROLLER-LƏR (FRONTEND ÜÇÜN)
// ==============================================

/**
 * 📊 DASHBOARD STATISTIKALARI
 * GET /api/categories/:userId/dashboard-stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Category modelindəki statik metodu çağır
    const dashboardData = await Category.getDashboardStats(userId);

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ GET DASHBOARD STATS Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 📊 KATEQORİYA HESABATI
 * GET /api/categories/:userId/category-report
 */
export const getCategoryReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Category modelindəki statik metodu çağır
    const reportData = await Category.getCategoryReport(userId);

    // Ümumi statistikaları hesabla
    const summary = reportData.reduce((acc, cat) => {
      acc.totalAssets += cat.stats.count;
      acc.totalInitialValue += cat.stats.totalInitialValue;
      acc.totalCurrentValue += cat.stats.totalCurrentValue;
      acc.totalDepreciation += cat.stats.totalDepreciation;
      return acc;
    }, {
      totalAssets: 0,
      totalInitialValue: 0,
      totalCurrentValue: 0,
      totalDepreciation: 0
    });

    // Ümumi amortizasiya faizi
    summary.overallDepreciationPercentage = summary.totalInitialValue > 0
      ? parseFloat(((summary.totalDepreciation / summary.totalInitialValue) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: {
        categories: reportData,
        summary
      }
    });
  } catch (error) {
    console.error('❌ GET CATEGORY REPORT Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 📊 FİLİAL/LOKASİYA HESABATI
 * GET /api/categories/:userId/branch-report
 */
export const getBranchReport = async (req, res) => {
  try {
    const { userId } = req.params;

    // Bütün aktiv vəsaitləri gətir
    const assets = await Asset.find({ 
      userId, 
      isDeleted: false 
    }).populate('category', 'name colorCode');

    // Filial/Lokasiyaya görə qruplaşdır
    const branchMap = new Map();

    assets.forEach(asset => {
      // Əgər Asset modelində branch varsa onu istifadə et, yoxsa location-u istifadə et
      const branchKey = asset.branch || asset.location || 'Digər';
      const branchName = asset.branch || asset.location || 'Digər';
      
      if (!branchMap.has(branchKey)) {
        branchMap.set(branchKey, {
          name: branchName,
          count: 0,
          totalInitialValue: 0,
          totalCurrentValue: 0,
          categories: new Set()
        });
      }
      
      const data = branchMap.get(branchKey);
      data.count++;
      data.totalInitialValue += asset.initialValue || 0;
      data.totalCurrentValue += asset.currentValue || 0;
      if (asset.category) {
        data.categories.add(asset.category.name || 'Unknown');
      }
    });

    // Ümumi cari dəyər
    const totalCurrentValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

    // Hesabat məlumatlarını formatla
    const branchReport = Array.from(branchMap.values()).map(branch => ({
      name: branch.name,
      count: branch.count,
      totalInitialValue: parseFloat(branch.totalInitialValue.toFixed(2)),
      totalCurrentValue: parseFloat(branch.totalCurrentValue.toFixed(2)),
      depreciation: parseFloat((branch.totalInitialValue - branch.totalCurrentValue).toFixed(2)),
      share: totalCurrentValue > 0 
        ? parseFloat(((branch.totalCurrentValue / totalCurrentValue) * 100).toFixed(2))
        : 0,
      categories: Array.from(branch.categories)
    }));

    // Bar chart üçün məlumat
    const barChartData = branchReport.map(branch => ({
      name: branch.name,
      value: branch.totalCurrentValue
    }));

    res.json({
      success: true,
      data: {
        branches: branchReport,
        barChartData,
        summary: {
          totalBranches: branchReport.length,
          totalAssets: assets.length,
          totalValue: parseFloat(totalCurrentValue.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('❌ GET BRANCH REPORT Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 📊 PIE CHART ÜÇÜN KATEQORİYA PAYLANMASI
 * GET /api/categories/:userId/category-distribution
 */
export const getCategoryDistribution = async (req, res) => {
  try {
    const { userId } = req.params;

    const assets = await Asset.find({ 
      userId, 
      isDeleted: false 
    }).populate('category', 'name colorCode icon');

    const categories = await Category.find({ userId, isActive: true });

    const totalCurrentValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

    const distribution = categories.map(cat => {
      const catAssets = assets.filter(a => 
        a.category && a.category._id.toString() === cat._id.toString()
      );
      
      const catValue = catAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
      const percentage = totalCurrentValue > 0 
        ? (catValue / totalCurrentValue) * 100 
        : 0;

      return {
        id: cat._id,
        name: cat.name,
        count: catAssets.length,
        value: parseFloat(catValue.toFixed(2)),
        percentage: parseFloat(percentage.toFixed(2)),
        color: cat.colorCode,
        icon: cat.icon
      };
    }).filter(cat => cat.count > 0); // Yalnız vəsaiti olan kateqoriyalar

    res.json({
      success: true,
      data: {
        distribution: distribution.sort((a, b) => b.value - a.value),
        totalValue: parseFloat(totalCurrentValue.toFixed(2))
      }
    });
  } catch (error) {
    console.error('❌ GET CATEGORY DISTRIBUTION Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * 📊 BÜTÜN HESABATLARI BİRDƏ GƏTİR (OPTİMİZASİYA ÜÇÜN)
 * GET /api/categories/:userId/all-reports
 */
export const getAllReports = async (req, res) => {
  try {
    const { userId } = req.params;

    // Parallel olaraq bütün məlumatları çək
    const [dashboardStats, categoryReport, branchReport, categoryDistribution] = await Promise.all([
      Category.getDashboardStats(userId),
      Category.getCategoryReport(userId),
      // Branch report-u ayrıca hesabla
      (async () => {
        const assets = await Asset.find({ userId, isDeleted: false })
          .populate('category', 'name');
        
        const branchMap = new Map();
        assets.forEach(asset => {
          const branch = asset.branch || asset.location || 'Digər';
          if (!branchMap.has(branch)) {
            branchMap.set(branch, {
              name: branch,
              count: 0,
              totalCurrentValue: 0
            });
          }
          const data = branchMap.get(branch);
          data.count++;
          data.totalCurrentValue += asset.currentValue || 0;
        });

        return Array.from(branchMap.values()).map(b => ({
          name: b.name,
          count: b.count,
          value: parseFloat(b.totalCurrentValue.toFixed(2))
        }));
      })(),
      // Category distribution-u hesabla
      (async () => {
        const assets = await Asset.find({ userId, isDeleted: false })
          .populate('category', 'name colorCode');
        
        const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
        const catMap = new Map();

        assets.forEach(asset => {
          if (!asset.category) return;
          const catId = asset.category._id.toString();
          if (!catMap.has(catId)) {
            catMap.set(catId, {
              name: asset.category.name,
              color: asset.category.colorCode,
              value: 0
            });
          }
          catMap.get(catId).value += asset.currentValue || 0;
        });

        return Array.from(catMap.values()).map(cat => ({
          ...cat,
          percentage: totalValue > 0 ? (cat.value / totalValue) * 100 : 0,
          value: parseFloat(cat.value.toFixed(2))
        }));
      })()
    ]);

    res.json({
      success: true,
      data: {
        dashboard: dashboardStats,
        categoryReport: {
          categories: categoryReport,
          summary: categoryReport.reduce((acc, cat) => {
            acc.totalAssets += cat.stats.count;
            acc.totalValue += cat.stats.totalCurrentValue;
            return acc;
          }, { totalAssets: 0, totalValue: 0 })
        },
        branchReport: {
          branches: branchReport,
          barChartData: branchReport
        },
        categoryDistribution: categoryDistribution.sort((a, b) => b.value - a.value)
      }
    });
  } catch (error) {
    console.error('❌ GET ALL REPORTS Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};