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
  gross: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  social_pay: { type: Number, default: 0 },
  Net_salary: { type: Number, default: 0 },
  salary_status: { type: String, default: "pending" },

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
  status: { type: String, enum: ["active", "on_leave", "terminated"], default: "active" },
  hireDate: { type: Date, required: true },
  lateAllowed: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  lateType: { type: String, enum: ["voluntary", "involuntary", "other"], default: "other" },
  onLeave: { type: Boolean, default: false },
  currentLeaveId: { type: String, default: null },
  leaves: [leaveSchema],
  attendances: [attendanceSchema],
  Department: { type: String },
}, { timestamps: true });

// ===================== ⚡ AVTOMATİK MAAŞ HESABLAMA MIDDLEWARE =====================

// gross və ya employeeType dəyişdikdə avtomatik hesabla
employeeSchema.pre('save', function (next) {
  // Əgər gross və ya employeeType dəyişməyibsə, hesablama
  if (!this.isModified('gross') && !this.isModified('employeeType')) {
    return next();
  }

  // Əgər gross yoxdursa və ya 0-dırsa, hesablama
  if (!this.gross || this.gross === 0) {
    this.tax = 0;
    this.social_pay = 0;
    this.Net_salary = 0;
    this.salary_status = "not_set";
    return next();
  }

  // Minimum əməkhaqqı yoxlaması
  if (this.gross < 400) {
    const err = new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');
    return next(err);
  }

  try {
    // Vergiləri avtomatik hesabla
    const taxResult = taxCalculationService.calculateAllTaxes(
      this.gross,
      this.employeeType || 'private'
    );

    // Vergiləri ayır
    let tax, social_pay;

    if (this.employeeType === 'state') {
      tax = taxResult.employee.taxes.incomeTax;
      social_pay = taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.ish +
        taxResult.employee.taxes.its;
    } else {
      tax = taxResult.employee.taxes.incomeTax;

      // Social insurance hesabla
      social_pay = taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.ish +
        taxResult.employee.taxes.its;

      // Əgər gvTax varsa (8000+ üçün)
      if (taxResult.employee.taxes.gvTax) {
        social_pay += taxResult.employee.taxes.gvTax;
      }
    }

    // Dəyərləri təyin et
    this.tax = Number(tax.toFixed(2));
    this.social_pay = Number(social_pay.toFixed(2));
    this.Net_salary = Number(taxResult.employee.netSalary.toFixed(2));
    this.salary_status = "pending";

    next();
  } catch (error) {
    next(error);
  }
});

// Əgər findOneAndUpdate istifadə ediriksə (PATCH/PUT üçün)
employeeSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  // Əgər gross və ya employeeType dəyişməyibsə
  if (!update.gross && !update.employeeType) {
    return next();
  }

  const gross = update.gross;
  const employeeType = update.employeeType;

  // Əgər gross undefined-dırsa, heç nə etmə
  if (gross === undefined) {
    return next();
  }

  // Əgər gross 0 və ya null-dursa
  if (!gross || gross === 0) {
    update.tax = 0;
    update.social_pay = 0;
    update.Net_salary = 0;
    update.salary_status = "not_set";
    return next();
  }

  // Minimum əməkhaqqı yoxlaması
  if (gross < 400) {
    const err = new Error('Əməkhaqqı 400 AZN-dən aşağı ola bilməz');
    return next(err);
  }

  try {
    // Cari employeeType-u al (update-də gəlməyibsə, bazadan oxu)
    let currentEmployeeType = employeeType;
    if (!currentEmployeeType) {
      const docToUpdate = await this.model.findOne(this.getQuery());
      currentEmployeeType = docToUpdate ? docToUpdate.employeeType : 'private';
    }

    // Vergiləri hesabla
    const taxResult = taxCalculationService.calculateAllTaxes(
      gross,
      currentEmployeeType
    );

    // Vergiləri ayır
    let tax, social_pay;

    if (currentEmployeeType === 'state') {
      tax = taxResult.employee.taxes.incomeTax;
      social_pay = taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.ish +
        taxResult.employee.taxes.its;
    } else {
      tax = taxResult.employee.taxes.incomeTax;
      social_pay = taxResult.employee.taxes.dsmf +
        taxResult.employee.taxes.ish +
        taxResult.employee.taxes.its;

      // Əgər gvTax varsa (8000+ üçün)
      if (taxResult.employee.taxes.gvTax) {
        social_pay += taxResult.employee.taxes.gvTax;
      }
    }

    // Update obyektinə vergi dəyərlərini əlavə et
    update.tax = Number(tax.toFixed(2));
    update.social_pay = Number(social_pay.toFixed(2));
    update.Net_salary = Number(taxResult.employee.netSalary.toFixed(2));
    update.salary_status = "pending";

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("Employee", employeeSchema);