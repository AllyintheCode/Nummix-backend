import Excel from 'exceljs';

export class ExcelService {
  /**
   * Ümumi Excel generatoru
   * @param {Array} data - Məlumatlar (array of objects)
   * @param {string} sheetName - Vərəq adı
   * @param {Array} columns - Sütun tərifləri (ExcelJS formatında)
   * @param {string} filename - Fayl adı (genişləndirmə .xlsx olmalıdır)
   * @param {Object} options - Əlavə seçimlər
   * @returns {Promise<Buffer>} Excel faylının buffer-i
   */
  static async generateExcel(data, sheetName, columns, filename, options = {}) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Sütunları təyin et
    worksheet.columns = columns;

    // Başlıq formatı
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    if (options.headerColor) {
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: options.headerColor }
      };
    }

    // Məlumatları əlavə et
    data.forEach(item => {
      const row = {};
      columns.forEach(col => {
        row[col.key] = item[col.key] !== undefined ? item[col.key] : '';
      });
      worksheet.addRow(row);
    });

    // Rəqəm formatı tətbiq et (əgər varsa)
    if (options.numberColumns) {
      options.numberColumns.forEach(colKey => {
        const col = worksheet.getColumn(colKey);
        col.numFmt = '#,##0.00';
      });
    }

    // Sütun genişliklərini tənzimlə
    worksheet.columns.forEach(col => {
      if (col.width === undefined) col.width = 15;
    });

    // Buffer yarat
    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Təhlükəsiz fayl adı yarat
   */
  static sanitizeFilename(filename) {
    return filename.replace(/[^\w\s.-]/gi, '_');
  }
}