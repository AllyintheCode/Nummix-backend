import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ===================== 📅 Event və Calendar schema =====================
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String },
});

// ===================== 💰 Ödəniş Tarixləri Schema =====================
const paymentSchema = new mongoose.Schema({
  paymentType: {
    type: String,
    enum: ["salary", "social_insurance", "income_tax", "its", "ish", "gv"],
    required: true
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "completed"
  },
  forMonth: { type: Date, required: true },
  description: { type: String }
});

// ===================== 👥 İŞÇİ GİRİŞ-ÇIXIŞ STATİSTİKASI =====================
const employeeFlowSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["hired", "terminated", "resigned"], required: true },
  date: { type: Date, required: true },
  department: { type: String },
  position: { type: String },
  reason: { type: String },
  notes: { type: String }
});

const daySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dayOfWeek: { type: String },
  status: {
    type: String,
    enum: ["Workday", "Off day", "Holiday"],
    default: "Workday",
  },
  events: [eventSchema],
  note: { type: String },
});

// ===================== 📊 MÜHASİBAT MODULU =====================
const accountingEntrySchema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: true,
    enum: ["543", "531", "533", "535"]
  },
  accountName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ["debit", "credit"]
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  documentNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "posted", "cancelled"],
    default: "draft"
  },
  relatedTransaction: {
    type: String
  }
});

// ===================== 🏢 ƏSAS VƏSAİTLƏR MODULU =====================
const assetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amortizationRate: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User modelində - YALNIZ assetSchema-nı bu şəkildə dəyişin:

const assetSchema = new mongoose.Schema({
  inventoryNumber: {
    type: String,
    default: function() {
      return `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  account: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  initialValue: {
    type: Number,
    required: true,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0
  },
  amortization: {
    type: Number,
    default: 0
  },
  amortizationPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Aktiv", "Passiv", "Satılıb", "Sıradan çıxıb"],
    default: "Aktiv"
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  serviceLife: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    trim: true
  },
  
  // ✅ YENİ: MULTER BUFFER ÜÇÜN SƏNƏD SAHƏSİ
  document: {
    originalName: {
      type: String,
      required: false
    },
    mimeType: {
      type: String,
      required: false
    },
    fileSize: {
      type: Number,
      required: false
    },
    // ✅ BUFFER DATA - Base64 formatında saxlayırıq
    bufferData: {
      type: String, // Buffer'ı Base64 string kimi saxlayırıq
      required: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
// Excel və PDF report schema-larında da buffer əlavə edə bilərsiniz (seçimlik):
const excelReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Ümumi hesabat"
  },
  description: {
    type: String,
    default: "Vəsait siyahısını Excel kimi yüklə"
  },
  reportType: {
    type: String,
    enum: ["assets", "category", "department"],
    default: "assets"
  },
  fileName: {
    type: String,
    required: true
  },
  // ✅ SEÇİMLİ: Buffer üçün əlavə edə bilərsiniz
  bufferData: {
    type: String, // Base64 string
    required: false
  },
  filePath: {
    type: String,
    required: false // ✅ Artıq tələb olunmur
  },
  fileSize: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  data: [{
    inventoryNumber: String,
    name: String,
    category: String,
    account: String,
    location: String,
    initialValue: Number,
    currentValue: Number,
    amortization: Number,
    status: String,
    amortizationPercentage: Number
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number,
    totalAmortization: Number,
    averageAmortizationPercentage: Number
  },
  filters: {
    dateFrom: Date,
    dateTo: Date,
    categories: [String],
    locations: [String],
    status: String
  }
});

// Eyni dəyişikliyi pdfReportSchema üçün də edə bilərsiniz
const pdfReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Amortizasiya hesabatı"
  },
  description: {
    type: String,
    default: "Amortizasiya detalları"
  },
  reportType: {
    type: String,
    enum: ["amortization", "category", "department"],
    default: "amortization"
  },
  fileName: {
    type: String,
    required: true
  },
  // ✅ SEÇİMLİ: Buffer üçün
  bufferData: {
    type: String,
    required: false
  },
  filePath: {
    type: String,
    required: false // ✅ Artıq tələb olunmur
  },
  fileSize: {
    type: Number,
    default: 0
  },
  // ... qalan sahələr eyni qalır
});

const categoryReportSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Kateqoriya üzrə"
  },
  description: {
    type: String,
    default: "Kateqoriyalar üzrə xülasə"
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  data: [{
    category: String,
    assetCount: Number,
    initialValue: Number,
    currentValue: Number,
    amortization: Number,
    amortizationPercentage: Number
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number,
    totalAmortization: Number,
    averageAmortizationPercentage: Number
  }
});

const departmentReportSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Şöbə/filial üzrə"
  },
  description: {
    type: String,
    default: "Şöbələr üzrə xülasə"
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  data: [{
    location: String,
    assetCount: Number,
    initialValue: Number,
    currentValue: Number,
    percentage: Number
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number
  }
});

// ===================== 👤 İstifadəçi schema =====================
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    companyName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
 
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
    
    active_employee: { type: Number, default: 0 },
    last_month_active_employee: { type: Number, default: 0 },

    monthly_employee_flow: {
      January: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      February: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      March: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      April: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      May: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      June: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      July: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      August: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      September: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      October: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      November: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      },
      December: {
        new_hires: { type: Number, default: 0 },
        terminations: { type: Number, default: 0 },
        resignations: { type: Number, default: 0 },
        net_change: { type: Number, default: 0 }
      }
    },

    employee_flow_history: [employeeFlowSchema],

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
      }
    },

    employee_payments: [paymentSchema],
    employer_payments: [paymentSchema],

    current_month_total: {
      salary_fund: { type: Number, default: 0 },
      company_taxes: { type: Number, default: 0 },
      employee_count: { type: Number, default: 0 }
    },


    gross_profit: { type: Number },
    Net_profit: { type: Number },
    last_gross_profit: { type: Number },
    last_Net_profit: { type: Number },
    total_assets: { type: Number },
    Obligations_assets: { type: Number },
    expected_taxes: { type: Number },
    vacation: { type: Number },
    position: { type: Array },
    taxes: { type: String },
    Bonuses: { type: String },
    waiting_request_Graduation: { type: Number },
    late_employee: { type: Number },
    excused_employee: { type: Number },
    Unexcused_employee: { type: Array },
    Attendance_employee: { type: Array },
    
    gross: {
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

    tax: {
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

    social_pay: {
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

    Net_salary: {
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

    salary_status: {
      January: { type: String, default: "0" },
      February: { type: String, default: "0" },
      March: { type: String, default: "0" },
      April: { type: String, default: "0" },
      May: { type: String, default: "0" },
      June: { type: String, default: "0" },
      July: { type: String, default: "0" },
      August: { type: String, default: "0" },
      September: { type: String, default: "0" },
      October: { type: String, default: "0" },
      November: { type: String, default: "0" },
      December: { type: String, default: "0" },
    },

    Common_net_Payroll: {
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

    Common_Taxes: {
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

    common_late: { type: Number, default: 0 },
    common_attendance: { type: Number, default: 0 },
    new_employees: { type: Number, default: 0 },
    left_job: { type: Number, default: 0 },
    change_employees: { type: Number, default: 0 },
    Payroll_fund: { type: Number, default: 0 },
    change_Payroll_fund: { type: Number, default: 0 },
    Average_salary: { type: Number, default: 0 },
    change_Average_salary: { type: Number, default: 0 },
    Attendance: { type: Number, default: 0 },
    change_Attendance: { type: Number, default: 0 },
    Employee_turnover: { type: Number, default: 0 },
    change_Employee_turnover: { type: Number, default: 0 },

    calendar: [daySchema],

    accountingEntries: [accountingEntrySchema],
    
    accountingBalances: {
      "543": {
        totalDebit: { type: Number, default: 0 },
        totalCredit: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      },
      "531": {
        totalDebit: { type: Number, default: 0 },
        totalCredit: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      },
      "533": {
        totalDebit: { type: Number, default: 0 },
        totalCredit: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      },
      "535": {
        totalDebit: { type: Number, default: 0 },
        totalCredit: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
      }
    },

    monthlyAccounting: {
      January: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      February: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      March: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      April: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      May: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      June: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      July: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      August: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      September: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      October: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      November: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      },
      December: {
        totalTransactions: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        debitTotal: { type: Number, default: 0 },
        creditTotal: { type: Number, default: 0 }
      }
    },

    assetCategories: [assetCategorySchema],
    assets: [assetSchema],
    assetExcelReports: [excelReportSchema],
    assetPdfReports: [pdfReportSchema],
    assetCategoryReports: [categoryReportSchema],
    assetDepartmentReports: [departmentReportSchema],
    
    assetStatistics: {
      totalAssets: { type: Number, default: 0 },
      totalInitialValue: { type: Number, default: 0 },
      totalCurrentValue: { type: Number, default: 0 },
      totalAmortization: { type: Number, default: 0 },
      averageAmortizationPercentage: { type: Number, default: 0 },
      activeAssets: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },

    departmentValues: {
      type: Map,
      of: {
        initialValue: { type: Number, default: 0 },
        currentValue: { type: Number, default: 0 },
        assetCount: { type: Number, default: 0 }
      },
      default: {}
    }
  },
  { timestamps: true }
);

// ===================== 🔐 Password hashing =====================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ===================== 📊 MÜHASİBAT METODLARI =====================
userSchema.methods.updateAccountingBalances = function() {
  const balances = {
    "543": { totalDebit: 0, totalCredit: 0, balance: 0 },
    "531": { totalDebit: 0, totalCredit: 0, balance: 0 },
    "533": { totalDebit: 0, totalCredit: 0, balance: 0 },
    "535": { totalDebit: 0, totalCredit: 0, balance: 0 }
  };

  this.accountingEntries.forEach(entry => {
    if (entry.status === 'posted') {
      if (entry.type === 'debit') {
        balances[entry.accountCode].totalDebit += entry.amount;
      } else {
        balances[entry.accountCode].totalCredit += entry.amount;
      }
    }
  });

  Object.keys(balances).forEach(code => {
    balances[code].balance = balances[code].totalDebit - balances[code].totalCredit;
    balances[code].lastUpdated = new Date();
    
    if (this.accountingBalances[code]) {
      this.accountingBalances[code] = balances[code];
    }
  });
};

// ===================== 📈 AYLIQ MÜHASİBAT YENİLƏMƏ METODU =====================
userSchema.methods.updateMonthlyAccounting = function(entry) {
  if (entry.status !== 'posted') return;
  
  const month = new Date(entry.date).toLocaleString('en-US', { month: 'long' });
  if (this.monthlyAccounting[month]) {
    this.monthlyAccounting[month].totalTransactions += 1;
    this.monthlyAccounting[month].totalAmount += entry.amount;
    
    if (entry.type === 'debit') {
      this.monthlyAccounting[month].debitTotal += entry.amount;
    } else {
      this.monthlyAccounting[month].creditTotal += entry.amount;
    }
  }
};
// ===================== 🏢 ƏSAS VƏSAİTLƏR METODLARI =====================
userSchema.methods.updateAssetStatistics = function() {
  const activeAssets = this.assets.filter(asset => asset.status === "Aktiv");
  
  this.assetStatistics.totalAssets = this.assets.length;
  this.assetStatistics.activeAssets = activeAssets.length;
  this.assetStatistics.totalInitialValue = activeAssets.reduce((sum, asset) => sum + asset.initialValue, 0);
  this.assetStatistics.totalCurrentValue = activeAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  this.assetStatistics.totalAmortization = activeAssets.reduce((sum, asset) => sum + asset.amortization, 0);
  
  if (this.assetStatistics.totalInitialValue > 0) {
    this.assetStatistics.averageAmortizationPercentage = 
      (this.assetStatistics.totalAmortization / this.assetStatistics.totalInitialValue) * 100;
  }
  
  this.assetStatistics.lastUpdated = new Date();
};

userSchema.methods.updateDepartmentValues = function() {
  const departmentMap = new Map();
  
  this.assets.filter(asset => asset.status === "Aktiv").forEach(asset => {
    if (!departmentMap.has(asset.location)) {
      departmentMap.set(asset.location, {
        initialValue: 0,
        currentValue: 0,
        assetCount: 0
      });
    }
    
    const dept = departmentMap.get(asset.location);
    dept.initialValue += asset.initialValue;
    dept.currentValue += asset.currentValue;
    dept.assetCount += 1;
  });
  
  this.departmentValues = departmentMap;
};

userSchema.methods.calculateAmortization = function(asset) {
  const amortization = asset.initialValue - asset.currentValue;
  const amortizationPercentage = asset.initialValue > 0 ? (amortization / asset.initialValue) * 100 : 0;
  
  return {
    amortization,
    amortizationPercentage: Number(amortizationPercentage.toFixed(2))
  };
};

userSchema.methods.addAsset = function(assetData) {
  const amortizationData = this.calculateAmortization(assetData);
  
  const newAsset = {
    ...assetData,
    amortization: amortizationData.amortization,
    amortizationPercentage: amortizationData.amortizationPercentage,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.assets.push(newAsset);
  return newAsset;
};

userSchema.methods.generateCategoryReport = function() {
  const categoryMap = new Map();
  
  this.assets.filter(asset => asset.status === "Aktiv").forEach(asset => {
    if (!categoryMap.has(asset.category)) {
      categoryMap.set(asset.category, {
        assetCount: 0,
        initialValue: 0,
        currentValue: 0,
        amortization: 0
      });
    }
    
    const category = categoryMap.get(asset.category);
    category.assetCount += 1;
    category.initialValue += asset.initialValue;
    category.currentValue += asset.currentValue;
    category.amortization += asset.amortization;
  });
  
  const data = Array.from(categoryMap.entries()).map(([category, stats]) => {
    const amortizationPercentage = stats.initialValue > 0 ? 
      (stats.amortization / stats.initialValue) * 100 : 0;
    
    return {
      category,
      assetCount: stats.assetCount,
      initialValue: stats.initialValue,
      currentValue: stats.currentValue,
      amortization: stats.amortization,
      amortizationPercentage: Number(amortizationPercentage.toFixed(2))
    };
  });
  
  const summary = {
    totalAssets: data.reduce((sum, item) => sum + item.assetCount, 0),
    totalInitialValue: data.reduce((sum, item) => sum + item.initialValue, 0),
    totalCurrentValue: data.reduce((sum, item) => sum + item.currentValue, 0),
    totalAmortization: data.reduce((sum, item) => sum + item.amortization, 0),
    averageAmortizationPercentage: data.length > 0 ? 
      data.reduce((sum, item) => sum + item.amortizationPercentage, 0) / data.length : 0
  };
  
  return {
    title: "Kateqoriya hesabatı",
    description: "Kateqoriyalar üzrə xülasə",
    generatedAt: new Date(),
    data,
    summary
  };
};

// ===================== 🔰 Model Export =====================
const User = mongoose.model("User", userSchema);
export default User;