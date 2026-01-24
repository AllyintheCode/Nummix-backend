import taxCalculationService from '../services/taxCalculationService.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import AccountingEntry from '../models/AccountingEntry.js';
import mongoose from 'mongoose';

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