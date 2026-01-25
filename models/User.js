import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import taxCalculationService from '../services/taxCalculationService.js'; // ✅ ƏLAVƏ ET

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    companyName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // ===================== 💰 MÜƏSSİSƏ VERGİ MƏLUMATLARI =====================
    // Aylıq ümumi maaş fondu (bütün işçilərin cəmi)
    monthly_total_salary_fund: {
      January: { type: Number, default: 0 },
      February: { type: Number, default: 0 },
      March: { type: Number, default: 0 },
      April: { type: Number, default: 0 },
      May: { type: Number, default: 0 },
      June: { type: Number, default: 0 },
      July: { type: Number, default: 0 },
      August: { type: Number, default: 0 },
      September: { type: Number, default: 0 },
      October: { type: Number, default: 0 },
      November: { type: Number, default: 0 },
      December: { type: Number, default: 0 },
    },
    
    // Şirkət vergiləri (avtomatik hesablanacaq)
    company_taxes: {
      dsmf: {
        January: { type: Number, default: 0 },
        February: { type: Number, default: 0 },
        March: { type: Number, default: 0 },
        April: { type: Number, default: 0 },
        May: { type: Number, default: 0 },
        June: { type: Number, default: 0 },
        July: { type: Number, default: 0 },
        August: { type: Number, default: 0 },
        September: { type: Number, default: 0 },
        October: { type: Number, default: 0 },
        November: { type: Number, default: 0 },
        December: { type: Number, default: 0 },
      },
      ish: {
        January: { type: Number, default: 0 },
        February: { type: Number, default: 0 },
        March: { type: Number, default: 0 },
        April: { type: Number, default: 0 },
        May: { type: Number, default: 0 },
        June: { type: Number, default: 0 },
        July: { type: Number, default: 0 },
        August: { type: Number, default: 0 },
        September: { type: Number, default: 0 },
        October: { type: Number, default: 0 },
        November: { type: Number, default: 0 },
        December: { type: Number, default: 0 },
      },
      its: {
        January: { type: Number, default: 0 },
        February: { type: Number, default: 0 },
        March: { type: Number, default: 0 },
        April: { type: Number, default: 0 },
        May: { type: Number, default: 0 },
        June: { type: Number, default: 0 },
        July: { type: Number, default: 0 },
        August: { type: Number, default: 0 },
        September: { type: Number, default: 0 },
        October: { type: Number, default: 0 },
        November: { type: Number, default: 0 },
        December: { type: Number, default: 0 },
      },
      total_company_taxes: {
        January: { type: Number, default: 0 },
        February: { type: Number, default: 0 },
        March: { type: Number, default: 0 },
        April: { type: Number, default: 0 },
        May: { type: Number, default: 0 },
        June: { type: Number, default: 0 },
        July: { type: Number, default: 0 },
        August: { type: Number, default: 0 },
        September: { type: Number, default: 0 },
        October: { type: Number, default: 0 },
        November: { type: Number, default: 0 },
        December: { type: Number, default: 0 },
      },
    },
    
    // Cari ay ümumi məlumatları
    current_month_total: {
      salary_fund: { type: Number, default: 0 },
      company_taxes: { type: Number, default: 0 },
      employee_count: { type: Number, default: 0 },
      total_cost: { type: Number, default: 0 }, // Maaş + Vergilər
    },
    
    // Digər sahələr...
    monthly_active_employees: {
      January: { type: Number, default: 0 },
      February: { type: Number, default: 0 },
      March: { type: Number, default: 0 },
      April: { type: Number, default: 0 },
      May: { type: Number, default: 0 },
      June: { type: Number, default: 0 },
      July: { type: Number, default: 0 },
      August: { type: Number, default: 0 },
      September: { type: Number, default: 0 },
      October: { type: Number, default: 0 },
      November: { type: Number, default: 0 },
      December: { type: Number, default: 0 },
    },
    
    // Əsas statistika sahələri
    total_employee_count: { type: Number, default: 0 },
    total_monthly_salary: { type: Number, default: 0 },
    total_monthly_taxes: { type: Number, default: 0 },
    
    // OTP və autentifikasiya sahələri
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// ===================== ⚡ MÜƏSSİSƏ VERGİ HESABLAMA MIDDLEWARE =====================

// Maaş fondu dəyişdikdə vergiləri AVTOMATİK hesabla
userSchema.pre('save', function(next) {
  // Əgər maaş fondu dəyişibsə
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  months.forEach(month => {
    const salaryFund = this.monthly_total_salary_fund?.[month] || 0;
    
    if (salaryFund > 0) {
      // TaxCalculationService ilə şirkət vergilərini hesabla
      const taxResult = taxCalculationService.calculateEmployerTaxes(salaryFund);
      
      // Vergiləri avtomatik doldur
      if (!this.company_taxes) {
        this.company_taxes = { dsmf: {}, ish: {}, its: {}, total_company_taxes: {} };
      }
      
      this.company_taxes.dsmf[month] = taxResult.employerTaxes.dsmf;
      this.company_taxes.ish[month] = taxResult.employerTaxes.ish;
      this.company_taxes.its[month] = taxResult.employerTaxes.its;
      this.company_taxes.total_company_taxes[month] = taxResult.totalEmployerTaxes;
      
      console.log(`✅ MÜƏSSİSƏ VERGİ: ${month} ayı - Maaş fondu: ${salaryFund}`);
      console.log(`   DSMF: ${taxResult.employerTaxes.dsmf}, İŞH: ${taxResult.employerTaxes.ish}, İTŞ: ${taxResult.employerTaxes.its}`);
      console.log(`   Ümumi vergi: ${taxResult.totalEmployerTaxes}`);
    }
  });
  
  next();
});

// FindOneAndUpdate üçün də eyni middleware
userSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Əgər monthly_total_salary_fund update edilibsə
  if (update.$set && update.$set.monthly_total_salary_fund) {
    const salaryFunds = update.$set.monthly_total_salary_fund;
    
    months.forEach(month => {
      const salaryFund = salaryFunds[month] || 0;
      
      if (salaryFund > 0) {
        const taxResult = taxCalculationService.calculateEmployerTaxes(salaryFund);
        
        // Update obyektinə vergiləri əlavə et
        if (!update.$set.company_taxes) {
          update.$set.company_taxes = {};
        }
        if (!update.$set.company_taxes.dsmf) update.$set.company_taxes.dsmf = {};
        if (!update.$set.company_taxes.ish) update.$set.company_taxes.ish = {};
        if (!update.$set.company_taxes.its) update.$set.company_taxes.its = {};
        if (!update.$set.company_taxes.total_company_taxes) update.$set.company_taxes.total_company_taxes = {};
        
        update.$set.company_taxes.dsmf[month] = taxResult.employerTaxes.dsmf;
        update.$set.company_taxes.ish[month] = taxResult.employerTaxes.ish;
        update.$set.company_taxes.its[month] = taxResult.employerTaxes.its;
        update.$set.company_taxes.total_company_taxes[month] = taxResult.totalEmployerTaxes;
      }
    });
  }
  
  next();
});

// ===================== 📊 MÜƏSSİSƏ STATİSTİKA METODLARI =====================

// Müəssisənin bütün işçiləri üçün ümumi vergiləri hesabla
userSchema.methods.calculateCompanyTotalTaxes = function(month) {
  const salaryFund = this.monthly_total_salary_fund?.[month] || 0;
  
  if (salaryFund === 0) {
    return {
      dsmf: 0,
      ish: 0,
      its: 0,
      total: 0
    };
  }
  
  const taxResult = taxCalculationService.calculateEmployerTaxes(salaryFund);
  
  return {
    dsmf: taxResult.employerTaxes.dsmf,
    ish: taxResult.employerTaxes.ish,
    its: taxResult.employerTaxes.its,
    total: taxResult.totalEmployerTaxes
  };
};

// Müəssisənin ümumi xərclərini hesabla (maaş + vergilər)
userSchema.methods.calculateTotalCompanyCost = function(month) {
  const salaryFund = this.monthly_total_salary_fund?.[month] || 0;
  const taxes = this.calculateCompanyTotalTaxes(month);
  
  return salaryFund + taxes.total;
};

// İşçi əlavə olunduqda maaş fondu yenilə
userSchema.methods.updateSalaryFundWithEmployee = function(month, employeeSalary) {
  const currentFund = this.monthly_total_salary_fund?.[month] || 0;
  this.monthly_total_salary_fund[month] = currentFund + employeeSalary;
  
  // Vergiləri yenidən hesabla
  const taxes = this.calculateCompanyTotalTaxes(month);
  
  if (!this.company_taxes) {
    this.company_taxes = { dsmf: {}, ish: {}, its: {}, total_company_taxes: {} };
  }
  
  this.company_taxes.dsmf[month] = taxes.dsmf;
  this.company_taxes.ish[month] = taxes.ish;
  this.company_taxes.its[month] = taxes.its;
  this.company_taxes.total_company_taxes[month] = taxes.total;
  
  return this;
};

// Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;