import User from "../models/User.js";
import excel from 'exceljs';
// controllers/assetController.js
import Asset from "../models/Asset.js";
import { ExcelService } from '../services/excelServices.js';
import { PdfService } from '../services/pdfService.js';
import PDFDocument from 'pdfkit';
import mongoose from "mongoose";


// 🏢 BÜTÜN VƏSAİTLƏRİ GƏTİR
export const getAllAssets = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { 
      category, 
      location, 
      status,
      department,
      responsiblePerson,
      isInsured,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId };
    
    // Filterləmə
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (responsiblePerson) filter.responsiblePerson = responsiblePerson;
    if (isInsured !== undefined) filter.isInsured = isInsured === 'true';

    // Sıralama
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const assets = await Asset.find(filter)
      .select('-document.bufferData -__v')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Asset.countDocuments(filter);

    // Statistika - burada xəta verirdi, düzəldək:
    const stats = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" },
          activeAssets: { 
            $sum: { $cond: [{ $eq: ["$status", "Aktiv"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statResult = stats[0] || {
      totalAssets: 0,
      totalInitialValue: 0,
      totalCurrentValue: 0,
      totalAmortization: 0,
      activeAssets: 0
    };

    res.json({
      success: true,
      data: assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalAssets: statResult.totalAssets,
        totalInitialValue: statResult.totalInitialValue,
        totalCurrentValue: statResult.totalCurrentValue,
        totalAmortization: statResult.totalAmortization,
        activeAssets: statResult.activeAssets
      }
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
          totalAssets: { $sum: 1 },
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" },
          activeAssets: { 
            $sum: { $cond: [{ $eq: ["$status", "Aktiv"] }, 1, 0] }
          }
        }
      }
    ]);
    
    const statResult = stats[0] || {
      totalAssets: 0,
      totalInitialValue: 0,
      totalCurrentValue: 0,
      totalAmortization: 0,
      activeAssets: 0
    };

    // Kateqoriyalara görə qruplaşdırma
    const categoryStats = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalValue: { $sum: "$currentValue" }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Statuslara görə qruplaşdırma
    const statusStats = await Asset.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$currentValue" }
        }
      }
    ]);

    // Aylıq amortizasiya
    const monthlyDepreciation = await Asset.aggregate([
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

    res.json({
      success: true,
      data: {
        summary: statResult,
        byCategory: categoryStats,
        byStatus: statusStats,
        monthlyDepreciation: monthlyDepreciation[0]?.totalMonthlyDepreciation || 0
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
    
    const {
      inventoryNumber,
      name,
      category,
      account,
      location,
      initialValue,
      currentValue, // Frontend bura boş göndərsə, biz avtomatik hesablayacayıq
      purchaseDate,
      serviceLife,
      notes,
      depreciationMethod,
      warrantyExpiryDate,
      nextMaintenanceDate,
      supplier,
      serialNumber,
      barcode,
      department,
      responsiblePerson,
      isInsured,
      insuranceExpiryDate,
      tags
    } = req.body;

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

    const userId = req.params.userId;
    
    // İnitialValue parse et
    const parsedInitialValue = parseFloat(initialValue) || 0;
    
    // ServiceLife parse et (minimum 5 il)
    const parsedServiceLife = Math.max(parseInt(serviceLife) || 5, 5);
    
    // PurchaseDate parse et
    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
    
    // ⭐ YENİ: İNDİKİ ZAMANA GÖRƏ AVTOMATİK HESABLAMA FUNKSİYASI
    const calculateCurrentValueByTime = (initialVal, purchaseDt, serviceLifeYears) => {
      const now = new Date();
      const purchase = new Date(purchaseDt);
      
      // Keçən ayları hesabla (mənfi olmasın)
      let monthsPassed = (now.getFullYear() - purchase.getFullYear()) * 12 + 
                        (now.getMonth() - purchase.getMonth());
      
      // Əgər purchaseDate gələcəkdədirsə, 0 et
      if (monthsPassed < 0) monthsPassed = 0;
      
      const totalMonths = serviceLifeYears * 12;
      
      // Əgər xidmət müddəti bitibsə
      if (monthsPassed >= totalMonths) {
        return {
          currentValue: 0,
          amortization: initialVal,
          amortizationPercentage: 100,
          status: "Sıradan çıxıb",
          monthsPassed: monthsPassed
        };
      }
      
      // Düz xətt üsulu ilə hesabla (default)
      const annualDepreciation = initialVal / serviceLifeYears;
      const monthlyDepreciation = annualDepreciation / 12;
      const totalDepreciation = monthlyDepreciation * monthsPassed;
      
      const currentVal = Math.max(0, initialVal - totalDepreciation);
      const amortizationPerc = initialVal > 0 ? (totalDepreciation / initialVal) * 100 : 0;
      
      return {
        currentValue: parseFloat(currentVal.toFixed(2)),
        amortization: parseFloat(totalDepreciation.toFixed(2)),
        amortizationPercentage: parseFloat(amortizationPerc.toFixed(2)),
        status: currentVal > 0 ? "Aktiv" : "Sıradan çıxıb",
        monthsPassed: monthsPassed
      };
    };
    
    // CURRENT VALUE LOGIC
    let finalCurrentValue;
    let finalAmortization;
    let finalAmortizationPercentage;
    let finalStatus;
    let calculationNote = "";
    
    if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
      // Əgər frontend-dən currentValue göndərilibsə, onu istifadə et
      finalCurrentValue = parseFloat(currentValue);
      
      // currentValue initialValue-dan böyük olmamalıdır
      if (finalCurrentValue > parsedInitialValue) {
        console.log(`❌ ERROR: currentValue (${finalCurrentValue}) initialValue-dan (${parsedInitialValue}) böyük ola bilməz`);
        return res.status(400).json({
          success: false,
          message: `Cari dəyər (${finalCurrentValue}) ilkin dəyərdən (${parsedInitialValue}) böyük ola bilməz`,
          errorCode: 'CURRENT_VALUE_EXCEEDS_INITIAL',
          initialValue: parsedInitialValue,
          currentValue: finalCurrentValue
        });
      }
      
      finalAmortization = parsedInitialValue - finalCurrentValue;
      finalAmortizationPercentage = parsedInitialValue > 0 ? 
        (finalAmortization / parsedInitialValue) * 100 : 0;
      finalStatus = finalCurrentValue > 0 ? "Aktiv" : "Sıradan çıxıb";
      calculationNote = "İstifadəçi tərəfindən daxil edildi";
      
    } else {
      // ⭐ ƏSAS YENİLİK: Frontend currentValue göndərməyibsə, İNDİKİ ZAMANA GÖRƏ AVTOMATİK HESABLA
      const calculated = calculateCurrentValueByTime(
        parsedInitialValue, 
        parsedPurchaseDate, 
        parsedServiceLife
      );
      
      finalCurrentValue = calculated.currentValue;
      finalAmortization = calculated.amortization;
      finalAmortizationPercentage = calculated.amortizationPercentage;
      finalStatus = calculated.status;
      calculationNote = `Avtomatik hesablandı (${calculated.monthsPassed} ay keçib)`;
      
      console.log(`🔄 currentValue avtomatik hesablandı:`, {
        initialValue: parsedInitialValue,
        purchaseDate: parsedPurchaseDate.toISOString().split('T')[0],
        serviceLife: parsedServiceLife,
        monthsPassed: calculated.monthsPassed,
        calculatedCurrentValue: finalCurrentValue,
        calculatedAmortization: finalAmortization,
        calculatedPercentage: finalAmortizationPercentage,
        calculatedStatus: finalStatus
      });
    }
    
    const assetData = {
      userId,
      inventoryNumber: inventoryNumber || `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name?.trim(),
      category: category?.trim(),
      account: account?.trim(),
      location: location?.trim(),
      initialValue: parsedInitialValue,
      currentValue: finalCurrentValue, // Hesablanmış dəyər
      amortization: finalAmortization, // Hesablanmış amortizasiya
      amortizationPercentage: finalAmortizationPercentage, // Hesablanmış faiz
      status: finalStatus, // Hesablanmış status
      purchaseDate: parsedPurchaseDate,
      serviceLife: parsedServiceLife,
      notes: notes?.trim(),
      depreciationMethod: depreciationMethod || "Düz xətt",
      warrantyExpiryDate: warrantyExpiryDate ? new Date(warrantyExpiryDate) : undefined,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : undefined,
      supplier: supplier?.trim(),
      serialNumber: serialNumber?.trim(),
      barcode: barcode?.trim(),
      department: department?.trim(),
      responsiblePerson: responsiblePerson?.trim(),
      isInsured: Boolean(isInsured),
      insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : []
    };

    console.log('✅ Asset Data to save:', {
      initialValue: parsedInitialValue,
      currentValue: finalCurrentValue,
      amortization: finalAmortization,
      amortizationPercentage: finalAmortizationPercentage,
      status: finalStatus,
      purchaseDate: parsedPurchaseDate.toISOString().split('T')[0],
      serviceLife: parsedServiceLife,
      calculationNote: calculationNote
    });
    
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
    const newAsset = await Asset.create(assetData);
    
    console.log('✅ Asset saved successfully');
    
    // Buffer data-sını client-ə göndərmirik
    const assetResponse = newAsset.toObject();
    if (assetResponse.document && assetResponse.document.bufferData) {
      delete assetResponse.document.bufferData;
    }

    res.status(201).json({
      success: true,
      data: assetResponse,
      message: "Vəsait uğurla əlavə edildi",
      calculationInfo: {
        initialValue: parsedInitialValue,
        currentValue: finalCurrentValue,
        amortization: finalAmortization,
        amortizationPercentage: finalAmortizationPercentage,
        status: finalStatus,
        purchaseDate: parsedPurchaseDate.toISOString().split('T')[0],
        serviceLife: parsedServiceLife,
        calculationNote: calculationNote,
        isValid: finalCurrentValue <= parsedInitialValue,
        note: "Cari dəyər ilkin dəyərdən böyük ola bilməz"
      }
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

// 🏢 BÜTÜN VƏSAİTLƏRİ GƏTİR

// 🏢 VƏSAİTİ ID İLƏ GƏTİR
export const getAssetById = async (req, res) => {
  try {
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ 
      _id: assetId, 
      userId 
    }).select('-document.bufferData -__v');

    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: asset
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
    
    // Əvvəlcə asset-i tapırıq
    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: "Vəsait tapılmadı" 
      });
    }

    // Yeniləmə məlumatları
    const updateData = { ...req.body };
    
    // Tarixləri düzgün formatla
    if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
    if (updateData.warrantyExpiryDate) updateData.warrantyExpiryDate = new Date(updateData.warrantyExpiryDate);
    if (updateData.nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(updateData.nextMaintenanceDate);
    if (updateData.insuranceExpiryDate) updateData.insuranceExpiryDate = new Date(updateData.insuranceExpiryDate);
    
    // Tags-i array-ə çevir
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    // ✅ Əgər yeni fayl yüklənibsə
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
    ).select('-document.bufferData -__v');

    res.json({
      success: true,
      data: updatedAsset,
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

// 🏢 VƏSAİT SƏNƏD ƏMƏLİYYATLARI

// Sənəd məlumatlarını gətir
export const getAssetDocument = async (req, res) => {
  try {
    console.log('🔍 GET ASSET DOCUMENT called');
    const { userId, assetId } = req.params;

    const asset = await Asset.findOne({ 
      _id: assetId, 
      userId 
    });

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

    const documentInfo = {
      originalName: asset.document.originalName,
      mimeType: asset.document.mimeType,
      fileSize: asset.document.fileSize,
      uploadedAt: asset.document.uploadedAt,
      downloadUrl: `/api/${userId}/assets/${assetId}/download-document`,
      directFileUrl: `/api/${userId}/assets/${assetId}/download-document?download=true`
    };

    res.json({
      success: true,
      message: "Sənəd məlumatları uğurla gətirildi",
      data: {
        assetId: asset._id,
        assetName: asset.name,
        document: documentInfo
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

// ✅ Bütün assetləri Excel formatında endir - DÜZƏLDİLMİŞ
export const downloadAllAssetsExcel = async (req, res) => {
  try {
    console.log("🚀 Excel download başladı...");
    
    const userId = req.params.userId;
    
    const assets = await Asset.find({ userId })
      .select('-document.bufferData -__v');

    console.log(`📊 ${assets.length} asset tapıldı`);
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Assets');
    
    // Sütun başlıqları
    worksheet.columns = [
      { header: 'Inventory No', key: 'inventoryNumber', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Initial Value', key: 'initialValue', width: 15 },
      { header: 'Current Value', key: 'currentValue', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    
    // Başlıq formatı
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    
    // Məlumatları əlavə et
    assets.forEach(asset => {
      worksheet.addRow({
        inventoryNumber: asset.inventoryNumber || '',
        name: asset.name || '',
        category: asset.category || '',
        location: asset.location || '',
        initialValue: asset.initialValue || 0,
        currentValue: asset.currentValue || 0,
        status: asset.status || 'Active'
      });
    });
    
    // Fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `assets_${timestamp}.xlsx`;
    
    console.log(`📁 Fayl adı: ${filename}`);
    
    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`✅ Buffer hazırdır. Ölçü: ${buffer.length} bytes`);
    
    // Response header-ları
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log("📤 Excel faylı göndərilir...");
    
    // Buffer-ı göndər
    res.end(buffer);
    
    console.log("🎉 Excel faylı uğurla göndərildi!");
    
  } catch (error) {
    console.error('❌ Excel xətası:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: `Excel xətası: ${error.message}`
      });
    }
  }
};

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
    console.log(`📊 Asset stats requested for user: ${userId}`);

    // 1. ÜMUMİ STATİSTİKALAR
    const overallStats = await Asset.getUserAssetStats(userId);
    
    console.log("✅ Overall stats fetched:", overallStats);

    // 2. KATEQORİYA ÜZRƏ STATİSTİKALAR
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
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" },
          averageAmortizationPercentage: { $avg: "$amortizationPercentage" }
        }
      },
      { $sort: { totalCurrentValue: -1 } }
    ]);

    console.log(`✅ Category stats fetched: ${categoryStats.length} categories`);

    // 3. STATUS ÜZRƏ STATİSTİKALAR
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
          count: { $sum: 1 },
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`✅ Status stats fetched: ${statusStats.length} statuses`);

    // 4. ŞÖBƏ ÜZRƏ STATİSTİKALAR
    const departmentStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          department: { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" }
        }
      },
      { $sort: { totalCurrentValue: -1 } },
      { $limit: 10 }
    ]);

    console.log(`✅ Department stats fetched: ${departmentStats.length} departments`);

    // 5. YER ÜZRƏ STATİSTİKALAR
    const locationStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          location: { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          totalCurrentValue: { $sum: "$currentValue" }
        }
      },
      { $sort: { totalCurrentValue: -1 } },
      { $limit: 10 }
    ]);

    console.log(`✅ Location stats fetched: ${locationStats.length} locations`);

    // 6. SON 12 AY ÜZRƏ STATİSTİKALAR
    const monthlyStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          purchaseDate: { $exists: true }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$purchaseDate" },
            month: { $month: "$purchaseDate" }
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$initialValue" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    console.log(`✅ Monthly stats fetched: ${monthlyStats.length} months`);

    // 7. DƏYƏR ARALIĞI ÜZRƏ STATİSTİKALAR
    const valueRangeStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $bucket: {
          groupBy: "$currentValue",
          boundaries: [0, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
          default: "1000000+",
          output: {
            count: { $sum: 1 },
            totalValue: { $sum: "$currentValue" }
          }
        }
      }
    ]);

    console.log(`✅ Value range stats fetched: ${valueRangeStats.length} ranges`);

    // 8. SON 30 GÜNDƏ ƏLAVƏ EDİLƏNLƏR
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAdditions = await Asset.countDocuments({
      userId,
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo }
    });

    console.log(`✅ Recent additions: ${recentAdditions}`);

    // 9. ORTA AMORTİZASİYA MÜDDƏTLƏRİ
    const amortizationStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          serviceLife: { $gt: 0 }
        } 
      },
      {
        $group: {
          _id: null,
          avgServiceLife: { $avg: "$serviceLife" },
          maxServiceLife: { $max: "$serviceLife" },
          minServiceLife: { $min: "$serviceLife" },
          totalRemainingLife: { $sum: "$remainingLife" }
        }
      }
    ]);

    console.log(`✅ Amortization stats fetched`);

    // 10. SƏNƏD OLMAYAN VƏSAİTLƏR
    const assetsWithoutDocument = await Asset.countDocuments({
      userId,
      isDeleted: false,
      $or: [
        { document: { $exists: false } },
        { document: null },
        { "document.originalName": { $exists: false } }
      ]
    });

    console.log(`✅ Assets without document: ${assetsWithoutDocument}`);

    // 11. BÖYÜK VƏSİTƏLƏR (Ən dəyərli 5 vəsait)
    const topValuableAssets = await Asset.find({
      userId,
      isDeleted: false
    })
    .select('name inventoryNumber category currentValue amortizationPercentage status purchaseDate')
    .sort({ currentValue: -1 })
    .limit(5)
    .lean();

    console.log(`✅ Top valuable assets: ${topValuableAssets.length}`);

    // 12. SON AMORTİZASİYA TARİXLƏRİ
    const lastAmortizationUpdate = await Asset.findOne({
      userId,
      isDeleted: false
    })
    .sort({ updatedAt: -1 })
    .select('updatedAt name')
    .lean();

    // 13. İLLƏR ÜZRƏ AMORTİZASİYA TENDENSİYASI
    const yearlyAmortization = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          purchaseDate: { $exists: true }
        } 
      },
      {
        $group: {
          _id: { $year: "$purchaseDate" },
          count: { $sum: 1 },
          avgAmortizationPercentage: { $avg: "$amortizationPercentage" },
          totalAmortization: { $sum: "$amortization" }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    console.log(`✅ Yearly amortization stats: ${yearlyAmortization.length} years`);

    // 14. DEPRESİYASIYA METODU ÜZRƏ STATİSTİKA
    const depreciationMethodStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: "$depreciationMethod",
          count: { $sum: 1 },
          totalValue: { $sum: "$currentValue" }
        }
      }
    ]);

    console.log(`✅ Depreciation method stats: ${depreciationMethodStats.length}`);

    // 15. SİGORTA VƏ ZƏMANƏT STATİSTİKALARI
    const insuranceStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: null,
          insuredCount: { 
            $sum: { $cond: [{ $eq: ["$isInsured", true] }, 1, 0] } 
          },
          warrantyActiveCount: { 
            $sum: { 
              $cond: [{
                $and: [
                  { $ne: ["$warrantyExpiryDate", null] },
                  { $gte: ["$warrantyExpiryDate", new Date()] }
                ]
              }, 1, 0] 
            } 
          },
          insuranceExpiringSoonCount: { 
            $sum: { 
              $cond: [{
                $and: [
                  { $ne: ["$insuranceExpiryDate", null] },
                  { $gte: ["$insuranceExpiryDate", new Date()] },
                  { $lte: ["$insuranceExpiryDate", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                ]
              }, 1, 0] 
            } 
          }
        }
      }
    ]);

    console.log(`✅ Insurance stats fetched`);

    // 16. TƏMİR VƏ BAXIM STATİSTİKALARI
    const maintenanceStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      {
        $group: {
          _id: null,
          maintenanceDueCount: { 
            $sum: { 
              $cond: [{
                $and: [
                  { $ne: ["$nextMaintenanceDate", null] },
                  { $lte: ["$nextMaintenanceDate", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }
                ]
              }, 1, 0] 
            } 
          },
          totalMaintenanceCost: { $sum: "$maintenanceCost" }
        }
      }
    ]);

    console.log(`✅ Maintenance stats fetched`);

    // RESPONSE DATA STRUCTURE
    const responseData = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        
        // Ümumi statistika
        overview: {
          totalAssets: overallStats.totalAssets || 0,
          totalInitialValue: parseFloat(overallStats.totalInitialValue?.toFixed(2)) || 0,
          totalCurrentValue: parseFloat(overallStats.totalCurrentValue?.toFixed(2)) || 0,
          totalAmortization: parseFloat(overallStats.totalAmortization?.toFixed(2)) || 0,
          totalMaintenanceCost: parseFloat(overallStats.totalMaintenanceCost?.toFixed(2)) || 0,
          activeAssets: overallStats.activeAssets || 0,
          passiveAssets: overallStats.passiveAssets || 0,
          soldAssets: overallStats.soldAssets || 0,
          averageAmortizationPercentage: overallStats.totalInitialValue > 0 
            ? parseFloat(((overallStats.totalAmortization / overallStats.totalInitialValue) * 100).toFixed(2))
            : 0
        },

        // Kateqoriya üzrə
        byCategory: categoryStats.map(cat => ({
          category: cat._id || 'Müəyyən edilməyib',
          count: cat.count,
          totalInitialValue: parseFloat(cat.totalInitialValue?.toFixed(2)) || 0,
          totalCurrentValue: parseFloat(cat.totalCurrentValue?.toFixed(2)) || 0,
          totalAmortization: parseFloat(cat.totalAmortization?.toFixed(2)) || 0,
          averageAmortizationPercentage: parseFloat(cat.averageAmortizationPercentage?.toFixed(2)) || 0,
          percentageOfTotal: overallStats.totalCurrentValue > 0 
            ? parseFloat(((cat.totalCurrentValue / overallStats.totalCurrentValue) * 100).toFixed(2))
            : 0
        })),

        // Status üzrə
        byStatus: statusStats.map(stat => ({
          status: stat._id || 'Müəyyən edilməyib',
          count: stat.count,
          totalInitialValue: parseFloat(stat.totalInitialValue?.toFixed(2)) || 0,
          totalCurrentValue: parseFloat(stat.totalCurrentValue?.toFixed(2)) || 0,
          totalAmortization: parseFloat(stat.totalAmortization?.toFixed(2)) || 0
        })),

        // Şöbə üzrə
        byDepartment: departmentStats.map(dept => ({
          department: dept._id || 'Müəyyən edilməyib',
          count: dept.count,
          totalInitialValue: parseFloat(dept.totalInitialValue?.toFixed(2)) || 0,
          totalCurrentValue: parseFloat(dept.totalCurrentValue?.toFixed(2)) || 0,
          totalAmortization: parseFloat(dept.totalAmortization?.toFixed(2)) || 0
        })),

        // Yer üzrə
        byLocation: locationStats.map(loc => ({
          location: loc._id || 'Müəyyən edilməyib',
          count: loc.count,
          totalCurrentValue: parseFloat(loc.totalCurrentValue?.toFixed(2)) || 0
        })),

        // Aylıq statistikalar
        monthlyTrends: monthlyStats.map(month => ({
          year: month._id.year,
          month: month._id.month,
          count: month.count,
          totalValue: parseFloat(month.totalValue?.toFixed(2)) || 0
        })),

        // Dəyər aralığı üzrə
        byValueRange: valueRangeStats.map(range => ({
          range: range._id,
          count: range.count,
          totalValue: parseFloat(range.totalValue?.toFixed(2)) || 0
        })),

        // Aktivlik statistikaları
        activity: {
          recentAdditions: recentAdditions,
          lastAmortizationUpdate: lastAmortizationUpdate?.updatedAt || null,
          lastUpdatedAsset: lastAmortizationUpdate?.name || null
        },

        // Amortizasiya statistikaları
        amortizationAnalysis: {
          avgServiceLife: amortizationStats[0]?.avgServiceLife 
            ? parseFloat(amortizationStats[0].avgServiceLife.toFixed(1)) 
            : 0,
          maxServiceLife: amortizationStats[0]?.maxServiceLife || 0,
          minServiceLife: amortizationStats[0]?.minServiceLife || 0,
          totalRemainingLife: amortizationStats[0]?.totalRemainingLife || 0,
          assetsWithoutDocument: assetsWithoutDocument,
          percentageWithDocument: overallStats.totalAssets > 0 
            ? parseFloat(((overallStats.totalAssets - assetsWithoutDocument) / overallStats.totalAssets * 100).toFixed(2))
            : 0
        },

        // Ən dəyərli vəsaitlər
        topValuableAssets: topValuableAssets.map(asset => ({
          name: asset.name,
          inventoryNumber: asset.inventoryNumber,
          category: asset.category,
          currentValue: parseFloat(asset.currentValue?.toFixed(2)) || 0,
          amortizationPercentage: parseFloat(asset.amortizationPercentage?.toFixed(2)) || 0,
          status: asset.status,
          purchaseDate: asset.purchaseDate
        })),

        // İllər üzrə amortizasiya
        yearlyAmortizationTrend: yearlyAmortization.map(year => ({
          year: year._id,
          count: year.count,
          avgAmortizationPercentage: parseFloat(year.avgAmortizationPercentage?.toFixed(2)) || 0,
          totalAmortization: parseFloat(year.totalAmortization?.toFixed(2)) || 0
        })),

        // Depresiyasiya metodu üzrə
        byDepreciationMethod: depreciationMethodStats.map(method => ({
          method: method._id || 'Düz xətt',
          count: method.count,
          totalValue: parseFloat(method.totalValue?.toFixed(2)) || 0
        })),

        // Təhlükəsizlik statistikaları
        securityStats: {
          insuredAssets: insuranceStats[0]?.insuredCount || 0,
          warrantyActiveAssets: insuranceStats[0]?.warrantyActiveCount || 0,
          insuranceExpiringSoon: insuranceStats[0]?.insuranceExpiringSoonCount || 0,
          maintenanceDueAssets: maintenanceStats[0]?.maintenanceDueCount || 0,
          totalMaintenanceCost: parseFloat(maintenanceStats[0]?.totalMaintenanceCost?.toFixed(2)) || 0
        },

        // Performans göstəriciləri
        performanceMetrics: {
          valueRetentionRate: overallStats.totalInitialValue > 0 
            ? parseFloat((overallStats.totalCurrentValue / overallStats.totalInitialValue * 100).toFixed(2))
            : 0,
          amortizationRate: overallStats.totalInitialValue > 0 
            ? parseFloat((overallStats.totalAmortization / overallStats.totalInitialValue * 100).toFixed(2))
            : 0,
          annualDepreciation: overallStats.totalAssets > 0 
            ? parseFloat((overallStats.totalAmortization / amortizationStats[0]?.avgServiceLife).toFixed(2))
            : 0,
          averageAssetValue: overallStats.totalAssets > 0 
            ? parseFloat((overallStats.totalCurrentValue / overallStats.totalAssets).toFixed(2))
            : 0
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timezone: 'Asia/Baku',
        dataPoints: {
          categories: categoryStats.length,
          statuses: statusStats.length,
          departments: departmentStats.length,
          locations: locationStats.length,
          months: monthlyStats.length,
          valueRanges: valueRangeStats.length
        }
      }
    };

    console.log("✅ Asset statistics prepared successfully");
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ GET ASSET STATISTICS Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
export const getDepartmentValues = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`📊 Department values requested for user: ${userId}`);

    // 1. ŞÖBƏLƏR ÜZRƏ ÜMUMİ STATİSTİKALAR
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
      },
      { $sort: { totalCurrentValue: -1 } }
    ]);

    console.log(`✅ Department stats fetched: ${departmentStats.length} departments`);

    // 2. ÜMUMİ DƏYƏRLƏR
    const overallStats = await Asset.getUserAssetStats(userId);

    // 3. FAALİYYƏT GÖSTƏRİCİLƏRİ
    const activityStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          department: { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$department",
          recentAssetsCount: {
            $sum: {
              $cond: [
                {
                  $gte: ["$createdAt", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
                },
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
    ]);

    console.log(`✅ Activity stats fetched: ${activityStats.length} departments`);

    // 4. ŞÖBƏLƏR ÜZRƏ KATEQORİYA PAYLANMASI
    const departmentCategoryStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
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
      },
      {
        $project: {
          department: "$_id",
          categories: { $slice: ["$categories", 5] }, // İlk 5 kateqoriya
          totalCategories: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Department category stats fetched: ${departmentCategoryStats.length} departments`);

    // 5. ŞÖBƏLƏR ÜZRƏ MƏSUL ŞƏXSLƏR
    const departmentPersonnelStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
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
      },
      {
        $project: {
          department: "$_id",
          personnel: { $slice: ["$personnel", 5] }, // İlk 5 şəxs
          totalPersonnel: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Department personnel stats fetched: ${departmentPersonnelStats.length} departments`);

    // 6. ŞÖBƏLƏR ÜZRƏ VƏSİTƏ YAŞI ANALİZİ
    const departmentAgeStats = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          department: { $exists: true, $ne: "" },
          purchaseDate: { $exists: true }
        } 
      },
      {
        $addFields: {
          assetAgeInYears: {
            $divide: [
              {
                $subtract: [new Date(), "$purchaseDate"]
              },
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
      },
      {
        $project: {
          department: "$_id",
          avgAssetAge: { $round: ["$avgAssetAge", 1] },
          oldestAssetAge: { $round: ["$oldestAssetAge", 1] },
          newestAssetAge: { $round: ["$newestAssetAge", 1] },
          assetCount: 1,
          _id: 0
        }
      },
      { $sort: { avgAssetAge: -1 } }
    ]);

    console.log(`✅ Department age stats fetched: ${departmentAgeStats.length} departments`);

    // 7. ŞÖBƏLƏR ÜZRƏ SON 12 AY FAALİYYƏTİ
    const last12Months = new Date();
    last12Months.setMonth(last12Months.getMonth() - 12);

    const departmentMonthlyActivity = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          department: { $exists: true, $ne: "" },
          createdAt: { $gte: last12Months }
        } 
      },
      {
        $group: {
          _id: {
            department: "$department",
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          assetCount: { $sum: 1 },
          totalValue: { $sum: "$initialValue" }
        }
      },
      {
        $group: {
          _id: "$_id.department",
          monthlyActivity: {
            $push: {
              year: "$_id.year",
              month: "$_id.month",
              assetCount: "$assetCount",
              totalValue: "$totalValue"
            }
          },
          totalAdditions: { $sum: "$assetCount" }
        }
      },
      {
        $project: {
          department: "$_id",
          monthlyActivity: { $slice: ["$monthlyActivity", 6] }, // Son 6 ay
          totalAdditions: 1,
          _id: 0
        }
      }
    ]);

    console.log(`✅ Department monthly activity fetched: ${departmentMonthlyActivity.length} departments`);

    // 8. ŞÖBƏLƏR ÜZRƏ PERFORMANS GÖSTƏRİCİLƏRİ
    const departmentPerformance = await Asset.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          isDeleted: false,
          department: { $exists: true, $ne: "" }
        } 
      },
      {
        $group: {
          _id: "$department",
          assetCount: { $sum: 1 },
          totalInitialValue: { $sum: "$initialValue" },
          totalCurrentValue: { $sum: "$currentValue" },
          totalAmortization: { $sum: "$amortization" },
          maintenanceCost: { $sum: "$maintenanceCost" }
        }
      },
      {
        $project: {
          department: "$_id",
          assetCount: 1,
          totalInitialValue: { $round: ["$totalInitialValue", 2] },
          totalCurrentValue: { $round: ["$totalCurrentValue", 2] },
          totalAmortization: { $round: ["$totalAmortization", 2] },
          maintenanceCost: { $round: ["$maintenanceCost", 2] },
          valueRetentionRate: {
            $cond: [
              { $eq: ["$totalInitialValue", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$totalCurrentValue", "$totalInitialValue"] }, 100] }, 2] }
            ]
          },
          amortizationRate: {
            $cond: [
              { $eq: ["$totalInitialValue", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$totalAmortization", "$totalInitialValue"] }, 100] }, 2] }
            ]
          },
          maintenanceRate: {
            $cond: [
              { $eq: ["$totalCurrentValue", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$maintenanceCost", "$totalCurrentValue"] }, 100] }, 2] }
            ]
          },
          avgAssetValue: {
            $cond: [
              { $eq: ["$assetCount", 0] },
              0,
              { $round: [{ $divide: ["$totalCurrentValue", "$assetCount"] }, 2] }
            ]
          },
          _id: 0
        }
      },
      { $sort: { totalCurrentValue: -1 } }
    ]);

    console.log(`✅ Department performance stats fetched: ${departmentPerformance.length} departments`);

    // 9. RESPONSE DATA STRUCTURE
    const responseData = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        
        // Ümumi statistika
        overview: {
          totalDepartments: departmentStats.length,
          totalAssets: overallStats.totalAssets || 0,
          totalValue: parseFloat(overallStats.totalCurrentValue?.toFixed(2)) || 0,
          averageAssetsPerDepartment: departmentStats.length > 0 
            ? parseFloat((overallStats.totalAssets / departmentStats.length).toFixed(1))
            : 0,
          departmentsWithAssets: departmentStats.filter(d => d.assetCount > 0).length,
          undefinedDepartmentAssets: departmentStats.find(d => d.department === "Müəyyən edilməyib")?.assetCount || 0
        },

        // Şöbə üzrə statistikalar
        departments: departmentStats.map(dept => {
          const activity = activityStats.find(a => a._id === dept.department);
          const category = departmentCategoryStats.find(c => c.department === dept.department);
          const personnel = departmentPersonnelStats.find(p => p.department === dept.department);
          const age = departmentAgeStats.find(a => a.department === dept.department);
          const monthly = departmentMonthlyActivity.find(m => m.department === dept.department);
          const performance = departmentPerformance.find(p => p.department === dept.department);

          return {
            // Əsas məlumatlar
            department: dept.department,
            assetCount: dept.assetCount,
            financials: {
              initialValue: dept.totalInitialValue,
              currentValue: dept.totalCurrentValue,
              amortization: dept.totalAmortization,
              maintenanceCost: dept.maintenanceCost,
              insuranceAmount: dept.insuranceAmount,
              valueRetentionRate: performance?.valueRetentionRate || 0,
              amortizationRate: performance?.amortizationRate || 0
            },

            // Performans göstəriciləri
            performanceMetrics: {
              avgAmortizationPercentage: dept.avgAmortizationPercentage || 0,
              avgAssetValue: performance?.avgAssetValue || 0,
              maintenanceRate: performance?.maintenanceRate || 0,
              efficiencyScore: calculateEfficiencyScore(dept, performance)
            },

            // Aktivlik göstəriciləri
            activity: {
              recentAdditions: activity?.recentAssetsCount || 0,
              maintenanceDue: activity?.maintenanceDueCount || 0,
              warrantyActive: activity?.warrantyActiveCount || 0,
              totalAdditions: monthly?.totalAdditions || 0
            },

            // Yaş analizi
            ageAnalysis: {
              avgAssetAge: age?.avgAssetAge || 0,
              oldestAssetAge: age?.oldestAssetAge || 0,
              newestAssetAge: age?.newestAssetAge || 0,
              ageCategory: getAgeCategory(age?.avgAssetAge || 0)
            },

            // Kompozisiya
            composition: {
              categories: category?.categories || [],
              totalCategories: category?.totalCategories || 0,
              personnel: personnel?.personnel || [],
              totalPersonnel: personnel?.totalPersonnel || 0
            },

            // Trendlər
            trends: {
              monthlyActivity: monthly?.monthlyActivity || [],
              growthRate: calculateGrowthRate(dept, monthly),
              valueTrend: getValueTrend(dept, overallStats)
            },

            // Ümumi dəyərlərdə payı
            percentageOfTotal: overallStats.totalCurrentValue > 0
              ? parseFloat(((dept.totalCurrentValue / overallStats.totalCurrentValue) * 100).toFixed(2))
              : 0,

            // Prioritizasiya
            priority: getDepartmentPriority(dept, activity)
          };
        }),

        // Toplamalar
        summary: {
          topDepartmentsByValue: departmentStats
            .filter(d => d.department !== "Müəyyən edilməyib")
            .slice(0, 5)
            .map(d => ({
              department: d.department,
              value: d.totalCurrentValue,
              percentage: overallStats.totalCurrentValue > 0
                ? parseFloat(((d.totalCurrentValue / overallStats.totalCurrentValue) * 100).toFixed(2))
                : 0
            })),

          topDepartmentsByAssetCount: departmentStats
            .filter(d => d.department !== "Müəyyən edilməyib")
            .sort((a, b) => b.assetCount - a.assetCount)
            .slice(0, 5)
            .map(d => ({
              department: d.department,
              assetCount: d.assetCount,
              percentage: overallStats.totalAssets > 0
                ? parseFloat(((d.assetCount / overallStats.totalAssets) * 100).toFixed(2))
                : 0
            })),

          departmentsRequiringAttention: departmentStats
            .filter(d => {
              const activity = activityStats.find(a => a._id === d.department);
              return activity?.maintenanceDueCount > 0 || 
                     d.avgAmortizationPercentage > 70 ||
                     d.totalCurrentValue < (d.totalInitialValue * 0.3);
            })
            .map(d => ({
              department: d.department,
              issues: [
                ...(activityStats.find(a => a._id === d.department)?.maintenanceDueCount > 0 
                  ? ["Təmir tələb olunan vəsaitlər"] 
                  : []),
                ...(d.avgAmortizationPercentage > 70 
                  ? ["Yüksək amortizasiya dərəcəsi"] 
                  : []),
                ...(d.totalCurrentValue < (d.totalInitialValue * 0.3) 
                  ? ["Aşağı dəyər saxlanması"] 
                  : [])
              ]
            }))
        },

        // Analiz nəticələri
        analysis: {
          distribution: {
            byValue: departmentStats.reduce((acc, dept) => {
              const range = getValueRange(dept.totalCurrentValue);
              acc[range] = (acc[range] || 0) + 1;
              return acc;
            }, {}),

            byAssetCount: departmentStats.reduce((acc, dept) => {
              const range = getAssetCountRange(dept.assetCount);
              acc[range] = (acc[range] || 0) + 1;
              return acc;
            }, {})
          },

          recommendations: generateDepartmentRecommendations(departmentStats, activityStats)
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timezone: 'Asia/Baku',
        departmentsAnalyzed: departmentStats.length,
        assetsAnalyzed: overallStats.totalAssets,
        dataPoints: {
          financial: departmentStats.length * 6, // 6 financial metric per department
          performance: departmentStats.length * 4,
          activity: departmentStats.length * 4,
          age: departmentStats.length * 4,
          composition: departmentStats.length * 2
        }
      }
    };

    console.log("✅ Department values prepared successfully");
    
    res.json(responseData);

  } catch (error) {
    console.error('❌ GET DEPARTMENT VALUES Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
import Category from "../models/Category.js";

// 📊 KATEQORİYA ƏMƏLİYYATLARI

// Bütün kateqoriyaları gətir
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