// models/Employee.js
import mongoose from "mongoose";
import taxCalculationService from '../services/taxCalculationService.js';

// ===================== 💰 Ödəniş Tarixləri Schema =====================
const paymentHistorySchema = new mongoose.Schema({
  paymentType: {
    type: String,
    enum: ["salary", "bonus", "advance", "other"],
    required: true
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "completed"
  },
  forMonth: { type: Date, required: true }, // Hansı ay üçün ödəniş
  description: { type: String },
  taxDetails: {
    grossSalary: { type: Number },
    incomeTax: { type: Number },
    socialInsurance: { type: Number },
    its: { type: Number },
    ish: { type: Number },
    netSalary: { type: Number }
  }
});

const taxPaymentSchema = new mongoose.Schema({
  taxType: {
    type: String,
    enum: ["income_tax", "social_insurance", "its", "ish", "gv"],
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

const leaveSchema = new mongoose.Schema({
  leaveId: { type: String },
  leaveType: { type: String, enum: ["annual", "sick", "unpaid", "other"], default: "annual" },
  startDate: { type: Date },
  endDate: { type: Date },
  totalDaysRequested: { type: Number, default: 0 },
  daysUsed: { type: Number, default: 0 },
  daysRemaining: { type: Number, default: 0 },
  status: { type: String, enum: ["approved", "pending", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  reason: { type: String },
  notes: { type: String }
});

const attendanceSchema = new mongoose.Schema({
  attendanceId: { type: String },
  date: { type: String },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { type: String, enum: ["present", "absent", "on_leave", "remote"], default: "present" },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  lateType: { type: String, enum: ["voluntary", "involuntary", "other"], default: "other" }
});

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  position: { type: String, required: true },
  tin: { type: String, required: true },
  idSerialNumber: { type: String, required: true },
  phone: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  contentType: String,
  data: Buffer,
  fileSize: Number,
  originalName: String,

  // ===================== 💰 MAAŞ NÖVÜ VƏ ÖDƏNİŞ MƏLUMATLARI =====================
  employeeType: {
    type: String,
    enum: ["state", "private"],
    required: true,
    default: "private"
  },

  // Cari ay üçün maaş məlumatları
  gross: { 
    type: Number, 
    default: 0,
    required: true,
    validate: {
      validator: function(v) {
        return v >= 400;
      },
      message: 'Əməkhaqqı 400 AZN-dən aşağı ola bilməz'
    }
  },
  tax: { type: Number, default: 0 },
  social_pay: { type: Number, default: 0 },
  Net_salary: { type: Number, default: 0 },
  salary_status: { 
    type: String, 
    enum: ["pending", "paid", "not_set"],
    default: "pending" 
  },

  // İşəgötürən vergiləri (şirkət üçün)
  employer_taxes: {
    dsmf: { type: Number, default: 0 },
    its: { type: Number, default: 0 },
    ish: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Ümumi şirkət xərci (gross + employer_taxes.total)
  total_company_cost: { type: Number, default: 0 },

  // Maaş ödəniş tarixləri
  paymentHistory: [paymentHistorySchema],

  // Vergi ödəniş tarixləri (işçi üçün)
  taxPaymentHistory: [taxPaymentSchema],

  // Son ödəniş tarixi
  lastPaymentDate: { type: Date },

  // Növbəti gözlənilən ödəniş tarixi
  nextPaymentDate: { type: Date },

  // Digər mövcud fieldlər...
  Recent_Notifications: { type: Array, default: [] },
  status: { 
    type: String, 
    enum: ["active", "on_leave", "terminated"], 
    default: "active" 
  },
  hireDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  terminationDate: { type: Date },
  lateAllowed: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  lateType: { 
    type: String, 
    enum: ["voluntary", "involuntary", "other"], 
    default: "other" 
  },
  onLeave: { type: Boolean, default: false },
  currentLeaveId: { type: String, default: null },
  leaves: [leaveSchema],
  attendances: [attendanceSchema],
  Department: { type: String },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===================== ⚡ AVTOMATİK MAAŞ VƏ VERGİ HESABLAMA =====================

// Virtual field: Ümumi vergilər (işçi üçün)
employeeSchema.virtual('total_employee_taxes').get(function() {
  return (this.tax || 0) + (this.social_pay || 0);
});

// Virtual field: Ümumi vergilər (işçi + işəgötürən)
employeeSchema.virtual('total_all_taxes').get(function() {
  const employeeTaxes = (this.tax || 0) + (this.social_pay || 0);
  const employerTaxes = this.employer_taxes?.total || 0;
  return employeeTaxes + employerTaxes;
});

// Virtual field: Şirkət ümumi xərci
employeeSchema.virtual('company_total_cost').get(function() {
  return (this.gross || 0) + (this.employer_taxes?.total || 0);
});

// ===================== MIDDLEWARE: CREATE & UPDATE =====================

// Yeni işçi yaradılanda və ya update ediləndə avtomatik hesabla
employeeSchema.pre('save', async function(next) {
  // Əgər işçi terminated-dırsa, hesablama etmə
  if (this.status === 'terminated') {
    return next();
  }

  // Əgər gross 0-dırsa və ya yoxdursa
  if (!this.gross || this.gross === 0) {
    this.tax = 0;
    this.social_pay = 0;
    this.Net_salary = 0;
    this.employer_taxes = { dsmf: 0, its: 0, ish: 0, total: 0 };
    this.total_company_cost = 0;
    this.salary_status = "not_set";
    return next();
  }

  // Minimum əməkhaqqı yoxlaması
  if (this.gross < 400) {
    const err = new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');
    return next(err);
  }

  try {
    // TAX SERVICE ilə bütün vergiləri hesabla
    const taxResult = taxCalculationService.calculateAllTaxes(
      this.gross,
      this.employeeType || 'private'
    );

    // İŞÇİ VERGİLƏRİ
    if (this.employeeType === 'state') {
      // Dövlət işçisi
      this.tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
      this.social_pay = Number(
        (taxResult.employee.taxes.dsmf + 
         taxResult.employee.taxes.ish + 
         taxResult.employee.taxes.its).toFixed(2)
      );
    } else {
      // Özəl işçi
      this.tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
      let socialPay = taxResult.employee.taxes.dsmf + 
                     taxResult.employee.taxes.ish + 
                     taxResult.employee.taxes.its;
      
      // Əgər gvTax varsa (8000+ üçün)
      if (taxResult.employee.taxes.gvTax) {
        socialPay += taxResult.employee.taxes.gvTax;
      }
      
      this.social_pay = Number(socialPay.toFixed(2));
    }

    // NET MAAŞ
    this.Net_salary = Number(taxResult.employee.netSalary.toFixed(2));

    // İŞƏGÖTÜRƏN VERGİLƏRİ
    this.employer_taxes = {
      dsmf: Number(taxResult.employer.employerTaxes.dsmf.toFixed(2)),
      its: Number(taxResult.employer.employerTaxes.its.toFixed(2)),
      ish: Number(taxResult.employer.employerTaxes.ish.toFixed(2)),
      total: Number(taxResult.employer.totalEmployerTaxes.toFixed(2))
    };

    // ÜMUMİ ŞİRKƏT XƏRCİ
    this.total_company_cost = Number(
      (this.gross + this.employer_taxes.total).toFixed(2)
    );

    // Əgər yeni işçidirsə, salary_status pending olsun
    if (this.isNew) {
      this.salary_status = "pending";
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ===================== FINDONEANDUPDATE ÜÇÜN MIDDLEWARE =====================

employeeSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // Əgər gross update edilməyibsə və employeeType da yoxdursa, heç nə etmə
  if (!update.$set?.gross && !update.gross && !update.$set?.employeeType && !update.employeeType) {
    return next();
  }

  try {
    // Cari sənədi tap
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    // Yeni gross və employeeType dəyərlərini təyin et
    const newGross = update.$set?.gross || update.gross || docToUpdate.gross;
    const newEmployeeType = update.$set?.employeeType || update.employeeType || docToUpdate.employeeType;

    // Əgər gross 0 və ya yoxdursa
    if (!newGross || newGross === 0) {
      this.set({
        tax: 0,
        social_pay: 0,
        Net_salary: 0,
        employer_taxes: { dsmf: 0, its: 0, ish: 0, total: 0 },
        total_company_cost: 0,
        salary_status: "not_set"
      });
      return next();
    }

    // Minimum əməkhaqqı yoxlaması
    if (newGross < 400) {
      const err = new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');
      return next(err);
    }

    // TAX SERVICE ilə hesabla
    const taxResult = taxCalculationService.calculateAllTaxes(
      newGross,
      newEmployeeType || 'private'
    );

    // Yeni dəyərləri hesabla
    let tax, social_pay;
    
    if (newEmployeeType === 'state') {
      // Dövlət işçisi
      tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
      social_pay = Number(
        (taxResult.employee.taxes.dsmf + 
         taxResult.employee.taxes.ish + 
         taxResult.employee.taxes.its).toFixed(2)
      );
    } else {
      // Özəl işçi
      tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
      let socialPay = taxResult.employee.taxes.dsmf + 
                     taxResult.employee.taxes.ish + 
                     taxResult.employee.taxes.its;
      
      if (taxResult.employee.taxes.gvTax) {
        socialPay += taxResult.employee.taxes.gvTax;
      }
      
      social_pay = Number(socialPay.toFixed(2));
    }

    const netSalary = Number(taxResult.employee.netSalary.toFixed(2));
    const employerTaxes = {
      dsmf: Number(taxResult.employer.employerTaxes.dsmf.toFixed(2)),
      its: Number(taxResult.employer.employerTaxes.its.toFixed(2)),
      ish: Number(taxResult.employer.employerTaxes.ish.toFixed(2)),
      total: Number(taxResult.employer.totalEmployerTaxes.toFixed(2))
    };
    
    const totalCompanyCost = Number((newGross + employerTaxes.total).toFixed(2));

    // Update obyektinə yeni dəyərləri əlavə et
    this.set({
      tax,
      social_pay,
      Net_salary: netSalary,
      employer_taxes: employerTaxes,
      total_company_cost: totalCompanyCost,
      salary_status: "pending"
    });

    next();
  } catch (error) {
    next(error);
  }
});

// ===================== İŞÇİ TERMİNATED OLDUQDA =====================

employeeSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'terminated' && !this.terminationDate) {
    this.terminationDate = new Date();
  }
  next();
});

// ===================== STATİK METODLAR =====================

// Şirkət üçün ümumi maaş statistikası
employeeSchema.statics.getCompanySalarySummary = async function(companyId) {
  const employees = await this.find({ 
    companyId, 
    status: 'active',
    gross: { $gt: 0 }
  });

  if (employees.length === 0) {
    return {
      totalEmployees: 0,
      totalGross: 0,
      totalNet: 0,
      totalTax: 0,
      totalSocialPay: 0,
      totalEmployerTaxes: 0,
      totalCompanyCost: 0,
      averageGross: 0,
      averageNet: 0
    };
  }

  const summary = employees.reduce((acc, emp) => {
    acc.totalGross += emp.gross || 0;
    acc.totalNet += emp.Net_salary || 0;
    acc.totalTax += emp.tax || 0;
    acc.totalSocialPay += emp.social_pay || 0;
    acc.totalEmployerTaxes += emp.employer_taxes?.total || 0;
    acc.totalCompanyCost += emp.total_company_cost || 0;
    return acc;
  }, {
    totalEmployees: employees.length,
    totalGross: 0,
    totalNet: 0,
    totalTax: 0,
    totalSocialPay: 0,
    totalEmployerTaxes: 0,
    totalCompanyCost: 0
  });

  summary.averageGross = Number((summary.totalGross / employees.length).toFixed(2));
  summary.averageNet = Number((summary.totalNet / employees.length).toFixed(2));

  return summary;
};

// ===================== İNSTANCE METODLAR =====================

// İşçinin maaşını yenidən hesabla
employeeSchema.methods.recalculateSalary = function() {
  if (this.gross < 400) {
    throw new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');
  }

  const taxResult = taxCalculationService.calculateAllTaxes(
    this.gross,
    this.employeeType || 'private'
  );

  if (this.employeeType === 'state') {
    this.tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
    this.social_pay = Number(
      (taxResult.employee.taxes.dsmf + 
       taxResult.employee.taxes.ish + 
       taxResult.employee.taxes.its).toFixed(2)
    );
  } else {
    this.tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
    let socialPay = taxResult.employee.taxes.dsmf + 
                   taxResult.employee.taxes.ish + 
                   taxResult.employee.taxes.its;
    
    if (taxResult.employee.taxes.gvTax) {
      socialPay += taxResult.employee.taxes.gvTax;
    }
    
    this.social_pay = Number(socialPay.toFixed(2));
  }

  this.Net_salary = Number(taxResult.employee.netSalary.toFixed(2));
  this.employer_taxes = {
    dsmf: Number(taxResult.employer.employerTaxes.dsmf.toFixed(2)),
    its: Number(taxResult.employer.employerTaxes.its.toFixed(2)),
    ish: Number(taxResult.employer.employerTaxes.ish.toFixed(2)),
    total: Number(taxResult.employer.totalEmployerTaxes.toFixed(2))
  };
  this.total_company_cost = Number(
    (this.gross + this.employer_taxes.total).toFixed(2)
  );

  return this;
};

// Maaş ödənişi et
employeeSchema.methods.processSalaryPayment = function(paymentDate = new Date()) {
  this.paymentHistory.push({
    paymentType: "salary",
    amount: this.Net_salary,
    paymentDate: paymentDate,
    status: "completed",
    forMonth: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1),
    description: `Aylıq maaş ödənişi - ${paymentDate.toLocaleDateString('az-AZ')}`,
    taxDetails: {
      grossSalary: this.gross,
      incomeTax: this.tax,
      socialInsurance: this.social_pay,
      its: this.employer_taxes?.its || 0,
      ish: this.employer_taxes?.ish || 0,
      netSalary: this.Net_salary
    }
  });

  this.lastPaymentDate = paymentDate;
  this.nextPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1);
  this.salary_status = "paid";

  return this;
};

export default mongoose.model("Employee", employeeSchema);