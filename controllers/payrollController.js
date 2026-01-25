import taxCalculationService from '../services/taxCalculationService.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import AccountingEntry from '../models/AccountingEntry.js';
import mongoose from 'mongoose';
 import ExcelJS from 'exceljs';

// Hamısı bir faylda - Comprehensive Payroll Excel Export

// Hamısı bir faylda - Comprehensive Payroll Excel Export
export const exportComprehensivePayrollExcel = async (req, res) => {
  try {
    console.log('📊 Comprehensive Excel export başladı...');
    
    // 1. User kontrolü
    if (!req.user || !req.user._id) {
      console.error('❌ User authentication hatası');
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    const userId = req.user._id;
    const { month, year, includeEmployees, includeAccounting } = req.query;
    
    console.log('Comprehensive export parametreler:', {
      userId,
      month,
      year,
      includeEmployees,
      includeAccounting
    });

    // Tarix filteri
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    // 2. Yeni Excel workbook yarat
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nummix HR System - Comprehensive Payroll Report';
    workbook.created = new Date();
    
    // ===================== VƏRƏQ 1: ƏSAS PAYROLL CƏDVƏLİ =====================
    console.log('📄 Vərəq 1 yaradılır: Payroll Summary...');
    
    const summarySheet = workbook.addWorksheet('Payroll Summary');
    
    // Başlıq sətirləri
    summarySheet.mergeCells('A1:K1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'PAYROLL MƏLUMAT CƏDVƏLİ';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    
    summarySheet.mergeCells('A2:K2');
    const periodCell = summarySheet.getCell('A2');
    periodCell.value = `Dövr: ${targetMonth}/${targetYear} | Tarix: ${new Date().toLocaleDateString('az-AZ')}`;
    periodCell.font = { bold: true, size: 11 };
    periodCell.alignment = { horizontal: 'center' };
    periodCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D9E1F2' }
    };

    // Boş sətir
    summarySheet.getRow(3).height = 5;

    // Sütun başlıqları (4-cü sətirdən başlayır)
    summarySheet.columns = [
      { header: '№', key: 'index', width: 5 },
      { header: 'İŞÇİNİN ADI', key: 'fullName', width: 25 },
      { header: 'VƏZİFƏSİ', key: 'position', width: 20 },
      { header: 'DEPARTAMENT', key: 'department', width: 15 },
      { header: 'İŞÇİ NÖVÜ', key: 'employeeType', width: 12 },
      { header: 'BRÜT MAAŞ', key: 'gross', width: 15 },
      { header: 'GƏLİR VERGİSİ (14%)', key: 'incomeTax', width: 15 },
      { header: 'SOSİAL ÖDƏNİŞ', key: 'socialPayment', width: 15 },
      { header: 'ÜMUMİ VERGİ', key: 'totalTax', width: 15 },
      { header: 'NET MAAŞ', key: 'netSalary', width: 15 },
      { header: 'MAAŞ STATUSU', key: 'salaryStatus', width: 12 }
    ];

    // Sütun başlıqlarını 4-cü sətirə yaz
    const headerRow = summarySheet.getRow(4);
    summarySheet.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E0E0' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // 3. İşçi məlumatlarını gətir
    const filter = { 
      companyId: userId,
      status: 'active'
    };

    console.log('Database filter:', filter);

    const employees = await Employee.find(filter)
      .select("firstName lastName gross Net_salary tax social_pay employeeType position Department salary_status")
      .lean();

    console.log(`✅ ${employees.length} işçi tapıldı`);

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll üçün işçi tapılmadı"
      });
    }

    // Məlumatları əlavə et
    let totalGross = 0;
    let totalIncomeTax = 0;
    let totalSocialPayment = 0;
    let totalNet = 0;
    let totalDsmfEmployee = 0;
    let totalItsEmployee = 0;
    let totalIshEmployee = 0;
    let totalDsmfEmployer = 0;
    let totalItsEmployer = 0;
    let totalIshEmployer = 0;
    let totalGvTax = 0;

    // Vergiləri əvvəlcədən hesabla
    employees.forEach((employee) => {
      try {
        const taxResult = taxCalculationService.calculateAllTaxes(
          employee.gross || 0,
          employee.employeeType || 'private'
        );

        const employeeTaxes = taxResult.employee.taxes || {};
        const employerTaxes = taxResult.employer?.employerTaxes || {};
        
        totalIncomeTax += employeeTaxes.incomeTax || 0;
        totalDsmfEmployee += employeeTaxes.dsmf || 0;
        totalItsEmployee += employeeTaxes.its || 0;
        totalIshEmployee += employeeTaxes.ish || 0;
        totalGvTax += employeeTaxes.gvTax || 0;
        
        totalDsmfEmployer += employerTaxes.dsmf || 0;
        totalItsEmployer += employerTaxes.its || 0;
        totalIshEmployer += employerTaxes.ish || 0;

        // Konsol log
        console.log(`İşçi: ${employee.firstName} ${employee.lastName}, Brüt: ${employee.gross}, İşçi növü: ${employee.employeeType}`);
      } catch (error) {
        console.error(`Vergi hesablaması xətası ${employee.firstName} ${employee.lastName}:`, error.message);
      }
    });

    const totalEmployeeTaxes = totalIncomeTax + totalDsmfEmployee + 
                              totalItsEmployee + totalIshEmployee + totalGvTax;
    const totalEmployerTaxes = totalDsmfEmployer + totalItsEmployer + totalIshEmployer;
    const totalAllTaxes = totalEmployeeTaxes + totalEmployerTaxes;

    // Sətirləri əlavə et (5-ci sətirdən başlayır)
    employees.forEach((employee, index) => {
      const rowNumber = index + 5;
      const row = summarySheet.getRow(rowNumber);
      
      try {
        const taxResult = taxCalculationService.calculateAllTaxes(
          employee.gross || 0,
          employee.employeeType || 'private'
        );

        const employeeTaxes = taxResult.employee.taxes || {};
        const incomeTax = employeeTaxes.incomeTax || 0;
        const socialPayment = (employeeTaxes.dsmf || 0) + (employeeTaxes.its || 0) + (employeeTaxes.ish || 0);
        const totalTax = incomeTax + socialPayment;
        
        row.getCell(1).value = index + 1; // №
        row.getCell(2).value = `${employee.firstName || ''} ${employee.lastName || ''}`; // İşçinin adı
        row.getCell(3).value = employee.position || ''; // Vəzifə
        row.getCell(4).value = employee.Department || ''; // Departament
        row.getCell(5).value = employee.employeeType === 'state' ? 'Dövlət' : 'Özəl'; // İşçi növü
        row.getCell(6).value = employee.gross || 0; // Brüt maaş
        row.getCell(7).value = incomeTax; // Gəlir vergisi
        row.getCell(8).value = socialPayment; // Sosial ödəniş
        row.getCell(9).value = totalTax; // Ümumi vergi
        row.getCell(10).value = employee.Net_salary || 0; // Net maaş
        row.getCell(11).value = employee.salary_status === 'paid' ? 'ÖDƏNİB' : 
                               employee.salary_status === 'pending' ? 'GÖZLƏMƏDƏ' : 'LƏĞV EDİB'; // Status

        // Ümumi məbləğləri topla
        totalGross += employee.gross || 0;
        totalIncomeTax += incomeTax;
        totalSocialPayment += socialPayment;
        totalNet += employee.Net_salary || 0;

      } catch (error) {
        console.error(`Sətir əlavə etmə xətası ${index}:`, error.message);
        // Əsas məlumatları əlavə et
        row.getCell(1).value = index + 1;
        row.getCell(2).value = `${employee.firstName || ''} ${employee.lastName || ''}`;
        row.getCell(3).value = employee.position || '';
        row.getCell(4).value = employee.Department || '';
        row.getCell(5).value = employee.employeeType === 'state' ? 'Dövlət' : 'Özəl';
        row.getCell(6).value = employee.gross || 0;
        row.getCell(7).value = 0;
        row.getCell(8).value = 0;
        row.getCell(9).value = 0;
        row.getCell(10).value = employee.Net_salary || 0;
        row.getCell(11).value = employee.salary_status === 'paid' ? 'ÖDƏNİB' : 
                               employee.salary_status === 'pending' ? 'GÖZLƏMƏDƏ' : 'LƏĞV EDİB';
      }
    });

    // Ümumi cəmlər sətri
    const totalRowIndex = employees.length + 6; // 5-ci sətirdən başlayıb + header + boş sətir
    const totalRow = summarySheet.getRow(totalRowIndex);
    
    totalRow.getCell(1).value = 'ÜMUMİ CƏM';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };

    totalRow.getCell(6).value = totalGross;
    totalRow.getCell(7).value = totalIncomeTax;
    totalRow.getCell(8).value = totalSocialPayment;
    totalRow.getCell(9).value = totalIncomeTax + totalSocialPayment;
    totalRow.getCell(10).value = totalNet;

    // Formatlama - ümumi cəmlər sətirini formatla
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F2F2F2' }
    };

    // Rəqəm formatı
    for (let col = 6; col <= 10; col++) {
      summarySheet.getColumn(col).numFmt = '#,##0.00';
      summarySheet.getColumn(col).alignment = { horizontal: 'right' };
    }

    // ===================== VƏRƏQ 2: VERGİ BÖLGÜSÜ =====================
    console.log('📄 Vərəq 2 yaradılır: Tax Breakdown...');
    
    const taxSheet = workbook.addWorksheet('Vergi Bölgüsü');
    
    // Başlıq
    taxSheet.mergeCells('A1:H1');
    taxSheet.getCell('A1').value = 'VERGİ BÖLGÜSÜ DƏTALLARI';
    taxSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    taxSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    taxSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C00000' }
    };
    
    taxSheet.mergeCells('A2:H2');
    taxSheet.getCell('A2').value = `Dövr: ${targetMonth}/${targetYear}`;
    taxSheet.getCell('A2').font = { bold: true };
    taxSheet.getCell('A2').alignment = { horizontal: 'center' };

    // Boş sətir
    taxSheet.getRow(3).height = 5;

    // Sütun başlıqları (4-cü sətirdən başlayır)
    const taxHeaders = [
      'VERGİ NÖVÜ', 'FAİZ', 'İŞÇİ PAYI (AZN)', 'İŞÇİ PAYI (%)', 
      'İŞƏGÖTÜRƏN PAYI (AZN)', 'İŞƏGÖTÜRƏN PAYI (%)', 'ÜMUMİ VERGİ (AZN)', 'AÇIQLAMA'
    ];

    const taxHeaderRow = taxSheet.getRow(4);
    taxHeaders.forEach((header, index) => {
      const cell = taxHeaderRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E0E0' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Sütun enləri
    taxSheet.columns = [
      { width: 35 },
      { width: 10 },
      { width: 18 },
      { width: 15 },
      { width: 20 },
      { width: 18 },
      { width: 18 },
      { width: 30 }
    ];

    // Vergi məlumatları (5-ci sətirdən başlayır)
    const taxData = [
      {
        taxType: 'GƏLİR VERGİSİ',
        rate: '14%',
        employeeShare: totalIncomeTax,
        employeePercentage: totalEmployeeTaxes > 0 ? ((totalIncomeTax / totalEmployeeTaxes) * 100).toFixed(2) + '%' : '0%',
        employerShare: 0,
        employerPercentage: '0%',
        totalTax: totalIncomeTax,
        description: '8000 AZN-dək gəlir üçün'
      },
      {
        taxType: 'DÖVLƏT SOSİAL MÜDAFİƏ FONDU (DSMF)',
        rate: 'İşçi: 3%\nİşəgötürən: 22%',
        employeeShare: totalDsmfEmployee,
        employeePercentage: totalEmployeeTaxes > 0 ? ((totalDsmfEmployee / totalEmployeeTaxes) * 100).toFixed(2) + '%' : '0%',
        employerShare: totalDsmfEmployer,
        employerPercentage: totalEmployerTaxes > 0 ? ((totalDsmfEmployer / totalEmployerTaxes) * 100).toFixed(2) + '%' : '0%',
        totalTax: totalDsmfEmployee + totalDsmfEmployer,
        description: 'Sosial sığorta'
      },
      {
        taxType: 'İCBARİ TİBBİ SİĞORTA (İTS)',
        rate: '2%',
        employeeShare: totalItsEmployee,
        employeePercentage: totalEmployeeTaxes > 0 ? ((totalItsEmployee / totalEmployeeTaxes) * 100).toFixed(2) + '%' : '0%',
        employerShare: totalItsEmployer,
        employerPercentage: totalEmployerTaxes > 0 ? ((totalItsEmployer / totalEmployerTaxes) * 100).toFixed(2) + '%' : '0%',
        totalTax: totalItsEmployee + totalItsEmployer,
        description: 'Hər ikisi üçün'
      },
      {
        taxType: 'İŞSİZLİKDƏN SİĞORTA (İŞS)',
        rate: '0.5%',
        employeeShare: totalIshEmployee,
        employeePercentage: totalEmployeeTaxes > 0 ? ((totalIshEmployee / totalEmployeeTaxes) * 100).toFixed(2) + '%' : '0%',
        employerShare: totalIshEmployer,
        employerPercentage: totalEmployerTaxes > 0 ? ((totalIshEmployer / totalEmployerTaxes) * 100).toFixed(2) + '%' : '0%',
        totalTax: totalIshEmployee + totalIshEmployer,
        description: 'Hər ikisi üçün'
      }
    ];

    // Əgər GV vergisi varsa
    if (totalGvTax > 0) {
      taxData.push({
        taxType: 'ƏLAVƏ GƏLİR VERGİSİ (GV)',
        rate: '14%',
        employeeShare: totalGvTax,
        employeePercentage: totalEmployeeTaxes > 0 ? ((totalGvTax / totalEmployeeTaxes) * 100).toFixed(2) + '%' : '0%',
        employerShare: 0,
        employerPercentage: '0%',
        totalTax: totalGvTax,
        description: '8000 AZN-dən yuxarı gəlir üçün'
      });
    }

    // Vergi məlumatlarını əlavə et
    taxData.forEach((tax, index) => {
      const rowNumber = index + 5;
      const row = taxSheet.getRow(rowNumber);
      
      row.getCell(1).value = tax.taxType;
      row.getCell(2).value = tax.rate;
      row.getCell(3).value = tax.employeeShare;
      row.getCell(4).value = tax.employeePercentage;
      row.getCell(5).value = tax.employerShare;
      row.getCell(6).value = tax.employerPercentage;
      row.getCell(7).value = tax.totalTax;
      row.getCell(8).value = tax.description;
    });

    // Ümumi sətirlər
    const taxTotalStartRow = taxData.length + 6;
    
    // İşçi ümumi vergisi
    taxSheet.getCell(`A${taxTotalStartRow}`).value = 'İŞÇİ ÜMUMİ VERGİSİ';
    taxSheet.getCell(`A${taxTotalStartRow}`).font = { bold: true };
    taxSheet.getCell(`C${taxTotalStartRow}`).value = totalEmployeeTaxes;
    taxSheet.getCell(`G${taxTotalStartRow}`).value = totalEmployeeTaxes;
    
    // İşəgötürən ümumi vergisi
    taxSheet.getCell(`A${taxTotalStartRow + 1}`).value = 'İŞƏGÖTÜRƏN ÜMUMİ VERGİSİ';
    taxSheet.getCell(`A${taxTotalStartRow + 1}`).font = { bold: true };
    taxSheet.getCell(`E${taxTotalStartRow + 1}`).value = totalEmployerTaxes;
    taxSheet.getCell(`G${taxTotalStartRow + 1}`).value = totalEmployerTaxes;
    
    // Ümumi vergi
    taxSheet.getCell(`A${taxTotalStartRow + 2}`).value = 'ÜMUMİ VERGİ';
    taxSheet.getCell(`A${taxTotalStartRow + 2}`).font = { bold: true, color: { argb: 'C00000' } };
    taxSheet.getCell(`G${taxTotalStartRow + 2}`).value = totalAllTaxes;
    taxSheet.getCell(`G${taxTotalStartRow + 2}`).font = { bold: true, color: { argb: 'C00000' } };

    // Rəqəm formatı
    for (let col = 3; col <= 7; col++) {
      if (col !== 4 && col !== 6) { // Faiz sütunları deyil
        taxSheet.getColumn(col).numFmt = '#,##0.00';
        taxSheet.getColumn(col).alignment = { horizontal: 'right' };
      }
    }

    // ===================== VƏRƏQ 3: ŞİRKƏT STATİSTİKASI =====================
    console.log('📄 Vərəq 3 yaradılır: Company Statistics...');
    
    const statsSheet = workbook.addWorksheet('Şirkət Statistikası');
    
    // Başlıq
    statsSheet.mergeCells('A1:D1');
    statsSheet.getCell('A1').value = 'ŞİRKƏT MƏLUMATLARI VƏ STATİSTİKA';
    statsSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    statsSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '00B050' }
    };
    
    statsSheet.getCell('A2').value = 'Dövr:';
    statsSheet.getCell('B2').value = `${targetMonth}/${targetYear}`;
    statsSheet.getCell('A3').value = 'Tarix:';
    statsSheet.getCell('B3').value = new Date().toLocaleDateString('az-AZ');
    statsSheet.getCell('A4').value = 'Hesabat növü:';
    statsSheet.getCell('B4').value = 'Payroll Kompleks Hesabatı';
    
    statsSheet.getCell('A2').font = { bold: true };
    statsSheet.getCell('A3').font = { bold: true };
    statsSheet.getCell('A4').font = { bold: true };

    // Əsas statistikalar
    const averageGross = employees.length > 0 ? totalGross / employees.length : 0;
    const averageNet = employees.length > 0 ? totalNet / employees.length : 0;
    const maxGross = employees.length > 0 ? Math.max(...employees.map(e => e.gross || 0)) : 0;
    const minGross = employees.length > 0 ? Math.min(...employees.filter(e => (e.gross || 0) > 0).map(e => e.gross || 0)) : 0;
    
    const statsData = [
      ['', 'DƏYƏR', 'AÇIQLAMA'],
      ['ÜMUMİ MƏLUMATLAR', '', ''],
      ['Ümumi işçi sayı', employees.length, 'Aktiv işçilər'],
      ['Dövlət işçisi', employees.filter(e => e.employeeType === 'state').length, ''],
      ['Özəl sektor işçisi', employees.filter(e => e.employeeType === 'private').length, ''],
      ['Maaşı ödənilib', employees.filter(e => e.salary_status === 'paid').length, ''],
      ['Maaşı gözləmədə', employees.filter(e => e.salary_status === 'pending').length, ''],
      ['', '', ''],
      ['MAAŞ STATİSTİKASI (AZN)', '', ''],
      ['Ümumi brüt maaş', totalGross, ''],
      ['Ümumi net maaş', totalNet, ''],
      ['Orta brüt maaş', averageGross.toFixed(2), ''],
      ['Orta net maaş', averageNet.toFixed(2), ''],
      ['Ən yüksək maaş', maxGross, ''],
      ['Ən aşağı maaş', minGross, ''],
      ['', '', ''],
      ['VERGİ STATİSTİKASI (AZN)', '', ''],
      ['Ümumi işçi vergisi', totalEmployeeTaxes.toFixed(2), ''],
      ['Ümumi işəgötürən vergisi', totalEmployerTaxes.toFixed(2), ''],
      ['Ümumi vergi', totalAllTaxes.toFixed(2), ''],
      ['Vergi/Ümumi maaş nisbəti', totalGross > 0 ? ((totalAllTaxes / totalGross) * 100).toFixed(2) + '%' : '0%', ''],
      ['', '', ''],
      ['ŞİRKƏT XƏRCLƏRİ (AZN)', '', ''],
      ['Ümumi şirkət xərci', (totalGross + totalEmployerTaxes).toFixed(2), 'Brüt maaş + işəgötürən vergisi'],
      ['Əməkhaqqı xərcləri', totalGross.toFixed(2), ''],
      ['Sosial vergi xərcləri', totalEmployerTaxes.toFixed(2), ''],
      ['Əməkhaqqı payı', totalGross + totalEmployerTaxes > 0 ? ((totalGross / (totalGross + totalEmployerTaxes)) * 100).toFixed(2) + '%' : '0%', ''],
      ['Vergi payı', totalGross + totalEmployerTaxes > 0 ? ((totalEmployerTaxes / (totalGross + totalEmployerTaxes)) * 100).toFixed(2) + '%' : '0%', '']
    ];

    let currentRow = 6;
    statsData.forEach(row => {
      statsSheet.getCell(`A${currentRow}`).value = row[0];
      statsSheet.getCell(`B${currentRow}`).value = row[1];
      statsSheet.getCell(`C${currentRow}`).value = row[2];
      
      if (row[0] === 'ÜMUMİ MƏLUMATLAR' || row[0] === 'MAAŞ STATİSTİKASI (AZN)' || 
          row[0] === 'VERGİ STATİSTİKASI (AZN)' || row[0] === 'ŞİRKƏT XƏRCLƏRİ (AZN)') {
        statsSheet.getCell(`A${currentRow}`).font = { bold: true };
        statsSheet.getRow(currentRow).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }
      
      currentRow++;
    });

    // Sütun enləri
    statsSheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 40 }
    ];

    // ===================== QEYDLƏR VƏ XÜLASƏ =====================
    console.log('📄 Vərəq 4 yaradılır: Notes and Summary...');
    
    const notesSheet = workbook.addWorksheet('Qeydlər & Xülasə');
    
    // Başlıq
    notesSheet.mergeCells('A1:C1');
    notesSheet.getCell('A1').value = 'HESABAT XÜLASƏSİ VƏ QEYDLƏR';
    notesSheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    notesSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    notesSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7030A0' }
    };

    // Hesabat xülasəsi
    notesSheet.getCell('A3').value = 'HESABAT XÜLASƏSİ';
    notesSheet.getCell('A3').font = { bold: true, size: 14 };
    
    const summaryNotes = [
      ['Dövr:', `${targetMonth}/${targetYear}`],
      ['Hesabat tarixi:', new Date().toLocaleDateString('az-AZ')],
      ['Ümumi işçi sayı:', employees.length],
      ['Aktiv işçi sayı:', employees.filter(e => e.status === 'active').length],
      ['Ümumi brüt maaş (AZN):', totalGross.toFixed(2)],
      ['Ümumi net maaş (AZN):', totalNet.toFixed(2)],
      ['Ümumi vergi (AZN):', totalAllTaxes.toFixed(2)],
      ['Ümumi şirkət xərci (AZN):', (totalGross + totalEmployerTaxes).toFixed(2)],
      ['Orta brüt maaş (AZN):', averageGross.toFixed(2)],
      ['Orta net maaş (AZN):', averageNet.toFixed(2)],
      ['Vergi yükü (%):', totalGross > 0 ? ((totalAllTaxes / totalGross) * 100).toFixed(2) + '%' : '0%']
    ];

    let notesRow = 5;
    summaryNotes.forEach(note => {
      notesSheet.getCell(`A${notesRow}`).value = note[0];
      notesSheet.getCell(`B${notesRow}`).value = note[1];
      notesSheet.getCell(`A${notesRow}`).font = { bold: true };
      notesRow++;
    });

    // Qeydlər bölməsi
    notesRow += 2;
    notesSheet.getCell(`A${notesRow}`).value = 'QEYDLƏR';
    notesSheet.getCell(`A${notesRow}`).font = { bold: true, size: 14 };
    notesRow++;

    const generalNotes = [
      '1. Bu hesabat yalnız məlumat məqsədlidir.',
      '2. Bütün məbləğlər AZN ilə göstərilmişdir.',
      '3. Vergi hesablamaları cari qanunvericiliyə uyğun aparılmışdır.',
      '4. Maaş statusu:',
      '   - ÖDƏNİB: Maaş ödənilib',
      '   - GÖZLƏMƏDƏ: Maaş ödənilməyib',
      '   - LƏĞV EDİB: Maaş ləğv edilib',
      '5. Vergi nisbətləri:',
      '   - Gəlir vergisi: 14%',
      '   - DSMF (işçi): 3%',
      '   - DSMF (işəgötürən): 22%',
      '   - İTS: 2%',
      '   - İŞS: 0.5%',
      '6. Əlavə GV vergisi 8000 AZN-dən yuxarı maaşlar üçün tətbiq olunur.'
    ];

    generalNotes.forEach(note => {
      notesSheet.getCell(`A${notesRow}`).value = note;
      notesRow++;
    });

    // Məlumatlandırma
    notesRow += 2;
    notesSheet.getCell(`A${notesRow}`).value = 'MƏLUMATLANDIRMA';
    notesSheet.getCell(`A${notesRow}`).font = { bold: true, size: 14 };
    notesRow++;

    const infoNotes = [
      'Hesabatı hazırlayan: Nummix HR System',
      'Hazırlanma tarixi: ' + new Date().toLocaleDateString('az-AZ'),
      'Versiya: 1.0',
      '© ' + new Date().getFullYear() + ' Nummix HR System. Bütün hüquqlar qorunur.'
    ];

    infoNotes.forEach(note => {
      notesSheet.getCell(`A${notesRow}`).value = note;
      notesSheet.getCell(`A${notesRow}`).font = { italic: true };
      notesRow++;
    });

    // Sütun enləri
    notesSheet.columns = [
      { width: 30 },
      { width: 25 },
      { width: 50 }
    ];

    // ===================== FAYL ADI VƏ GÖNDƏRİLMƏSİ =====================
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `payroll_kompleks_${targetMonth}_${targetYear}_${timestamp}.xlsx`;

    // Buffer yarat
    const buffer = await workbook.xlsx.writeBuffer();

    console.log(`✅ Kompleks Excel faylı yaradıldı: ${filename}`);
    console.log(`📊 Vərəqlər: ${workbook.worksheets.length}`);
    console.log(`👥 İşçilər: ${employees.length}`);

    // Header-ları təyin et
    res.setHeader('Content-Type', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Buffer göndər
    res.send(buffer);

  } catch (error) {
    console.error('❌ Kompleks Excel export xətası:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Kompleks Excel faylı yaradılarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Default export


// Hamısı bir faylda export funksiyaları

// Fərdi vergi hesablaması
export const calculateTaxes = async (req, res) => {
  try {
    const { salary, employeeType } = req.body;

    if (!salary || salary < 400) {
      return res.status(400).json({
        success: false,
        error: 'Əməkhaqqı 400 AZN-dən aşağı ola bilməz'
      });
    }

    if (!employeeType || !['state', 'private'].includes(employeeType)) {
      return res.status(400).json({
        success: false,
        error: 'İşçi növü düzgün deyil. "state" və ya "private" olmalıdır'
      });
    }

    const result = taxCalculationService.calculateAllTaxes(salary, employeeType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Hesablama nümunələri
export const getCalculationExamples = async (req, res) => {
  try {
    const examples = taxCalculationService.getCalculationExamples();
    
    res.json({
      success: true,
      data: examples
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Toplu vergi hesablaması
export const calculateBulkTaxes = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        error: 'Employees array göndərilməlidir'
      });
    }

    const results = employees.map(emp => {
      try {
        return {
          employee: emp,
          calculation: taxCalculationService.calculateAllTaxes(emp.salary, emp.employeeType)
        };
      } catch (error) {
        return {
          employee: emp,
          error: error.message
        };
      }
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ ŞİRKƏT ÜMUMİ MƏLUMATLARI
export const getCompanyPayrollSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    // Tarix filteri
    const targetDate = new Date(year || new Date().getFullYear(), 
                               (month || new Date().getMonth() + 1) - 1, 1);
    const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

    // Şirkətin bütün işçilərini götür
    const employees = await Employee.find({ companyId: userId })
      .select('firstName lastName gross Net_salary tax social_pay salary_status employeeType position')
      .lean();

    // Ümumi məbləğləri hesabla
    let totalGross = 0;
    let totalNet = 0;
    let totalTax = 0;
    let totalSocialPay = 0;
    let totalBonus = 0;

    // Bonusları tap (paymentHistory-dən)
    const employeesWithBonus = await Promise.all(
      employees.map(async (emp) => {
        const employee = await Employee.findById(emp._id)
          .select('paymentHistory')
          .lean();
        
        let bonus = 0;
        if (employee.paymentHistory) {
          bonus = employee.paymentHistory
            .filter(payment => 
              payment.paymentType === 'bonus' && 
              payment.forMonth >= targetDate && 
              payment.forMonth < nextMonth
            )
            .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        }

        totalGross += emp.gross || 0;
        totalNet += emp.Net_salary || 0;
        totalTax += emp.tax || 0;
        totalSocialPay += emp.social_pay || 0;
        totalBonus += bonus;

        return {
          ...emp,
          bonus: bonus
        };
      })
    );

    // İşçilər siyahısını hazırla
    const employeeList = employeesWithBonus.map(emp => ({
      id: emp._id,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      basicSalary: (emp.gross || 0) - (emp.bonus || 0),
      bonus: emp.bonus || 0,
      gross: emp.gross || 0,
      net: emp.Net_salary || 0,
      status: emp.salary_status || 'pending'
    }));

    res.json({
      success: true,
      data: {
        period: {
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear(),
          name: targetDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        summary: {
          totalEmployees: employees.length,
          totalGrossSalary: totalGross,
          totalNetSalary: totalNet,
          totalTax: totalTax,
          totalSocialPay: totalSocialPay,
          totalBonus: totalBonus,
          totalCompanyCost: totalGross + (totalTax + totalSocialPay), // Şirkət ümumi xərci
          averageSalary: employees.length > 0 ? Math.round(totalGross / employees.length) : 0,
          averageNetSalary: employees.length > 0 ? Math.round(totalNet / employees.length) : 0
        },
        employees: employeeList
      }
    });

  } catch (error) {
    console.error('Company payroll summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ VERGİ AYRINTILARI
export const getTaxBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    // Tarix filteri
    const targetDate = new Date(year || new Date().getFullYear(), 
                               (month || new Date().getMonth() + 1) - 1, 1);

    // Şirkətin bütün işçilərini götür
    const employees = await Employee.find({ companyId: userId })
      .select('gross employeeType')
      .lean();

    // Vergi bölgüsünü hesabla
    let totalIncomeTax = 0;
    let totalDsmfEmployee = 0;
    let totalItsEmployee = 0;
    let totalIshEmployee = 0;
    let totalGvTax = 0;
    
    // İşəgötürən vergiləri
    let totalDsmfEmployer = 0;
    let totalItsEmployer = 0;
    let totalIshEmployer = 0;

    // Hər bir işçi üçün vergiləri hesabla
    employees.forEach(emp => {
      const taxResult = taxCalculationService.calculateAllTaxes(
        emp.gross || 0, 
        emp.employeeType || 'private'
      );

      // İşçi vergiləri
      totalIncomeTax += taxResult.employee.taxes.incomeTax || 0;
      totalDsmfEmployee += taxResult.employee.taxes.dsmf || 0;
      totalItsEmployee += taxResult.employee.taxes.its || 0;
      totalIshEmployee += taxResult.employee.taxes.ish || 0;
      totalGvTax += taxResult.employee.taxes.gvTax || 0;

      // İşəgötürən vergiləri
      totalDsmfEmployer += taxResult.employer.taxes.dsmf || 0;
      totalItsEmployer += taxResult.employer.taxes.its || 0;
      totalIshEmployer += taxResult.employer.taxes.ish || 0;
    });

    const totalEmployeeTaxes = totalIncomeTax + totalDsmfEmployee + 
                              totalItsEmployee + totalIshEmployee + totalGvTax;
    const totalEmployerTaxes = totalDsmfEmployer + totalItsEmployer + totalIshEmployer;
    const totalAllTaxes = totalEmployeeTaxes + totalEmployerTaxes;

    res.json({
      success: true,
      data: {
        period: {
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear(),
          name: targetDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        taxBreakdown: {
          // İŞÇİ VERGİLƏRİ
          employeeTaxes: {
            incomeTax: {
              amount: totalIncomeTax,
              percentage: totalEmployeeTaxes > 0 ? (totalIncomeTax / totalEmployeeTaxes * 100).toFixed(2) : 0,
              description: 'Gəlir vergisi (14%)'
            },
            dsmf: {
              amount: totalDsmfEmployee,
              percentage: totalEmployeeTaxes > 0 ? (totalDsmfEmployee / totalEmployeeTaxes * 100).toFixed(2) : 0,
              description: 'Dövlət Sosial Müdafiə Fondu (3%)'
            },
            its: {
              amount: totalItsEmployee,
              percentage: totalEmployeeTaxes > 0 ? (totalItsEmployee / totalEmployeeTaxes * 100).toFixed(2) : 0,
              description: 'İcbari Tibbi Sığorta (2%)'
            },
            ish: {
              amount: totalIshEmployee,
              percentage: totalEmployeeTaxes > 0 ? (totalIshEmployee / totalEmployeeTaxes * 100).toFixed(2) : 0,
              description: 'İşsizlikdən Sığorta (0.5%)'
            },
            gvTax: {
              amount: totalGvTax,
              percentage: totalEmployeeTaxes > 0 ? (totalGvTax / totalEmployeeTaxes * 100).toFixed(2) : 0,
              description: 'Gəlir vergisi (8000+ maaş üçün)'
            },
            total: totalEmployeeTaxes
          },

          // İŞƏGÖTÜRƏN VERGİLƏRİ
          employerTaxes: {
            dsmf: {
              amount: totalDsmfEmployer,
              percentage: totalEmployerTaxes > 0 ? (totalDsmfEmployer / totalEmployerTaxes * 100).toFixed(2) : 0,
              description: 'Dövlət Sosial Müdafiə Fondu (22%)'
            },
            its: {
              amount: totalItsEmployer,
              percentage: totalEmployerTaxes > 0 ? (totalItsEmployer / totalEmployerTaxes * 100).toFixed(2) : 0,
              description: 'İcbari Tibbi Sığorta (2%)'
            },
            ish: {
              amount: totalIshEmployer,
              percentage: totalEmployerTaxes > 0 ? (totalIshEmployer / totalEmployerTaxes * 100).toFixed(2) : 0,
              description: 'İşsizlikdən Sığorta (0.5%)'
            },
            total: totalEmployerTaxes
          },

          // ÜMUMİ VERGİ
          totalTaxes: {
            totalAmount: totalAllTaxes,
            employeeShare: totalEmployeeTaxes,
            employerShare: totalEmployerTaxes,
            employeePercentage: totalAllTaxes > 0 ? (totalEmployeeTaxes / totalAllTaxes * 100).toFixed(2) : 0,
            employerPercentage: totalAllTaxes > 0 ? (totalEmployerTaxes / totalAllTaxes * 100).toFixed(2) : 0
          },

          // TAX PERCENTAGES
          taxPercentages: {
            incomeTaxRate: '14%',
            dsmfEmployeeRate: '3%',
            dsmfEmployerRate: '22%',
            itsRate: '2%',
            ishRate: '0.5%',
            gvTaxThreshold: '8000 AZN'
          }
        }
      }
    });

  } catch (error) {
    console.error('Tax breakdown error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ MÜHASİBAT UÇOTU YAZILIŞLARI
export const createAccountingEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Ay və il tələb olunur'
      });
    }

    const targetDate = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);

    // Şirkətin bütün işçilərini götür
    const employees = await Employee.find({ companyId: userId })
      .select('firstName lastName gross Net_salary tax social_pay employeeType')
      .lean();

    // Mühasibat yazılışları massivi
    const accountingEntries = [];
    const documentNumber = `PR-${month.toString().padStart(2, '0')}-${year}`;

    // Ümumi məbləğləri hesabla
    let totalGross = 0;
    let totalNet = 0;
    let totalEmployeeTax = 0;
    let totalEmployerTax = 0;

    employees.forEach(emp => {
      totalGross += emp.gross || 0;
      totalNet += emp.Net_salary || 0;
      totalEmployeeTax += (emp.tax || 0) + (emp.social_pay || 0);
      
      // İşəgötürən vergilərini hesabla
      const taxResult = taxCalculationService.calculateAllTaxes(
        emp.gross || 0, 
        emp.employeeType || 'private'
      );
      totalEmployerTax += taxResult.employer.taxes.dsmf + 
                         taxResult.employer.taxes.its + 
                         taxResult.employer.taxes.ish;
    });

    // 1. Əməkhaqqı xərcləri (Debet 543)
    accountingEntries.push({
      userId: userId,
      accountCode: '543',
      accountName: 'Əməkhaqqı',
      amount: totalGross,
      type: 'debit',
      description: `${month}/${year} ayı üçün ümumi əməkhaqqı xərcləri`,
      date: targetDate,
      documentNumber: documentNumber,
      status: 'posted',
      relatedTransaction: `payroll-${month}-${year}`
    });

    // 2. İşçilərlə hesablaşmalar (Kredit 531)
    accountingEntries.push({
      userId: userId,
      accountCode: '531',
      accountName: 'İşçilərlə hesablaşmalar',
      amount: totalNet,
      type: 'credit',
      description: `${month}/${year} ayı üçün işçilərə ödəniləcək xalis əməkhaqqı`,
      date: targetDate,
      documentNumber: documentNumber,
      status: 'posted',
      relatedTransaction: `payroll-${month}-${year}`
    });

    // 3. Vergi ödənişləri (Kredit 533)
    if (totalEmployeeTax > 0) {
      accountingEntries.push({
        userId: userId,
        accountCode: '533',
        accountName: 'Vergi ödənişləri',
        amount: totalEmployeeTax,
        type: 'credit',
        description: `${month}/${year} ayı işçi vergiləri`,
        date: targetDate,
        documentNumber: documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      });
    }

    // 4. Sosial sığorta ödənişləri (Kredit 535)
    if (totalEmployerTax > 0) {
      accountingEntries.push({
        userId: userId,
        accountCode: '535',
        accountName: 'Sosial sığorta ödənişləri',
        amount: totalEmployerTax,
        type: 'credit',
        description: `${month}/${year} ayı işəgötürən sosial sığorta ödənişləri`,
        date: targetDate,
        documentNumber: documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      });
    }

    // Yazılışları yadda saxla
    const createdEntries = await AccountingEntry.insertMany(accountingEntries);

    res.json({
      success: true,
      data: {
        message: `${createdEntries.length} mühasibat yazılışı yaradıldı`,
        period: {
          month,
          year,
          name: targetDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        entries: createdEntries.map(entry => ({
          id: entry._id,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          amount: entry.amount,
          type: entry.type,
          description: entry.description,
          documentNumber: entry.documentNumber
        })),
        summary: {
          totalGross,
          totalNet,
          totalEmployeeTax,
          totalEmployerTax,
          totalCompanyCost: totalGross + totalEmployerTax
        }
      }
    });

  } catch (error) {
    console.error('Create accounting entries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ✅ MÜHASİBAT UÇOTU YAZILIŞLARI SİYAHISI
export const getAccountingEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year, accountCode } = req.query;

    let filter = { userId: userId };
    
    // Tarix filteri
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // Hesab kodu filteri
    if (accountCode) {
      filter.accountCode = accountCode;
    }

    const entries = await AccountingEntry.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Statistikalar
    const stats = await AccountingEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            accountCode: "$accountCode",
            type: "$type"
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.accountCode",
          debit: {
            $sum: { $cond: [{ $eq: ["$_id.type", "debit"] }, "$totalAmount", 0] }
          },
          credit: {
            $sum: { $cond: [{ $eq: ["$_id.type", "credit"] }, "$totalAmount", 0] }
          },
          totalEntries: { $sum: "$count" }
        }
      }
    ]);

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
          status: entry.status
        })),
        statistics: stats,
        summary: {
          totalEntries: entries.length,
          totalDebit: stats.reduce((sum, stat) => sum + stat.debit, 0),
          totalCredit: stats.reduce((sum, stat) => sum + stat.credit, 0),
          balance: stats.reduce((sum, stat) => sum + stat.debit - stat.credit, 0)
        }
      }
    });

  } catch (error) {
    console.error('Get accounting entries error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes,
  getCompanyPayrollSummary,
  getTaxBreakdown,
  createAccountingEntries,
  getAccountingEntries
};