import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export class PdfService {
  
  // Amortizasiya hesabatı üçün PDF yarat
  static async generateAmortizationPdf(assets, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `amortization_report_${user.companyName}_${Date.now()}.pdf`;
        const filePath = path.join('./uploads/pdf', fileName);
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('AMORTİZASİYA HESABATI', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Tarix: ${new Date().toLocaleDateString('az-AZ')}`, { align: 'center' });
        
        doc.moveDown(2);

        // Vəsaitlər
        assets.forEach((asset, index) => {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text(asset.name);
          
          doc.fontSize(10)
             .font('Helvetica')
             .text(`  İnv. №: ${asset.inventoryNumber}`)
             .text(`  Kateqoriya: ${asset.category}`)
             .text(`  İlkin dəyər: ${asset.initialValue.toLocaleString('az-AZ')} ₼`)
             .text(`  Cari dəyər: ${asset.currentValue.toLocaleString('az-AZ')} ₼`)
             .text(`  Amortizasiya: ${asset.amortization.toLocaleString('az-AZ')} ₼ (${asset.amortizationPercentage}%)`);
          
          doc.moveDown();
          doc.text('─────────────────────────────────────────────────────────────');
          doc.moveDown();
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(10)
           .text(`Hesabat tarixi: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`, { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve({
            fileName,
            filePath,
            fileSize: fs.statSync(filePath).size
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Kateqoriya hesabatı üçün PDF yarat
  static async generateCategoryPdf(categoryData, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `category_report_${user.companyName}_${Date.now()}.pdf`;
        const filePath = path.join('./uploads/pdf', fileName);
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('KATEQORİYA HESABATI', { align: 'center' });
        
        doc.moveDown();

        // Cədvəl header
        const startY = doc.y;
        const columnWidth = 90;
        
        // Başlıqlar
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Kateqoriya', 50, startY)
           .text('Vəsaitlər', 50 + columnWidth, startY)
           .text('İlkin dəyər', 50 + columnWidth * 2, startY)
           .text('Cari dəyər', 50 + columnWidth * 3, startY)
           .text('Amortizasiya', 50 + columnWidth * 4, startY)
           .text('%', 50 + columnWidth * 5, startY);

        doc.moveTo(50, startY + 15)
           .lineTo(50 + columnWidth * 6, startY + 15)
           .stroke();

        let currentY = startY + 25;

        // Məlumatlar
        categoryData.data.forEach(item => {
          if (currentY > 700) { // Yeni səhifə
            doc.addPage();
            currentY = 50;
          }

          doc.fontSize(9)
             .font('Helvetica')
             .text(item.category, 50, currentY)
             .text(item.assetCount.toString(), 50 + columnWidth, currentY)
             .text(item.initialValue.toLocaleString('az-AZ'), 50 + columnWidth * 2, currentY)
             .text(item.currentValue.toLocaleString('az-AZ'), 50 + columnWidth * 3, currentY)
             .text(item.amortization.toLocaleString('az-AZ'), 50 + columnWidth * 4, currentY)
             .text(item.amortizationPercentage + '%', 50 + columnWidth * 5, currentY);

          currentY += 20;
        });

        // Cəmi
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Cəmi', 50, currentY)
           .text(categoryData.summary.totalAssets.toString(), 50 + columnWidth, currentY)
           .text(categoryData.summary.totalInitialValue.toLocaleString('az-AZ'), 50 + columnWidth * 2, currentY)
           .text(categoryData.summary.totalCurrentValue.toLocaleString('az-AZ'), 50 + columnWidth * 3, currentY)
           .text(categoryData.summary.totalAmortization.toLocaleString('az-AZ'), 50 + columnWidth * 4, currentY)
           .text(categoryData.summary.averageAmortizationPercentage.toFixed(2) + '%', 50 + columnWidth * 5, currentY);

        doc.end();

        stream.on('finish', () => {
          resolve({
            fileName,
            filePath,
            fileSize: fs.statSync(filePath).size
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}