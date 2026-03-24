import taxCalculationService from '../services/taxCalculationService.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import AccountingEntry from '../models/AccountingEntry.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

// Yardımçı funksiya: işçilərin vergi məlumatlarını hesablayır və keşləyir
async function calculatePayrollData(employees) {
  const result = {
    employees: [],
    totals: {
      gross: 0,
      net: 0,
      incomeTax: 0,
      dsmfEmployee: 0,
      itsEmployee: 0,
      ishEmployee: 0,
      gvTax: 0,
      dsmfEmployer: 0,
      itsEmployer: 0,
      ishEmployer: 0,
      employeeTaxTotal: 0,
      employerTaxTotal: 0,
      allTaxTotal: 0
    }
  };

  for (const emp of employees) {
    const gross = emp.gross || 0;
    const employeeType = emp.employeeType || 'private';
    
    let taxResult;
    try {
      taxResult = taxCalculationService.calculateAllTaxes(gross, employeeType);
    } catch (error) {
      console.error(`Vergi hesablama xətası: ${emp.firstName} ${emp.lastName}`, error);
      taxResult = {
        employee: { taxes: { incomeTax: 0, dsmf: 0, its: 0, ish: 0, gvTax: 0 } },
        employer: { taxes: { dsmf: 0, its: 0, ish: 0 } }
      };
    }

    const empTaxes = taxResult.employee.taxes;
    const employerTaxes = taxResult.employer.taxes;
    const netSalary = emp.Net_salary || 0;

    const empData = {
      ...emp.toObject ? emp.toObject() : emp,
      taxDetails: {
        incomeTax: empTaxes.incomeTax || 0,
        dsmf: empTaxes.dsmf || 0,
        its: empTaxes.its || 0,
        ish: empTaxes.ish || 0,
        gvTax: empTaxes.gvTax || 0,
        employerDsmf: employerTaxes.dsmf || 0,
        employerIts: employerTaxes.its || 0,
        employerIsh: employerTaxes.ish || 0,
        netSalary
      }
    };
    result.employees.push(empData);

    // Toplamları yenilə
    result.totals.gross += gross;
    result.totals.net += netSalary;
    result.totals.incomeTax += empTaxes.incomeTax || 0;
    result.totals.dsmfEmployee += empTaxes.dsmf || 0;
    result.totals.itsEmployee += empTaxes.its || 0;
    result.totals.ishEmployee += empTaxes.ish || 0;
    result.totals.gvTax += empTaxes.gvTax || 0;
    result.totals.dsmfEmployer += employerTaxes.dsmf || 0;
    result.totals.itsEmployer += employerTaxes.its || 0;
    result.totals.ishEmployer += employerTaxes.ish || 0;
  }

  const t = result.totals;
  t.employeeTaxTotal = t.incomeTax + t.dsmfEmployee + t.itsEmployee + t.ishEmployee + t.gvTax;
  t.employerTaxTotal = t.dsmfEmployer + t.itsEmployer + t.ishEmployer;
  t.allTaxTotal = t.employeeTaxTotal + t.employerTaxTotal;

  return result;
}

// Excel vərəqinə başlıq əlavə etmək üçün yardımçı
function addSheetHeader(sheet, title, subtitle = '', color = '4F81BD') {
  sheet.mergeCells('A1:K1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };

  if (subtitle) {
    sheet.mergeCells('A2:K2');
    const subCell = sheet.getCell('A2');
    subCell.value = subtitle;
    subCell.font = { bold: true, size: 11 };
    subCell.alignment = { horizontal: 'center' };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } };
  }
  sheet.getRow(3).height = 5;
}

// ===================== EXCEL EXPORT =====================
export const exportComprehensivePayrollExcel = async (req, res) => {
  try {
    console.log('📊 Comprehensive Excel export başladı...');
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "İstifadəçi məlumatları tapılmadı" });
    }

    const userId = req.user._id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    const employees = await Employee.find({ 
      companyId: userId,
      status: 'active'
    }).select("firstName lastName gross Net_salary tax social_pay employeeType position Department salary_status").lean();

    console.log(`✅ ${employees.length} işçi tapıldı`);

    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: "Payroll üçün işçi tapılmadı" });
    }

    const payrollData = await calculatePayrollData(employees);
    const totals = payrollData.totals;
    const employeesWithTax = payrollData.employees;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nummix HR System - Comprehensive Payroll Report';
    workbook.created = new Date();

    // Vərəq 1: Payroll Summary
    const summarySheet = workbook.addWorksheet('Payroll Summary');
    addSheetHeader(summarySheet, 'PAYROLL MƏLUMAT CƏDVƏLİ', `Dövr: ${targetMonth}/${targetYear} | Tarix: ${new Date().toLocaleDateString('az-AZ')}`, '4F81BD');

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

    const headerRow = summarySheet.getRow(4);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
      cell.alignment = { horizontal: 'center' };
    });

    employeesWithTax.forEach((emp, index) => {
      const row = summarySheet.getRow(index + 5);
      const empTax = emp.taxDetails;
      const socialPayment = empTax.dsmf + empTax.its + empTax.ish;
      const totalTax = empTax.incomeTax + socialPayment;

      row.getCell(1).value = index + 1;
      row.getCell(2).value = `${emp.firstName || ''} ${emp.lastName || ''}`;
      row.getCell(3).value = emp.position || '';
      row.getCell(4).value = emp.Department || '';
      row.getCell(5).value = emp.employeeType === 'state' ? 'Dövlət' : 'Özəl';
      row.getCell(6).value = emp.gross || 0;
      row.getCell(7).value = empTax.incomeTax;
      row.getCell(8).value = socialPayment;
      row.getCell(9).value = totalTax;
      row.getCell(10).value = empTax.netSalary;
      row.getCell(11).value = emp.salary_status === 'paid' ? 'ÖDƏNİB' : 
                              emp.salary_status === 'pending' ? 'GÖZLƏMƏDƏ' : 'LƏĞV EDİB';
    });

    const totalRowIndex = employees.length + 6;
    const totalRow = summarySheet.getRow(totalRowIndex);
    totalRow.getCell(1).value = 'ÜMUMİ CƏM';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
    totalRow.getCell(6).value = totals.gross;
    totalRow.getCell(7).value = totals.incomeTax;
    totalRow.getCell(8).value = totals.dsmfEmployee + totals.itsEmployee + totals.ishEmployee;
    totalRow.getCell(9).value = totals.incomeTax + totals.dsmfEmployee + totals.itsEmployee + totals.ishEmployee + totals.gvTax;
    totalRow.getCell(10).value = totals.net;

    for (let col = 6; col <= 10; col++) {
      summarySheet.getColumn(col).numFmt = '#,##0.00';
      summarySheet.getColumn(col).alignment = { horizontal: 'right' };
    }

    // Vərəq 2: Vergi Bölgüsü
    const taxSheet = workbook.addWorksheet('Vergi Bölgüsü');
    addSheetHeader(taxSheet, 'VERGİ BÖLGÜSÜ DƏTALLARI', `Dövr: ${targetMonth}/${targetYear}`, 'C00000');

    taxSheet.columns = [
      { width: 35 }, { width: 10 }, { width: 18 }, { width: 15 },
      { width: 20 }, { width: 18 }, { width: 18 }, { width: 30 }
    ];

    const taxHeaders = [
      'VERGİ NÖVÜ', 'FAİZ', 'İŞÇİ PAYI (AZN)', 'İŞÇİ PAYI (%)',
      'İŞƏGÖTÜRƏN PAYI (AZN)', 'İŞƏGÖTÜRƏN PAYI (%)', 'ÜMUMİ VERGİ (AZN)', 'AÇIQLAMA'
    ];
    const taxHeaderRow = taxSheet.getRow(4);
    taxHeaders.forEach((h, idx) => {
      const cell = taxHeaderRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
      cell.alignment = { horizontal: 'center' };
    });

    const t = totals;
    const employeeTaxTotal = t.employeeTaxTotal;
    const employerTaxTotal = t.employerTaxTotal;

    const taxData = [
      {
        name: 'GƏLİR VERGİSİ',
        rate: '14%',
        empShare: t.incomeTax,
        empPerc: employeeTaxTotal ? ((t.incomeTax / employeeTaxTotal) * 100).toFixed(2) + '%' : '0%',
        employerShare: 0,
        employerPerc: '0%',
        total: t.incomeTax,
        desc: '8000 AZN-dək gəlir üçün'
      },
      {
        name: 'DÖVLƏT SOSİAL MÜDAFİƏ FONDU (DSMF)',
        rate: 'İşçi: 3%\nİşəgötürən: 22%',
        empShare: t.dsmfEmployee,
        empPerc: employeeTaxTotal ? ((t.dsmfEmployee / employeeTaxTotal) * 100).toFixed(2) + '%' : '0%',
        employerShare: t.dsmfEmployer,
        employerPerc: employerTaxTotal ? ((t.dsmfEmployer / employerTaxTotal) * 100).toFixed(2) + '%' : '0%',
        total: t.dsmfEmployee + t.dsmfEmployer,
        desc: 'Sosial sığorta'
      },
      {
        name: 'İCBARİ TİBBİ SİĞORTA (İTS)',
        rate: '2%',
        empShare: t.itsEmployee,
        empPerc: employeeTaxTotal ? ((t.itsEmployee / employeeTaxTotal) * 100).toFixed(2) + '%' : '0%',
        employerShare: t.itsEmployer,
        employerPerc: employerTaxTotal ? ((t.itsEmployer / employerTaxTotal) * 100).toFixed(2) + '%' : '0%',
        total: t.itsEmployee + t.itsEmployer,
        desc: 'Hər ikisi üçün'
      },
      {
        name: 'İŞSİZLİKDƏN SİĞORTA (İŞS)',
        rate: '0.5%',
        empShare: t.ishEmployee,
        empPerc: employeeTaxTotal ? ((t.ishEmployee / employeeTaxTotal) * 100).toFixed(2) + '%' : '0%',
        employerShare: t.ishEmployer,
        employerPerc: employerTaxTotal ? ((t.ishEmployer / employerTaxTotal) * 100).toFixed(2) + '%' : '0%',
        total: t.ishEmployee + t.ishEmployer,
        desc: 'Hər ikisi üçün'
      }
    ];
    if (t.gvTax > 0) {
      taxData.push({
        name: 'ƏLAVƏ GƏLİR VERGİSİ (GV)',
        rate: '14%',
        empShare: t.gvTax,
        empPerc: employeeTaxTotal ? ((t.gvTax / employeeTaxTotal) * 100).toFixed(2) + '%' : '0%',
        employerShare: 0,
        employerPerc: '0%',
        total: t.gvTax,
        desc: '8000 AZN-dən yuxarı gəlir üçün'
      });
    }

    taxData.forEach((tax, idx) => {
      const row = taxSheet.getRow(idx + 5);
      row.getCell(1).value = tax.name;
      row.getCell(2).value = tax.rate;
      row.getCell(3).value = tax.empShare;
      row.getCell(4).value = tax.empPerc;
      row.getCell(5).value = tax.employerShare;
      row.getCell(6).value = tax.employerPerc;
      row.getCell(7).value = tax.total;
      row.getCell(8).value = tax.desc;
    });

    const startRow = taxData.length + 6;
    taxSheet.getCell(`A${startRow}`).value = 'İŞÇİ ÜMUMİ VERGİSİ';
    taxSheet.getCell(`A${startRow}`).font = { bold: true };
    taxSheet.getCell(`C${startRow}`).value = employeeTaxTotal;
    taxSheet.getCell(`G${startRow}`).value = employeeTaxTotal;

    taxSheet.getCell(`A${startRow+1}`).value = 'İŞƏGÖTÜRƏN ÜMUMİ VERGİSİ';
    taxSheet.getCell(`A${startRow+1}`).font = { bold: true };
    taxSheet.getCell(`E${startRow+1}`).value = employerTaxTotal;
    taxSheet.getCell(`G${startRow+1}`).value = employerTaxTotal;

    taxSheet.getCell(`A${startRow+2}`).value = 'ÜMUMİ VERGİ';
    taxSheet.getCell(`A${startRow+2}`).font = { bold: true, color: { argb: 'C00000' } };
    taxSheet.getCell(`G${startRow+2}`).value = t.allTaxTotal;
    taxSheet.getCell(`G${startRow+2}`).font = { bold: true, color: { argb: 'C00000' } };

    for (let col of [3,5,7]) {
      taxSheet.getColumn(col).numFmt = '#,##0.00';
    }

    // Vərəq 3: Şirkət Statistikası
    const statsSheet = workbook.addWorksheet('Şirkət Statistikası');
    addSheetHeader(statsSheet, 'ŞİRKƏT MƏLUMATLARI VƏ STATİSTİKA', '', '00B050');

    statsSheet.getCell('A2').value = 'Dövr:';
    statsSheet.getCell('B2').value = `${targetMonth}/${targetYear}`;
    statsSheet.getCell('A3').value = 'Tarix:';
    statsSheet.getCell('B3').value = new Date().toLocaleDateString('az-AZ');
    statsSheet.getCell('A4').value = 'Hesabat növü:';
    statsSheet.getCell('B4').value = 'Payroll Kompleks Hesabatı';
    statsSheet.getCell('A2').font = statsSheet.getCell('A3').font = statsSheet.getCell('A4').font = { bold: true };

    const avgGross = employees.length ? (totals.gross / employees.length) : 0;
    const avgNet = employees.length ? (totals.net / employees.length) : 0;
    const maxGross = employees.length ? Math.max(...employees.map(e => e.gross || 0)) : 0;
    const minGross = employees.length ? Math.min(...employees.filter(e => e.gross > 0).map(e => e.gross || 0)) : 0;
    const stateCount = employees.filter(e => e.employeeType === 'state').length;
    const privateCount = employees.filter(e => e.employeeType === 'private').length;
    const paidCount = employees.filter(e => e.salary_status === 'paid').length;
    const pendingCount = employees.filter(e => e.salary_status === 'pending').length;

    const statsData = [
      ['', 'DƏYƏR', 'AÇIQLAMA'],
      ['ÜMUMİ MƏLUMATLAR', '', ''],
      ['Ümumi işçi sayı', employees.length, 'Aktiv işçilər'],
      ['Dövlət işçisi', stateCount, ''],
      ['Özəl sektor işçisi', privateCount, ''],
      ['Maaşı ödənilib', paidCount, ''],
      ['Maaşı gözləmədə', pendingCount, ''],
      ['', '', ''],
      ['MAAŞ STATİSTİKASI (AZN)', '', ''],
      ['Ümumi brüt maaş', totals.gross.toFixed(2), ''],
      ['Ümumi net maaş', totals.net.toFixed(2), ''],
      ['Orta brüt maaş', avgGross.toFixed(2), ''],
      ['Orta net maaş', avgNet.toFixed(2), ''],
      ['Ən yüksək maaş', maxGross, ''],
      ['Ən aşağı maaş', minGross, ''],
      ['', '', ''],
      ['VERGİ STATİSTİKASI (AZN)', '', ''],
      ['Ümumi işçi vergisi', t.employeeTaxTotal.toFixed(2), ''],
      ['Ümumi işəgötürən vergisi', t.employerTaxTotal.toFixed(2), ''],
      ['Ümumi vergi', t.allTaxTotal.toFixed(2), ''],
      ['Vergi/Ümumi maaş nisbəti', totals.gross ? ((t.allTaxTotal / totals.gross) * 100).toFixed(2) + '%' : '0%', ''],
      ['', '', ''],
      ['ŞİRKƏT XƏRCLƏRİ (AZN)', '', ''],
      ['Ümumi şirkət xərci', (totals.gross + t.employerTaxTotal).toFixed(2), 'Brüt maaş + işəgötürən vergisi'],
      ['Əməkhaqqı xərcləri', totals.gross.toFixed(2), ''],
      ['Sosial vergi xərcləri', t.employerTaxTotal.toFixed(2), ''],
      ['Əməkhaqqı payı', (totals.gross + t.employerTaxTotal) ? ((totals.gross / (totals.gross + t.employerTaxTotal)) * 100).toFixed(2) + '%' : '0%', ''],
      ['Vergi payı', (totals.gross + t.employerTaxTotal) ? ((t.employerTaxTotal / (totals.gross + t.employerTaxTotal)) * 100).toFixed(2) + '%' : '0%', '']
    ];

    let currentRow = 6;
    statsData.forEach(row => {
      statsSheet.getCell(`A${currentRow}`).value = row[0];
      statsSheet.getCell(`B${currentRow}`).value = row[1];
      statsSheet.getCell(`C${currentRow}`).value = row[2];
      if (row[0].includes('ÜMUMİ') || row[0].includes('MAAŞ') || row[0].includes('VERGİ') || row[0].includes('ŞİRKƏT')) {
        statsSheet.getCell(`A${currentRow}`).font = { bold: true };
        statsSheet.getRow(currentRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } };
      }
      currentRow++;
    });

    statsSheet.columns = [{ width: 30 }, { width: 20 }, { width: 40 }];

    // Vərəq 4: Qeydlər & Xülasə
    const notesSheet = workbook.addWorksheet('Qeydlər & Xülasə');
    addSheetHeader(notesSheet, 'HESABAT XÜLASƏSİ VƏ QEYDLƏR', '', '7030A0');

    notesSheet.getCell('A3').value = 'HESABAT XÜLASƏSİ';
    notesSheet.getCell('A3').font = { bold: true, size: 14 };

    const summaryNotes = [
      ['Dövr:', `${targetMonth}/${targetYear}`],
      ['Hesabat tarixi:', new Date().toLocaleDateString('az-AZ')],
      ['Ümumi işçi sayı:', employees.length],
      ['Aktiv işçi sayı:', employees.filter(e => e.status === 'active').length],
      ['Ümumi brüt maaş (AZN):', totals.gross.toFixed(2)],
      ['Ümumi net maaş (AZN):', totals.net.toFixed(2)],
      ['Ümumi vergi (AZN):', t.allTaxTotal.toFixed(2)],
      ['Ümumi şirkət xərci (AZN):', (totals.gross + t.employerTaxTotal).toFixed(2)],
      ['Orta brüt maaş (AZN):', avgGross.toFixed(2)],
      ['Orta net maaş (AZN):', avgNet.toFixed(2)],
      ['Vergi yükü (%):', totals.gross ? ((t.allTaxTotal / totals.gross) * 100).toFixed(2) + '%' : '0%']
    ];

    let notesRow = 5;
    summaryNotes.forEach(note => {
      notesSheet.getCell(`A${notesRow}`).value = note[0];
      notesSheet.getCell(`B${notesRow}`).value = note[1];
      notesSheet.getCell(`A${notesRow}`).font = { bold: true };
      notesRow++;
    });

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

    notesSheet.columns = [{ width: 30 }, { width: 25 }, { width: 50 }];

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `payroll_kompleks_${targetMonth}_${targetYear}_${timestamp}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    console.log(`✅ Kompleks Excel faylı yaradıldı: ${filename}, vərəqlər: ${workbook.worksheets.length}, işçilər: ${employees.length}`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (error) {
    console.error('❌ Kompleks Excel export xətası:', error);
    res.status(500).json({ success: false, message: 'Excel faylı yaradılarkən xəta baş verdi', error: error.message });
  }
};

// ===================== DİGƏR PAYROLL FUNKSİYALARI =====================

export const calculateTaxes = async (req, res) => {
  try {
    const { salary, employeeType } = req.body;

    if (!salary || salary < 400) {
      return res.status(400).json({ success: false, error: 'Əməkhaqqı 400 AZN-dən aşağı ola bilməz' });
    }
    if (!employeeType || !['state', 'private'].includes(employeeType)) {
      return res.status(400).json({ success: false, error: 'İşçi növü düzgün deyil. "state" və ya "private" olmalıdır' });
    }

    const result = taxCalculationService.calculateAllTaxes(salary, employeeType);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCalculationExamples = async (req, res) => {
  try {
    const examples = taxCalculationService.getCalculationExamples();
    res.json({ success: true, data: examples });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const calculateBulkTaxes = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees)) {
      return res.status(400).json({ success: false, error: 'Employees array göndərilməlidir' });
    }

    const results = employees.map(emp => {
      try {
        return {
          employee: emp,
          calculation: taxCalculationService.calculateAllTaxes(emp.salary, emp.employeeType)
        };
      } catch (error) {
        return { employee: emp, error: error.message };
      }
    });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCompanyPayrollSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const targetDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

    const employees = await Employee.find({ companyId: userId })
      .select('firstName lastName gross Net_salary tax social_pay salary_status employeeType position')
      .lean();

    const employeeIds = employees.map(e => e._id);
    const employeesWithBonus = await Employee.find({ _id: { $in: employeeIds } })
      .select('paymentHistory')
      .lean();

    const bonusMap = {};
    employeesWithBonus.forEach(emp => {
      let bonus = 0;
      if (emp.paymentHistory) {
        bonus = emp.paymentHistory
          .filter(p => p.paymentType === 'bonus' && p.forMonth >= targetDate && p.forMonth < nextMonth)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }
      bonusMap[emp._id] = bonus;
    });

    let totalGross = 0, totalNet = 0, totalTax = 0, totalSocialPay = 0, totalBonus = 0;

    const employeeList = employees.map(emp => {
      const gross = emp.gross || 0;
      const net = emp.Net_salary || 0;
      const tax = emp.tax || 0;
      const social = emp.social_pay || 0;
      const bonus = bonusMap[emp._id] || 0;

      totalGross += gross;
      totalNet += net;
      totalTax += tax;
      totalSocialPay += social;
      totalBonus += bonus;

      return {
        id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
        basicSalary: gross - bonus,
        bonus,
        gross,
        net,
        status: emp.salary_status || 'pending'
      };
    });

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
          totalCompanyCost: totalGross + totalTax + totalSocialPay,
          averageSalary: employees.length ? Math.round(totalGross / employees.length) : 0,
          averageNetSalary: employees.length ? Math.round(totalNet / employees.length) : 0
        },
        employees: employeeList
      }
    });
  } catch (error) {
    console.error('Company payroll summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getTaxBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const targetDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);

    const employees = await Employee.find({ companyId: userId })
      .select('gross employeeType')
      .lean();

    console.log(`📊 getTaxBreakdown: ${employees.length} employees found`);

    const totals = {
      incomeTax: 0, dsmfEmployee: 0, itsEmployee: 0, ishEmployee: 0, gvTax: 0,
      dsmfEmployer: 0, itsEmployer: 0, ishEmployer: 0
    };

    employees.forEach(emp => {
      try {
        const gross = emp.gross || 0;
        const empType = emp.employeeType === 'state' ? 'state' : 'private';

        const taxResult = taxCalculationService.calculateAllTaxes(gross, empType);

        // ✅ DÜZƏLİŞ: employee tərəfi
        totals.incomeTax += taxResult.employee.taxes.incomeTax || 0;
        totals.dsmfEmployee += taxResult.employee.taxes.dsmf || 0;
        totals.itsEmployee += taxResult.employee.taxes.its || 0;
        totals.ishEmployee += taxResult.employee.taxes.ish || 0;
        totals.gvTax += taxResult.employee.taxes.gvTax || 0;

        // ✅ DÜZƏLİŞ: employer tərəfi – employerTaxes istifadə edilməlidir
        totals.dsmfEmployer += taxResult.employer.employerTaxes?.dsmf || 0;
        totals.itsEmployer += taxResult.employer.employerTaxes?.its || 0;
        totals.ishEmployer += taxResult.employer.employerTaxes?.ish || 0;
        
      } catch (empError) {
        console.error(`❌ Error processing employee ${emp._id}:`, empError.message);
      }
    });

    const employeeTaxTotal = totals.incomeTax + totals.dsmfEmployee + totals.itsEmployee + totals.ishEmployee + totals.gvTax;
    const employerTaxTotal = totals.dsmfEmployer + totals.itsEmployer + totals.ishEmployer;
    const allTaxTotal = employeeTaxTotal + employerTaxTotal;

    res.json({
      success: true,
      data: {
        period: {
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear(),
          name: targetDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        taxBreakdown: {
          employeeTaxes: {
            incomeTax: { amount: totals.incomeTax, percentage: employeeTaxTotal ? ((totals.incomeTax / employeeTaxTotal) * 100).toFixed(2) : 0, description: 'Gəlir vergisi (14%)' },
            dsmf: { amount: totals.dsmfEmployee, percentage: employeeTaxTotal ? ((totals.dsmfEmployee / employeeTaxTotal) * 100).toFixed(2) : 0, description: 'DSMF (3%)' },
            its: { amount: totals.itsEmployee, percentage: employeeTaxTotal ? ((totals.itsEmployee / employeeTaxTotal) * 100).toFixed(2) : 0, description: 'İTS (2%)' },
            ish: { amount: totals.ishEmployee, percentage: employeeTaxTotal ? ((totals.ishEmployee / employeeTaxTotal) * 100).toFixed(2) : 0, description: 'İŞS (0.5%)' },
            gvTax: { amount: totals.gvTax, percentage: employeeTaxTotal ? ((totals.gvTax / employeeTaxTotal) * 100).toFixed(2) : 0, description: 'Əlavə GV (8000+ üçün)' },
            total: employeeTaxTotal
          },
          employerTaxes: {
            dsmf: { amount: totals.dsmfEmployer, percentage: employerTaxTotal ? ((totals.dsmfEmployer / employerTaxTotal) * 100).toFixed(2) : 0, description: 'DSMF (22%)' },
            its: { amount: totals.itsEmployer, percentage: employerTaxTotal ? ((totals.itsEmployer / employerTaxTotal) * 100).toFixed(2) : 0, description: 'İTS (2%)' },
            ish: { amount: totals.ishEmployer, percentage: employerTaxTotal ? ((totals.ishEmployer / employerTaxTotal) * 100).toFixed(2) : 0, description: 'İŞS (0.5%)' },
            total: employerTaxTotal
          },
          totalTaxes: {
            totalAmount: allTaxTotal,
            employeeShare: employeeTaxTotal,
            employerShare: employerTaxTotal,
            employeePercentage: allTaxTotal ? ((employeeTaxTotal / allTaxTotal) * 100).toFixed(2) : 0,
            employerPercentage: allTaxTotal ? ((employerTaxTotal / allTaxTotal) * 100).toFixed(2) : 0
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Tax breakdown global error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const createAccountingEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'Ay və il tələb olunur' });
    }

    const targetDate = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);

    const employees = await Employee.find({ companyId: userId })
      .select('gross Net_salary tax social_pay employeeType')
      .lean();

    let totalGross = 0, totalNet = 0, totalEmployeeTax = 0, totalEmployerTax = 0;

    employees.forEach(emp => {
      const gross = emp.gross || 0;
      totalGross += gross;
      totalNet += emp.Net_salary || 0;
      totalEmployeeTax += (emp.tax || 0) + (emp.social_pay || 0);

      const taxResult = taxCalculationService.calculateAllTaxes(gross, emp.employeeType || 'private');
      totalEmployerTax += taxResult.employer.taxes.dsmf + taxResult.employer.taxes.its + taxResult.employer.taxes.ish;
    });

    const documentNumber = `PR-${month.toString().padStart(2, '0')}-${year}`;
    const accountingEntries = [
      {
        userId,
        accountCode: '543',
        accountName: 'Əməkhaqqı',
        amount: totalGross,
        type: 'debit',
        description: `${month}/${year} ayı üçün ümumi əməkhaqqı xərcləri`,
        date: targetDate,
        documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      },
      {
        userId,
        accountCode: '531',
        accountName: 'İşçilərlə hesablaşmalar',
        amount: totalNet,
        type: 'credit',
        description: `${month}/${year} ayı üçün işçilərə ödəniləcək xalis əməkhaqqı`,
        date: targetDate,
        documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      }
    ];

    if (totalEmployeeTax > 0) {
      accountingEntries.push({
        userId,
        accountCode: '533',
        accountName: 'Vergi ödənişləri',
        amount: totalEmployeeTax,
        type: 'credit',
        description: `${month}/${year} ayı işçi vergiləri`,
        date: targetDate,
        documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      });
    }

    if (totalEmployerTax > 0) {
      accountingEntries.push({
        userId,
        accountCode: '535',
        accountName: 'Sosial sığorta ödənişləri',
        amount: totalEmployerTax,
        type: 'credit',
        description: `${month}/${year} ayı işəgötürən sosial sığorta ödənişləri`,
        date: targetDate,
        documentNumber,
        status: 'posted',
        relatedTransaction: `payroll-${month}-${year}`
      });
    }

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
        entries: createdEntries.map(e => ({
          id: e._id,
          accountCode: e.accountCode,
          accountName: e.accountName,
          amount: e.amount,
          type: e.type,
          description: e.description,
          documentNumber: e.documentNumber
        })),
        summary: { totalGross, totalNet, totalEmployeeTax, totalEmployerTax, totalCompanyCost: totalGross + totalEmployerTax }
      }
    });
  } catch (error) {
    console.error('Create accounting entries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAccountingEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year, accountCode } = req.query;

    let filter = { userId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (accountCode) filter.accountCode = accountCode;

    const entries = await AccountingEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean();

    const stats = await AccountingEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { accountCode: "$accountCode", type: "$type" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.accountCode",
          debit: { $sum: { $cond: [{ $eq: ["$_id.type", "debit"] }, "$totalAmount", 0] } },
          credit: { $sum: { $cond: [{ $eq: ["$_id.type", "credit"] }, "$totalAmount", 0] } },
          totalEntries: { $sum: "$count" }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        entries: entries.map(e => ({
          id: e._id,
          accountCode: e.accountCode,
          accountName: e.accountName,
          amount: e.amount,
          type: e.type,
          description: e.description,
          date: e.date,
          documentNumber: e.documentNumber,
          status: e.status
        })),
        statistics: stats,
        summary: {
          totalEntries: entries.length,
          totalDebit: stats.reduce((sum, s) => sum + s.debit, 0),
          totalCredit: stats.reduce((sum, s) => sum + s.credit, 0),
          balance: stats.reduce((sum, s) => sum + s.debit - s.credit, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get accounting entries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes,
  getCompanyPayrollSummary,
  getTaxBreakdown,
  createAccountingEntries,
  getAccountingEntries,
  exportComprehensivePayrollExcel
};