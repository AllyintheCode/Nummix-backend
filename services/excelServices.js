import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

export class ExcelService {
  
  // Vəsaitlər üçün Excel hesabatı yarat
  static async generateAssetsExcel(assets, user) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vəsaitlər');

    // Stil təyinləri
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const currencyStyle = {
      numFmt: '#,##0.00" ₼"'
    };

    // Sütun başlıqları
    worksheet.columns = [
      { header: 'İnv. №', key: 'inventoryNumber', width: 15 },
      { header: 'Ad', key: 'name', width: 25 },
      { header: 'Kateqoriya', key: 'category', width: 20 },
      { header: 'Hesab', key: 'account', width: 10 },
      { header: 'Yer', key: 'location', width: 15 },
      { header: 'İlkin dəyər (₼)', key: 'initialValue', width: 15, style: currencyStyle },
      { header: 'Cari dəyər (₼)', key: 'currentValue', width: 15, style: currencyStyle },
      { header: 'Amortizasiya (₼)', key: 'amortization', width: 15, style: currencyStyle },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Başlıq sətiri
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Məlumatları əlavə et
    assets.forEach((asset, index) => {
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

    // Cəmi sətiri
    const totalRow = worksheet.addRow({});
    totalRow.getCell(6).value = {
      formula: `SUM(F2:F${assets.length + 1})`,
      result: assets.reduce((sum, asset) => sum + asset.initialValue, 0)
    };
    totalRow.getCell(7).value = {
      formula: `SUM(G2:G${assets.length + 1})`,
      result: assets.reduce((sum, asset) => sum + asset.currentValue, 0)
    };
    totalRow.getCell(8).value = {
      formula: `SUM(H2:H${assets.length + 1})`,
      result: assets.reduce((sum, asset) => sum + asset.amortization, 0)
    };

    totalRow.eachCell((cell) => {
      if (cell.value) {
        cell.style = { ...currencyStyle, font: { bold: true } };
      }
    });

    // Metadata
    worksheet.getCell('A1').value = 'Ümumi Vəsait Hesabatı';
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').style = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' }
    };

    // Faylı yadda saxla
    const fileName = `assets_report_${user.companyName}_${Date.now()}.xlsx`;
    const filePath = path.join('./uploads/excel', fileName);
    
    await workbook.xlsx.writeFile(filePath);
    
    return {
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size
    };
  }

  // Kateqoriya üzrə Excel hesabatı
  static async generateCategoryExcel(categoryData, user) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kateqoriya Üzrə');

    // Sütun başlıqları
    worksheet.columns = [
      { header: 'Kateqoriya', key: 'category', width: 25 },
      { header: 'Vəsaitlər', key: 'assetCount', width: 12 },
      { header: 'İlkin dəyər (₼)', key: 'initialValue', width: 15 },
      { header: 'Cari dəyər (₼)', key: 'currentValue', width: 15 },
      { header: 'Amortizasiya (₼)', key: 'amortization', width: 15 },
      { header: '%', key: 'percentage', width: 10 }
    ];

    // Məlumatları əlavə et
    categoryData.data.forEach(item => {
      worksheet.addRow({
        category: item.category,
        assetCount: item.assetCount,
        initialValue: item.initialValue,
        currentValue: item.currentValue,
        amortization: item.amortization,
        percentage: item.amortizationPercentage
      });
    });

    // Cəmi sətiri
    const totalRow = worksheet.addRow({
      category: 'Cəmi',
      assetCount: categoryData.summary.totalAssets,
      initialValue: categoryData.summary.totalInitialValue,
      currentValue: categoryData.summary.totalCurrentValue,
      amortization: categoryData.summary.totalAmortization,
      percentage: categoryData.summary.averageAmortizationPercentage
    });

    totalRow.eachCell((cell) => {
      cell.style = { font: { bold: true } };
    });

    const fileName = `category_report_${user.companyName}_${Date.now()}.xlsx`;
    const filePath = path.join('./uploads/excel', fileName);
    
    await workbook.xlsx.writeFile(filePath);
    
    return {
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size
    };
  }
}