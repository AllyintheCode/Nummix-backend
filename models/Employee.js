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
  forMonth: { type: Date, required: true },
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
  notes: { type: String },
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

// ===================== 📆 AYLIK MAAŞ TARİXÇƏSİ =====================
const monthlySalarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  month: {
    type: Date,
    required: true,
    index: true
  },
  gross: { type: Number, required: true },
  net: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  daysWorked: { type: Number, default: 30 },
  employeeTaxes: {
    incomeTax: { type: Number, default: 0 },
    dsmf: { type: Number, default: 0 },
    its: { type: Number, default: 0 },
    ish: { type: Number, default: 0 },
    gvTax: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  employerTaxes: {
    dsmf: { type: Number, default: 0 },
    its: { type: Number, default: 0 },
    ish: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  terminationDetails: {
    isTermination: { type: Boolean, default: false },
    unusedLeaveCompensation: { type: Number, default: 0 },
    severancePay: { type: Number, default: 0 },
    terminationDate: { type: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

monthlySalarySchema.index({ employeeId: 1, month: 1 }, { unique: true });

// ===================== EMPLOYEE SCHEMA =====================
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
  leaveEntitlement: { type: Number, default: 28 },

  // ===================== 💰 MAAŞ NÖVÜ VƏ ÖDƏNİŞ MƏLUMATLARI =====================
  employeeType: {
    type: String,
    enum: ["state", "private"],
    required: true,
    default: "private"
  },

  gross: {
    type: Number,
    default: 0,
    required: true,
    validate: {
      validator: function(v) {
        if (this.status === 'terminated') return true;
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

  employer_taxes: {
    dsmf: { type: Number, default: 0 },
    its: { type: Number, default: 0 },
    ish: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  total_company_cost: { type: Number, default: 0 },

  paymentHistory: [paymentHistorySchema],
  taxPaymentHistory: [taxPaymentSchema],
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date },

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

  // ===================== ✅ SON HAQQ-HESAB (terminated işçilər üçün) =====================
  lastSettlement: {
    grossSalary:             { type: Number, default: 0 }, // terminasiyadan əvvəlki gross
    netSalary:               { type: Number, default: 0 }, // əlinə keçən ümumi məbləğ
    proportionalGross:       { type: Number, default: 0 }, // faktiki işlənmiş günlər üçün maaş
    unusedLeaveCompensation: { type: Number, default: 0 }, // istifadə edilməmiş məzuniyyət
    severancePay:            { type: Number, default: 0 }, // ixtisar müavinəti
    totalGross:              { type: Number, default: 0 }, // ümumi brüt
    totalNet:                { type: Number, default: 0 }, // ümumi net (əlinə keçən)
    incomeTax:               { type: Number, default: 0 }, // tutulmuş gəlir vergisi
    workedDays:              { type: Number, default: 0 }, // faktiki işlənmiş iş günü
    totalWorkDaysInMonth:    { type: Number, default: 0 }, // həmin ayın ümumi iş günü
    dailyRate:               { type: Number, default: 0 }, // gündəlik tarif
    terminationType:         { type: String, default: "" }, // resignation | layoff | termination_for_cause
  },

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
  internshipPeriod: {
    type: Number,
    default: 0
  },
  contractDuration: {
    type: Number,
    default: 0
  },
  contractStartDate: {
    type: Date,
    default: 0
  },
  contractEndDate: {
    type: Date,
    default: 0
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===================== ⚡ VİRTUAL FIELDLƏR =====================
employeeSchema.virtual('total_employee_taxes').get(function() {
  return (this.tax || 0) + (this.social_pay || 0);
});

employeeSchema.virtual('total_all_taxes').get(function() {
  const employeeTaxes = (this.tax || 0) + (this.social_pay || 0);
  const employerTaxes = this.employer_taxes?.total || 0;
  return employeeTaxes + employerTaxes;
});

employeeSchema.virtual('company_total_cost').get(function() {
  return (this.gross || 0) + (this.employer_taxes?.total || 0);
});

employeeSchema.virtual('usedLeaveDays').get(function() {
  if (!this.leaves) return 0;
  return this.leaves
    .filter(leave => leave.status === 'approved')
    .reduce((sum, leave) => sum + (leave.totalDaysRequested || 0), 0);
});

employeeSchema.virtual('tenureYears').get(function() {
  const endDate = this.terminationDate || new Date();
  const start   = new Date(this.hireDate);
  let years     = endDate.getFullYear() - start.getFullYear();
  const monthDiff = endDate.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < start.getDate())) {
    years--;
  }
  return years < 0 ? 0 : years;
});

// ===================== 🔧 KÖMƏKÇI FUNKSIYA: VERGİ HESABLAMA =====================
function computeTaxFields(grossNum, employeeType, taxResult) {
  let tax, social_pay;

  if (employeeType === 'state') {
    tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
    social_pay = Number(
      (taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.ish +
        taxResult.employee.taxes.its).toFixed(2)
    );
  } else {
    tax = Number(taxResult.employee.taxes.incomeTax.toFixed(2));
    let socialPay =
      taxResult.employee.taxes.dsmf +
      taxResult.employee.taxes.ish +
      taxResult.employee.taxes.its;
    if (taxResult.employee.taxes.gvTax) {
      socialPay += taxResult.employee.taxes.gvTax;
    }
    social_pay = Number(socialPay.toFixed(2));
  }

  const Net_salary = Number(taxResult.employee.netSalary.toFixed(2));

  const employer_taxes = {
    dsmf: Number(taxResult.employer.employerTaxes.dsmf.toFixed(2)),
    its:  Number(taxResult.employer.employerTaxes.its.toFixed(2)),
    ish:  Number(taxResult.employer.employerTaxes.ish.toFixed(2)),
    total: Number(taxResult.employer.totalEmployerTaxes.toFixed(2))
  };

  const total_company_cost = Number((grossNum + employer_taxes.total).toFixed(2));

  return { tax, social_pay, Net_salary, employer_taxes, total_company_cost };
}

// ===================== MIDDLEWARE: PRE SAVE =====================
employeeSchema.pre('save', async function(next) {
  if (this.status === 'terminated') return next();

  this.gross = Number(this.gross) || 0;

  if (!this.gross || this.gross === 0) {
    this.tax             = 0;
    this.social_pay      = 0;
    this.Net_salary      = 0;
    this.employer_taxes  = { dsmf: 0, its: 0, ish: 0, total: 0 };
    this.total_company_cost = 0;
    this.salary_status   = "not_set";
    return next();
  }

  if (this.gross < 400) {
    return next(new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz'));
  }

  try {
    const taxResult = taxCalculationService.calculateAllTaxes(
      this.gross,
      this.employeeType || 'private'
    );
    const computed = computeTaxFields(this.gross, this.employeeType || 'private', taxResult);

    this.tax             = computed.tax;
    this.social_pay      = computed.social_pay;
    this.Net_salary      = computed.Net_salary;
    this.employer_taxes  = computed.employer_taxes;
    this.total_company_cost = computed.total_company_cost;

    if (this.isNew) this.salary_status = "pending";

    next();
  } catch (error) {
    next(error);
  }
});

// ===================== MIDDLEWARE: PRE FINDONEANDUPDATE =====================
employeeSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();

  if (update.$set?.gross !== undefined) update.$set.gross = Number(update.$set.gross);
  if (update.gross !== undefined)       update.gross      = Number(update.gross);

  const hasGross       = update.$set?.gross !== undefined || update.gross !== undefined;
  const hasEmployeeType = update.$set?.employeeType !== undefined || update.employeeType !== undefined;

  if (!hasGross && !hasEmployeeType) return next();

  try {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    const newGross = Number(
      update.$set?.gross ?? update.gross ?? docToUpdate.gross ?? 0
    );
    const newEmployeeType =
      update.$set?.employeeType ||
      update.employeeType ||
      docToUpdate.employeeType ||
      'private';

    if (!newGross || newGross === 0) {
      this.set({
        tax: 0, social_pay: 0, Net_salary: 0,
        employer_taxes: { dsmf: 0, its: 0, ish: 0, total: 0 },
        total_company_cost: 0,
        salary_status: "not_set"
      });
      return next();
    }

    if (newGross < 400) return next(new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz'));

    const taxResult = taxCalculationService.calculateAllTaxes(newGross, newEmployeeType);
    const computed  = computeTaxFields(newGross, newEmployeeType, taxResult);

    this.set({
      tax:             computed.tax,
      social_pay:      computed.social_pay,
      Net_salary:      computed.Net_salary,
      employer_taxes:  computed.employer_taxes,
      total_company_cost: computed.total_company_cost,
      salary_status:   "pending"
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
employeeSchema.statics.getCompanySalarySummary = async function(companyId) {
  const employees = await this.find({
    companyId,
    status: 'active',
    gross: { $gt: 0 }
  });

  if (employees.length === 0) {
    return {
      totalEmployees: 0, totalGross: 0, totalNet: 0,
      totalTax: 0, totalSocialPay: 0, totalEmployerTaxes: 0,
      totalCompanyCost: 0, averageGross: 0, averageNet: 0
    };
  }

  const summary = employees.reduce((acc, emp) => {
    acc.totalGross         += emp.gross || 0;
    acc.totalNet           += emp.Net_salary || 0;
    acc.totalTax           += emp.tax || 0;
    acc.totalSocialPay     += emp.social_pay || 0;
    acc.totalEmployerTaxes += emp.employer_taxes?.total || 0;
    acc.totalCompanyCost   += emp.total_company_cost || 0;
    return acc;
  }, {
    totalEmployees: employees.length,
    totalGross: 0, totalNet: 0, totalTax: 0,
    totalSocialPay: 0, totalEmployerTaxes: 0, totalCompanyCost: 0
  });

  summary.averageGross = Number((summary.totalGross / employees.length).toFixed(2));
  summary.averageNet   = Number((summary.totalNet   / employees.length).toFixed(2));

  return summary;
};

// ===================== İNSTANCE METODLAR =====================
employeeSchema.methods.recalculateSalary = function() {
  this.gross = Number(this.gross) || 0;
  if (this.gross < 400) throw new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');

  const taxResult = taxCalculationService.calculateAllTaxes(this.gross, this.employeeType || 'private');
  const computed  = computeTaxFields(this.gross, this.employeeType || 'private', taxResult);

  this.tax             = computed.tax;
  this.social_pay      = computed.social_pay;
  this.Net_salary      = computed.Net_salary;
  this.employer_taxes  = computed.employer_taxes;
  this.total_company_cost = computed.total_company_cost;

  return this;
};

employeeSchema.methods.processSalaryPayment = function(paymentDate = new Date()) {
  this.paymentHistory.push({
    paymentType: "salary",
    amount:      this.Net_salary,
    paymentDate,
    status:      "completed",
    forMonth:    new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1),
    description: `Aylıq maaş ödənişi - ${paymentDate.toLocaleDateString('az-AZ')}`,
    taxDetails: {
      grossSalary:     this.gross,
      incomeTax:       this.tax,
      socialInsurance: this.social_pay,
      its:             this.employer_taxes?.its || 0,
      ish:             this.employer_taxes?.ish || 0,
      netSalary:       this.Net_salary
    }
  });

  this.lastPaymentDate = paymentDate;
  this.nextPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 1);
  this.salary_status   = "paid";

  return this;
};

// ===================== TERMİNATEANDSETTLE =====================
employeeSchema.statics.terminateAndSettle = async function(
  employeeId,
  terminationDate = new Date(),
  terminationType = 'resignation',
  options = {}
) {
  const Employee      = this;
  const MonthlySalary = mongoose.model('MonthlySalary');

  // ── 0. İşçini tap ──────────────────────────────────────────────────────
  const employee = await Employee.findById(employeeId);
  if (!employee)                        throw new Error('İşçi tapılmadı');
  if (employee.status === 'terminated') throw new Error('İşçi artıq işdən çıxarılıb');

  // ── 1. Tarixi normallaşdır — həftəsonu → əvvəlki cümə ─────────────────
  const termDate = snapToLastWorkDay(new Date(terminationDate));

  const year       = termDate.getFullYear();
  const month      = termDate.getMonth(); // 0-əsaslı
  const monthStart = new Date(year, month, 1);
  const hireDate   = new Date(employee.hireDate);

  // İşə başlama tarixi ilə terminasiya eyni aydadırsa
  const isSameMonth =
    hireDate.getFullYear() === year &&
    hireDate.getMonth()    === month;

  // ── 2. İş günü hesablamaları ───────────────────────────────────────────
  const totalWorkDaysInMonth = getWorkDaysInMonth(year, month);
  if (totalWorkDaysInMonth === 0) throw new Error('Həmin ayda iş günü tapılmadı');

  const workedDays = isSameMonth
    ? getWorkDaysBetween(hireDate, termDate)   // işə başladığı gündən
    : getWorkDaysBetween(monthStart, termDate); // ayın əvvəlindən

  const dailyRate         = employee.gross / totalWorkDaysInMonth;
  const proportionalGross = Number((dailyRate * workedDays).toFixed(2));

  // ── 3. Məzuniyyət kompensasiyası (resignation üçün 0) ─────────────────
  let unusedLeaveDays         = 0;
  let unusedLeaveCompensation = 0;

  if (terminationType !== 'resignation') {
    const totalEntitlement  = employee.leaveEntitlement || 28;
    const usedDays          = employee.usedLeaveDays    || 0;
    unusedLeaveDays         = Math.max(0, totalEntitlement - usedDays);
    unusedLeaveCompensation = Number(((employee.gross / 30.4) * unusedLeaveDays).toFixed(2));
  }

  // ── 4. İxtisar müavinəti (yalnız layoff, vergidən azad) ───────────────
  let severancePay = 0;
  if (terminationType === 'layoff') {
    const tenure = employee.tenureYears;
    if      (tenure < 1)  severancePay = employee.gross * 1;
    else if (tenure < 5)  severancePay = employee.gross * 1.4;
    else if (tenure < 10) severancePay = employee.gross * 1.7;
    else                  severancePay = employee.gross * 2;
    severancePay = Number(severancePay.toFixed(2));
  }

  // ── 5. Vergi hesablaması ───────────────────────────────────────────────
  const taxableAmount = proportionalGross + unusedLeaveCompensation;
  const taxResult     = taxCalculationService.calculateAllTaxes(taxableAmount, employee.employeeType);
  const computed      = computeTaxFields(taxableAmount, employee.employeeType, taxResult);

  const totalGross = proportionalGross + unusedLeaveCompensation + severancePay;
  const totalNet   = Number((computed.Net_salary + severancePay).toFixed(2));

  // ── 6. MonthlySalary yarat / yenilə ───────────────────────────────────
  let monthlySalary = await MonthlySalary.findOne({
    employeeId: employee._id,
    month:      monthStart,
  });

  const salaryData = {
    gross:      totalGross,
    net:        totalNet,
    daysWorked: workedDays,
    employeeTaxes: {
      incomeTax: computed.tax,
      dsmf:      taxResult.employee.taxes.dsmf,
      its:       taxResult.employee.taxes.its,
      ish:       taxResult.employee.taxes.ish,
      gvTax:     taxResult.employee.taxes.gvTax || 0,
      total:
        computed.tax +
        taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.its +
        taxResult.employee.taxes.ish +
        (taxResult.employee.taxes.gvTax || 0),
    },
    employerTaxes: {
      dsmf:  taxResult.employer.employerTaxes.dsmf,
      its:   taxResult.employer.employerTaxes.its,
      ish:   taxResult.employer.employerTaxes.ish,
      total: taxResult.employer.totalEmployerTaxes,
    },
    terminationDetails: {
      isTermination:          true,
      terminationType,
      unusedLeaveCompensation,
      severancePay,
      terminationDate:        new Date(termDate),
    },
  };

  if (monthlySalary) {
    Object.assign(monthlySalary, salaryData);
    await monthlySalary.save();
  } else {
    monthlySalary = new MonthlySalary({
      employeeId: employee._id,
      companyId:  employee.companyId,
      month:      monthStart,
      bonus:      0,
      status:     'pending',
      ...salaryData,
    });
    await monthlySalary.save();
  }

  // ── 7. İşçi statusunu yenilə + lastSettlement saxla ───────────────────
  await Employee.updateOne(
    { _id: employee._id },
    {
      $set: {
        // Status
        status:          'terminated',
        terminationDate: new Date(termDate),

        // Maaş sahələrini sıfırla
        gross:                  0,
        tax:                    0,
        social_pay:             0,
        Net_salary:             0,
        'employer_taxes.dsmf':  0,
        'employer_taxes.its':   0,
        'employer_taxes.ish':   0,
        'employer_taxes.total': 0,
        total_company_cost:     0,
        salary_status:          'not_set',

        // ✅ Son haqq-hesab məlumatlarını saxla
        'lastSettlement.grossSalary':             employee.gross,
        'lastSettlement.netSalary':               totalNet,
        'lastSettlement.proportionalGross':       proportionalGross,
        'lastSettlement.unusedLeaveCompensation': unusedLeaveCompensation,
        'lastSettlement.severancePay':            severancePay,
        'lastSettlement.totalGross':              totalGross,
        'lastSettlement.totalNet':                totalNet,
        'lastSettlement.incomeTax':               computed.tax,
        'lastSettlement.workedDays':              workedDays,
        'lastSettlement.totalWorkDaysInMonth':    totalWorkDaysInMonth,
        'lastSettlement.dailyRate':               Number(dailyRate.toFixed(2)),
        'lastSettlement.terminationType':         terminationType,
      },
    }
  );

  const updatedEmployee = await Employee.findById(employee._id);

  // ── 8. Nəticəni qaytar ────────────────────────────────────────────────
  return {
    employee: updatedEmployee,
    monthlySalary,
    settlement: {
      workedDays,
      totalWorkDaysInMonth,
      dailyRate:               Number(dailyRate.toFixed(2)),
      proportionalGross,
      unusedLeaveDays,
      unusedLeaveCompensation,
      severancePay,
      terminationType,
      taxableAmount,
      incomeTax:               computed.tax,
      totalGross,
      totalNet,
      tenureYears:             employee.tenureYears,
    },
  };
};

// ===================== PROCESSMONTHYLYPAYROLL =====================
employeeSchema.statics.processMonthlyPayroll = async function(companyId, month, year) {
  const Employee      = this;
  const MonthlySalary = mongoose.model('MonthlySalary');

  const activeEmployees = await Employee.find({
    companyId,
    status: 'active',
    gross:  { $gt: 0 }
  });

  const monthStart = new Date(year, month - 1, 1);
  const results    = [];

  for (const emp of activeEmployees) {
    let ms = await MonthlySalary.findOne({ employeeId: emp._id, month: monthStart });

    const taxResult = taxCalculationService.calculateAllTaxes(emp.gross, emp.employeeType);
    const computed  = computeTaxFields(emp.gross, emp.employeeType, taxResult);

    const salaryData = {
      gross:      emp.gross,
      net:        computed.Net_salary,
      bonus:      0,
      daysWorked: 30,
      employeeTaxes: {
        incomeTax: computed.tax,
        dsmf:      taxResult.employee.taxes.dsmf,
        its:       taxResult.employee.taxes.its,
        ish:       taxResult.employee.taxes.ish,
        gvTax:     taxResult.employee.taxes.gvTax || 0,
        total:
          computed.tax +
          taxResult.employee.taxes.dsmf +
          taxResult.employee.taxes.its +
          taxResult.employee.taxes.ish +
          (taxResult.employee.taxes.gvTax || 0)
      },
      employerTaxes: {
        dsmf:  taxResult.employer.employerTaxes.dsmf,
        its:   taxResult.employer.employerTaxes.its,
        ish:   taxResult.employer.employerTaxes.ish,
        total: taxResult.employer.totalEmployerTaxes
      }
    };

    if (ms) {
      Object.assign(ms, salaryData);
      await ms.save();
    } else {
      ms = new MonthlySalary({
        employeeId: emp._id,
        companyId,
        month:      monthStart,
        status:     'pending',
        ...salaryData
      });
      await ms.save();
    }

    results.push(ms);
  }

  return results;
};

// ===================== KÖMƏKÇİ FUNKSIYALAR =====================

/**
 * Həftəsonu (şənbə/bazar) → əvvəlki cümə
 * Həftəiçi günlər olduğu kimi qalır
 */
function snapToLastWorkDay(date) {
  const d   = new Date(date);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() - 1); // Şənbə → Cümə
  if (day === 0) d.setDate(d.getDate() - 2); // Bazar  → Cümə
  return d;
}

/**
 * Verilən ilin/ayın həftəiçi iş günlərinin sayı
 * month: 0-əsaslı
 */
function getWorkDaysInMonth(year, month) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0);
  let count   = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/**
 * start-dan end-ə qədər (hər ikisi daxil) həftəiçi iş günlərinin sayı
 */
function getWorkDaysBetween(start, end) {
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

// ===================== MODELLƏRİ QEYDİYYATDAN KEÇİR =====================
const MonthlySalary = mongoose.model('MonthlySalary', monthlySalarySchema);
const Employee      = mongoose.model('Employee', employeeSchema);

export default Employee;
export { MonthlySalary };