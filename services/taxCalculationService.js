class TaxCalculationService {
  
  // Köməkçi funksiya: manatı qəpiyə çevir (tam ədəd)
  _toCents(amount) {
    const num = Number(amount);
    if (isNaN(num)) throw new Error('Etibarlı rəqəm deyil');
    return Math.round(num * 100);
  }

  // Köməkçi funksiya: qəpiyi manata çevir (2 onluq xana)
  _fromCents(cents) {
    return Number((cents / 100).toFixed(2));
  }

  // Faiz hesablanması: məbləğ (qəpik) * faiz / 100, nəticə qəpik (tam ədəd)
  _percentage(cents, percent) {
    return Math.round(cents * percent / 100);
  }

  // ===================== 🏢 ÜMUMİ İŞƏGÖTÜRƏN VERGİLƏRİ (SADƏ VERSİYA) =====================
  calculateEmployerTaxes(salaryFund) {
    const fundCents = this._toCents(salaryFund);
    
    const dsmfCents = this._percentage(fundCents, 22);
    const ishCents = this._percentage(fundCents, 0.5);
    let itsCents;
    if (fundCents <= 8000 * 100) {
      itsCents = this._percentage(fundCents, 2);
    } else {
      itsCents = this._percentage(fundCents, 0.5);
    }

    const totalCents = dsmfCents + ishCents + itsCents;

    return {
      employerTaxes: { 
        dsmf: this._fromCents(dsmfCents), 
        ish: this._fromCents(ishCents), 
        its: this._fromCents(itsCents) 
      },
      totalEmployerTaxes: this._fromCents(totalCents)
    };
  }

  // ===================== 🏛️ DÖVLƏT İŞÇİSİ ÜÇÜN VERGİLƏR =====================
  calculateStateEmployeeTaxes(salary) {
    const salCents = this._toCents(salary);
    const salManat = salCents / 100;
    
    if (salManat < 400) {
      throw new Error('Dövlət işçisi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    let incomeTaxCents = 0;
    if (salManat <= 2500) {
      const taxable = salCents - 200 * 100;
      if (taxable > 0) {
        incomeTaxCents = this._percentage(taxable, 14);
      }
    } else {
      const excessCents = salCents - 2500 * 100;
      incomeTaxCents = this._percentage(excessCents, 25) + 350 * 100;
    }

    const dsmfCents = this._percentage(salCents, 3);
    const ishCents = this._percentage(salCents, 0.5);
    
    let itsCents;
    if (salManat <= 8000) {
      itsCents = this._percentage(salCents, 2);
    } else {
      itsCents = this._percentage(salCents, 0.5);
    }

    const totalTaxesCents = incomeTaxCents + dsmfCents + ishCents + itsCents;
    const netSalaryCents = salCents - totalTaxesCents;

    return {
      grossSalary: salManat,
      taxes: {
        incomeTax: this._fromCents(incomeTaxCents),
        dsmf: this._fromCents(dsmfCents),
        ish: this._fromCents(ishCents),
        its: this._fromCents(itsCents)
      },
      totalTaxes: this._fromCents(totalTaxesCents),
      netSalary: this._fromCents(netSalaryCents)
    };
  }

  // ===================== 🏛️ DÖVLƏT MÜƏSSİSƏSİ ÜÇÜN VERGİLƏR =====================
  calculateStateEmployerTaxes(salary) {
    const salCents = this._toCents(salary);
    const salManat = salCents / 100;
    
    const dsmfCents = this._percentage(salCents, 22);
    const ishCents = this._percentage(salCents, 0.5);
    
    let itsCents;
    if (salManat <= 8000) {
      itsCents = this._percentage(salCents, 2);
    } else {
      itsCents = this._percentage(salCents, 0.5);
    }

    const totalCents = dsmfCents + ishCents + itsCents;
    const totalLaborCostCents = salCents + totalCents;

    return {
      grossSalary: salManat,
      employerTaxes: {
        dsmf: this._fromCents(dsmfCents),
        ish: this._fromCents(ishCents),
        its: this._fromCents(itsCents)
      },
      totalEmployerTaxes: this._fromCents(totalCents),
      totalLaborCost: this._fromCents(totalLaborCostCents)
    };
  }

  // ===================== 🏢 ÖZƏL İŞÇİ ÜÇÜN VERGİLƏR =====================
  calculatePrivateEmployeeTaxes(salary) {
    const salCents = this._toCents(salary);
    const salManat = salCents / 100;
    
    if (salManat < 400) {
      throw new Error('Özəl işçi üçün minimum əməkhaqqı 400 AZN olmalıdır');
    }

    // DSMF: (maaş - 200) * 10% + 6, lakin maaş 200-dən az olduqda 6 AZN
    let dsmfCents;
    if (salManat <= 200) {
      dsmfCents = 6 * 100;
    } else {
      dsmfCents = this._percentage(salCents - 200 * 100, 10) + 6 * 100;
    }

    const ishCents = this._percentage(salCents, 0.5);
    
    let itsCents;
    if (salManat <= 8000) {
      itsCents = this._percentage(salCents, 2);
    } else {
      itsCents = this._percentage(salCents, 0.5);
    }

    let incomeTaxCents = 0;
    if (salManat <= 2500) {
      const taxable = salCents - 200 * 100;
      if (taxable > 0) {
        incomeTaxCents = this._percentage(taxable, 3);
      }
    } else if (salManat <= 8000) {
      const excessCents = salCents - 2500 * 100;
      incomeTaxCents = 75 * 100 + this._percentage(excessCents, 10);
    } else {
      const excessCents = salCents - 8000 * 100;
      incomeTaxCents = 625 * 100 + this._percentage(excessCents, 14);
    }
    
    let gvTaxCents = 0;
    if (salManat > 8000) {
      const excessCents = salCents - 8000 * 100;
      gvTaxCents = this._percentage(excessCents, 14);
    }

    const totalTaxesCents = dsmfCents + ishCents + itsCents + incomeTaxCents + gvTaxCents;
    const netSalaryCents = salCents - totalTaxesCents;

    return {
      grossSalary: salManat,
      taxes: {
        dsmf: this._fromCents(dsmfCents),
        ish: this._fromCents(ishCents),
        its: this._fromCents(itsCents),
        incomeTax: this._fromCents(incomeTaxCents),
        gvTax: this._fromCents(gvTaxCents)
      },
      totalTaxes: this._fromCents(totalTaxesCents),
      netSalary: this._fromCents(netSalaryCents)
    };
  }

  // ===================== 🏢 ÖZƏL MÜƏSSİSƏ ÜÇÜN VERGİLƏR =====================
  calculatePrivateEmployerTaxes(salary) {
    const salCents = this._toCents(salary);
    const salManat = salCents / 100;
    
    let dsmfCents;
    if (salManat <= 200) {
      dsmfCents = this._percentage(salCents, 22);
    } else {
      dsmfCents = this._percentage(200 * 100, 22) + this._percentage(salCents - 200 * 100, 15);
    }

    const ishCents = this._percentage(salCents, 0.5);
    
    let itsCents;
    if (salManat <= 8000) {
      itsCents = this._percentage(salCents, 2);
    } else {
      itsCents = this._percentage(salCents, 0.5);
    }

    const totalCents = dsmfCents + ishCents + itsCents;
    const totalLaborCostCents = salCents + totalCents;

    return {
      grossSalary: salManat,
      employerTaxes: {
        dsmf: this._fromCents(dsmfCents),
        ish: this._fromCents(ishCents),
        its: this._fromCents(itsCents)
      },
      totalEmployerTaxes: this._fromCents(totalCents),
      totalLaborCost: this._fromCents(totalLaborCostCents)
    };
  }

  // ===================== 📊 ÜMUMİ HESABLAMA =====================
  calculateAllTaxes(salary, employeeType = 'private') {
    try {
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

      const totalTaxesPaid = employeeTaxes.totalTaxes + employerTaxes.totalEmployerTaxes;
      const taxBurdenPercentage = (totalTaxesPaid / sal * 100).toFixed(2);

      return {
        employee: employeeTaxes,
        employer: employerTaxes,
        summary: {
          totalCostForCompany: employerTaxes.totalLaborCost,
          employeeNetSalary: employeeTaxes.netSalary,
          totalTaxesPaid: totalTaxesPaid,
          taxBurdenPercentage: Number(taxBurdenPercentage)
        }
      };
    } catch (error) {
      throw new Error(`Vergi hesablanması xətası: ${error.message}`);
    }
  }

  // ===================== 📈 NÜMUNƏ HESABLAMALAR =====================
  getCalculationExamples() {
    const examples = [];

    [1500, 2500, 3000, 5000, 10000].forEach(salary => {
      examples.push({
        type: 'Dövlət İşçisi',
        salary,
        result: this.calculateStateEmployeeTaxes(salary)
      });
    });

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