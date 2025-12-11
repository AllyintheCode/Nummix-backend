class TaxCalculationService {
  
  // ===================== 🏢 ÜMUMİ İŞƏGÖTÜRƏN VERGİLƏRİ (SADƏ VERSİYA) =====================
  calculateEmployerTaxes(salaryFund) {
    const dsmf = salaryFund * 0.22;  // 22%
    const ish = salaryFund * 0.005;  // 0.5%
    
    // İTŞ hesablanması
    let its = salaryFund <= 8000 ? salaryFund * 0.02 : salaryFund * 0.005;

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
    if (salary < 400) {
      throw new Error('Dövlət işçisi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    let incomeTax = 0;
    
    // Gəlir vergisi hesablanması (400-2500 arası)
    if (salary <= 2500) {
      incomeTax = (salary - 200) * 0.14;
    } else {
      // 2500-dən yuxarı üçün gəlir vergisi
      incomeTax = (salary - 2500) * 0.25 + 350;
    }

    const dsmf = salary * 0.03;        // 3% DSMF
    const ish = salary * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (salary <= 8000) {
      its = salary * 0.02;             // 2%
    } else {
      its = salary * 0.005;            // 0.5%
    }

    const totalTaxes = incomeTax + dsmf + ish + its;
    const netSalary = salary - totalTaxes;

    return {
      grossSalary: salary,
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
    const dsmf = salary * 0.22;        // 22% DSMF
    const ish = salary * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (salary <= 8000) {
      its = salary * 0.02;             // 2%
    } else {
      its = salary * 0.005;            // 0.5%
    }

    const totalEmployerTaxes = dsmf + ish + its;
    const totalLaborCost = salary + totalEmployerTaxes;

    return {
      grossSalary: salary,
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
    if (salary < 400) {
      throw new Error('Özəl işçi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    // DSMF hesablanması (xüsusi formula)
    const dsmf = ((salary - 200) * 0.10) + 6;
    const ish = salary * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (salary <= 8000) {
      its = salary * 0.02;             // 2%
    } else {
      its = salary * 0.005;            // 0.5%
    }

    // Gəlir vergisi (14% bütün əməkhaqqı üzrə)
    const incomeTax = salary * 0.14;

    // GV vergisi (yalnız 8000+ üçün)
    let gvTax = 0;
    if (salary > 8000) {
      gvTax = (salary - 8000) * 0.14;
    }

    const totalTaxes = dsmf + ish + its + incomeTax + gvTax;
    const netSalary = salary - totalTaxes;

    return {
      grossSalary: salary,
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
    // DSMF hesablanması (200 AZN-ə qədər 22%, 200+ üçün 15%)
    let dsmf = 0;
    if (salary <= 200) {
      dsmf = salary * 0.22;            // 22%
    } else {
      dsmf = (200 * 0.22) + ((salary - 200) * 0.15);
    }

    const ish = salary * 0.005;        // 0.5% İŞS
    
    // İTŞ hesablanması
    let its = 0;
    if (salary <= 8000) {
      its = salary * 0.02;             // 2%
    } else {
      its = salary * 0.005;            // 0.5%
    }

    const totalEmployerTaxes = dsmf + ish + its;
    const totalLaborCost = salary + totalEmployerTaxes;

    return {
      grossSalary: salary,
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
      let employeeTaxes, employerTaxes;

      if (employeeType === 'state') {
        employeeTaxes = this.calculateStateEmployeeTaxes(salary);
        employerTaxes = this.calculateStateEmployerTaxes(salary);
      } else {
        employeeTaxes = this.calculatePrivateEmployeeTaxes(salary);
        employerTaxes = this.calculatePrivateEmployerTaxes(salary);
      }

      return {
        employee: employeeTaxes,
        employer: employerTaxes,
        summary: {
          totalCostForCompany: employerTaxes.totalLaborCost,
          employeeNetSalary: employeeTaxes.netSalary,
          totalTaxesPaid: employeeTaxes.totalTaxes + employerTaxes.totalEmployerTaxes,
          taxBurdenPercentage: ((employeeTaxes.totalTaxes + employerTaxes.totalEmployerTaxes) / salary * 100).toFixed(2)
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