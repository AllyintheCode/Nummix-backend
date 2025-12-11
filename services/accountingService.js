class AccountingService {
  
  // Hesab kodlarına uyğun məlumatlar
  static getAccountInfo(accountCode) {
    const accounts = {
      "543": {
        name: "Alınmış qısamüddətli avanslar",
        name_en: "Short-term advances received",
        type: "passive",
        description: "Göndərilmiş material qiymətliləri və ya yerinə yetirilmiş işlərə görə alınmış avanslar",
        normalBalance: "credit",
        category: "liability"
      },
      "531": {
        name: "Malsatan və podratçılara qısamüddətli kreditor borcları",
        name_en: "Short-term accounts payable to suppliers and contractors", 
        type: "passive",
        description: "Təchiz olunmuş mallara görə malsatanlara və ya xidmətlərin göstərilməsinə görə podratçılara 12 ay ərzində ödənilməli olan məbləğlər",
        normalBalance: "credit",
        category: "liability"
      },
      "533": {
        name: "Əməyin ödənişi üzrə işçi heyətinə olan borclar",
        name_en: "Accounts payable to staff for labor payment",
        type: "passive", 
        description: "Hesablanmış, lakin hələ ödənilməmiş əmək haqqı məbləğləri",
        normalBalance: "credit",
        category: "liability"
      },
      "535": {
        name: "İcarə üzrə qısamüddətli kreditor borcları",
        name_en: "Short-term lease liabilities",
        type: "passive",
        description: "Maliyyə və ya əməliyyat icarəsi nəticəsində yaranan bütün qısamüddətli öhdəliklər",
        normalBalance: "credit", 
        category: "liability"
      }
    };
    
    return accounts[accountCode] || null;
  }

  // Balans hesablaması
  static calculateAccountBalance(entries, accountCode) {
    const accountEntries = entries.filter(entry => 
      entry.accountCode === accountCode && entry.status === 'posted'
    );
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    accountEntries.forEach(entry => {
      if (entry.type === 'debit') {
        totalDebit += entry.amount;
      } else {
        totalCredit += entry.amount;
      }
    });
    
    const balance = totalDebit - totalCredit;
    const accountInfo = this.getAccountInfo(accountCode);
    
    return {
      accountCode,
      accountName: accountInfo?.name || 'Naməlum hesab',
      totalDebit,
      totalCredit,
      balance,
      isDebitBalance: balance > 0,
      isCreditBalance: balance < 0,
      normalBalance: accountInfo?.normalBalance || 'credit'
    };
  }

  // Bütün hesabların balansı
  static calculateAllBalances(entries) {
    const accountCodes = ["543", "531", "533", "535"];
    const balances = {};
    let totalDebit = 0;
    let totalCredit = 0;
    
    accountCodes.forEach(code => {
      const balance = this.calculateAccountBalance(entries, code);
      balances[code] = balance;
      totalDebit += balance.totalDebit;
      totalCredit += balance.totalCredit;
    });
    
    return {
      balances,
      summary: {
        totalDebit,
        totalCredit,
        difference: Math.abs(totalDebit - totalCredit),
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    };
  }

  // Mühasibat yazılışının etibarlılığını yoxlama
  static validateAccountingEntry(entry) {
    const errors = [];
    
    // Hesab kodu etibarlılığı
    if (!this.getAccountInfo(entry.accountCode)) {
      errors.push(`Yanlış hesab kodu: ${entry.accountCode}`);
    }
    
    // Məbləğ kontrolü
    if (!entry.amount || entry.amount <= 0) {
      errors.push('Məbləğ müsbət olmalıdır');
    }
    
    // Sənəd nömrəsi
    if (!entry.documentNumber || entry.documentNumber.trim() === '') {
      errors.push('Sənəd nömrəsi məcburidir');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Nümunə mühasibat yazılışı yaratmaq (sizin verdiyiniz məlumatlarla)
  static createSampleTransaction() {
    const sampleEntries = [
      {
        accountCode: "543",
        accountName: "Alınmış qısamüddətli avanslar",
        amount: 485320,
        type: "debit",
        description: "Əmək haqqı xərcləri üçün alınmış avans",
        documentNumber: `AVS-${Date.now()}`,
        status: "posted"
      },
      {
        accountCode: "531",
        accountName: "Malsatan və podratçılara qısamüddətli kreditor borcları",
        amount: 368843,
        type: "credit", 
        description: "Təchizatçılara olan borc ödənişi",
        documentNumber: `AVS-${Date.now()}`,
        status: "posted"
      },
      {
        accountCode: "533", 
        accountName: "Əməyin ödənişi üzrə işçi heyətinə olan borclar",
        amount: 67945,
        type: "credit",
        description: "İşçilərə əmək haqqı borcları",
        documentNumber: `AVS-${Date.now()}`,
        status: "posted"
      },
      {
        accountCode: "535",
        accountName: "İcarə üzrə qısamüddətli kreditor borcları", 
        amount: 48532,
        type: "credit",
        description: "İcarə öhdəliklərinin ödənilməsi",
        documentNumber: `AVS-${Date.now()}`,
        status: "posted"
      }
    ];
    
    return sampleEntries;
  }

  // Mühasibat hesabatı yaratmaq
  static generateAccountingReport(entries, startDate, endDate) {
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && 
             entryDate <= new Date(endDate) && 
             entry.status === 'posted';
    });
    
    const balances = this.calculateAllBalances(filteredEntries);
    const monthlyBreakdown = this.calculateMonthlyBreakdown(filteredEntries);
    
    return {
      period: {
        startDate,
        endDate
      },
      entries: filteredEntries,
      balances: balances.balances,
      summary: balances.summary,
      monthlyBreakdown,
      entryCount: filteredEntries.length,
      totalAmount: filteredEntries.reduce((sum, entry) => sum + entry.amount, 0)
    };
  }

  // Aylıq bölgü hesablaması
  static calculateMonthlyBreakdown(entries) {
    const months = {};
    
    entries.forEach(entry => {
      const month = new Date(entry.date).toLocaleString('az-AZ', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!months[month]) {
        months[month] = {
          debitTotal: 0,
          creditTotal: 0,
          entryCount: 0
        };
      }
      
      if (entry.type === 'debit') {
        months[month].debitTotal += entry.amount;
      } else {
        months[month].creditTotal += entry.amount;
      }
      
      months[month].entryCount += 1;
    });
    
    return months;
  }
}

export default AccountingService;