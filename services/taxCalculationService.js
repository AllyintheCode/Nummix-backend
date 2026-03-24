class TaxCalculationService {
  
  // ===================== 🏢 ÜMUMİ İŞƏGÖTÜRƏN VERGİLƏRİ (SADƏ VERSİYA) =====================
  calculateEmployerTaxes(salaryFund) {
    // salaryFund-ı number-a çevir
    const fund = Number(salaryFund);
    if (isNaN(fund)) {
      throw new Error('salaryFund etibarlı rəqəm deyil');
    }
    
    const dsmf = fund * 0.22;  // 22%
    const ish = fund * 0.005;  // 0.5%
    
    // İTŞ hesablanması
    let its = fund <= 8000 ? fund * 0.02 : fund * 0.005;

    return {
      employerTaxes: { 
        dsmf: Number(dsmf.toFixed(2)), 
        ish: Number(ish.toFixed(2)), 
        its: Number(its.toFixed(2)) 
      },
      totalEmployerTaxes: Number((dsmf + ish + its).toFixed(2))
    };
  }

  // ===================== 🏛️ DÖVLƏT İŞÇİSİ ÜÇÜN VERGİLƏR =====================
  calculateStateEmployeeTaxes(salary) {
    // salary-ı number-a çevir
    const sal = Number(salary);
    if (isNaN(sal)) {
      throw new Error('Salary etibarlı rəqəm deyil');
    }
    
    if (sal < 400) {
      throw new Error('Dövlət işçisi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    let incomeTax = 0;
    
    // Gəlir vergisi hesablanması (400-2500 arası)
    if (sal <= 2500) {
      incomeTax = (sal - 200) * 0.14;
    } else {
      // 2500-dən yuxarı üçün gəlir vergisi
      incomeTax = (sal - 2500) * 0.25 + 350;
    }

    const dsmf = sal * 0.03;        // 3% DSMF
    const ish = sal * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (sal <= 8000) {
      its = sal * 0.02;             // 2%
    } else {
      its = sal * 0.005;            // 0.5%
    }

    const totalTaxes = incomeTax + dsmf + ish + its;
    const netSalary = sal - totalTaxes;

    return {
      grossSalary: sal,
      taxes: {
        incomeTax: Number(incomeTax.toFixed(2)),
        dsmf: Number(dsmf.toFixed(2)),
        ish: Number(ish.toFixed(2)),
        its: Number(its.toFixed(2))
      },
      totalTaxes: Number(totalTaxes.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2))
    };
  }

  // ===================== 🏛️ DÖVLƏT MÜƏSSİSƏSİ ÜÇÜN VERGİLƏR =====================
  calculateStateEmployerTaxes(salary) {
    // salary-ı number-a çevir
    const sal = Number(salary);
    if (isNaN(sal)) {
      throw new Error('Salary etibarlı rəqəm deyil');
    }
    
    const dsmf = sal * 0.22;        // 22% DSMF
    const ish = sal * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (sal <= 8000) {
      its = sal * 0.02;             // 2%
    } else {
      its = sal * 0.005;            // 0.5%
    }

    const totalEmployerTaxes = dsmf + ish + its;
    const totalLaborCost = sal + totalEmployerTaxes;

    return {
      grossSalary: sal,
      employerTaxes: {
        dsmf: Number(dsmf.toFixed(2)),
        ish: Number(ish.toFixed(2)),
        its: Number(its.toFixed(2))
      },
      totalEmployerTaxes: Number(totalEmployerTaxes.toFixed(2)),
      totalLaborCost: Number(totalLaborCost.toFixed(2))
    };
  }

  // ===================== 🏢 ÖZƏL İŞÇİ ÜÇÜN VERGİLƏR =====================
  calculatePrivateEmployeeTaxes(salary) {
    // salary-ı number-a çevir
    const sal = Number(salary);
    if (isNaN(sal)) {
      throw new Error('Salary etibarlı rəqəm deyil');
    }
    
    if (sal < 400) {
      throw new Error('Özəl işçi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    // DSMF hesablanması (xüsusi formula)
    const dsmf = ((sal - 200) * 0.10) + 6;
    const ish = sal * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (sal <= 8000) {
      its = sal * 0.02;             // 2%
    } else {
      its = sal * 0.005;            // 0.5%
    }

    // Gəlir vergisi
    let incomeTax = 0;
    if (sal <= 2500) {
      incomeTax = (sal - 200) * 0.03;         // (maaş-200) × 3%
    } else if (sal <= 8000) {
      incomeTax = 75 + (sal - 2500) * 0.10;   // 75 + (maaş-2500) × 10%
    } else {
      incomeTax = 625 + (sal - 8000) * 0.14;  // 625 + (maaş-8000) × 14%
    }
    
    // GV vergisi (yalnız 8000+ üçün)
    let gvTax = 0;
    if (sal > 8000) {
      gvTax = (sal - 8000) * 0.14;
    }

    const totalTaxes = dsmf + ish + its + incomeTax + gvTax;
    const netSalary = sal - totalTaxes;

    return {
      grossSalary: sal,
      taxes: {
        dsmf: Number(dsmf.toFixed(2)),
        ish: Number(ish.toFixed(2)),
        its: Number(its.toFixed(2)),
        incomeTax: Number(incomeTax.toFixed(2)),
        gvTax: Number(gvTax.toFixed(2))
      },
      totalTaxes: Number(totalTaxes.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2))
    };
  }

  // ===================== 🏢 ÖZƏL MÜƏSSİSƏ ÜÇÜN VERGİLƏR =====================
  calculatePrivateEmployerTaxes(salary) {
    // salary-ı number-a çevir
    const sal = Number(salary);
    if (isNaN(sal)) {
      throw new Error('Salary etibarlı rəqəm deyil');
    }
    
    // DSMF hesablanması (200 AZN-ə qədər 22%, 200+ üçün 15%)
    let dsmf = 0;
    if (sal <= 200) {
      dsmf = sal * 0.22;            // 22%
    } else {
      dsmf = (200 * 0.22) + ((sal - 200) * 0.15);
    }

    const ish = sal * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (sal <= 8000) {
      its = sal * 0.02;             // 2%
    } else {
      its = sal * 0.005;            // 0.5%
    }

    const totalEmployerTaxes = dsmf + ish + its;
    const totalLaborCost = sal + totalEmployerTaxes;

    return {
      grossSalary: sal,
      employerTaxes: {
        dsmf: Number(dsmf.toFixed(2)),
        ish: Number(ish.toFixed(2)),
        its: Number(its.toFixed(2))
      },
      totalEmployerTaxes: Number(totalEmployerTaxes.toFixed(2)),
      totalLaborCost: Number(totalLaborCost.toFixed(2))
    };
  }

  // ===================== 📊 ÜMUMİ HESABLAMA =====================
  calculateAllTaxes(salary, employeeType = 'private') {
    try {
      // salary-ı number-a çevir
      const sal = Number(salary);
      if (isNaN(sal) || sal <= 0) {
        throw new Error('Salary etibarlı rəqəm deyil');
      }
      
      let employeeTaxes, employerTaxes;

      if (employeeType === 'state') {
        employeeTaxes = this.calculateStateEmployeeTaxes(sal);
        employerTaxes = this.calculateStateEmployerTaxes(sal);
      } else {
        employeeTaxes = this.calculatePrivateEmployeeTaxes(sal);
        employerTaxes = this.calculatePrivateEmployerTaxes(sal);
      }

      return {
        employee: employeeTaxes,
        employer: employerTaxes,
        summary: {
          totalCostForCompany: employerTaxes.totalLaborCost,
          employeeNetSalary: employeeTaxes.netSalary,
          totalTaxesPaid: employeeTaxes.totalTaxes + employerTaxes.totalEmployerTaxes,
          taxBurdenPercentage: ((employeeTaxes.totalTaxes + employerTaxes.totalEmployerTaxes) / sal * 100).toFixed(2)
        }
      };
    } catch (error) {
      throw new Error(`Vergi hesablanması xətası: ${error.message}`);
    }
  }

  // ===================== 📈 NÜMUNƏ HESABLAMALAR =====================
  getCalculationExamples() {
    const examples = [];

    // Dövlət işçisi nümunələri
    [1500, 2500, 3000, 5000, 10000].forEach(salary => {
      examples.push({
        type: 'Dövlət İşçisi',
        salary,
        result: this.calculateStateEmployeeTaxes(salary)
      });
    });

    // Özəl işçi nümunələri
    [1500, 2500, 3000, 5000, 10000].forEach(salary => {
      examples.push({
        type: 'Özəl İşçi',
        salary,
        result: this.calculatePrivateEmployeeTaxes(salary)
      });
    });

    return examples;
  }
}

export default new TaxCalculationService();