import mongoose from "mongoose";

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
  reason :{ type: String },
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
  filename: String,           // Faylın orijinal adı: "document.pdf"
  contentType: String,        // MIME type: "application/pdf"
  data: Buffer,              // Faylın binary məlumatı
  fileSize: Number,    
    originalName: String,      // Orijinal fayl adı

  
  // ===================== 💰 MAAŞ NÖVÜ VƏ ÖDƏNİŞ MƏLUMATLARI =====================
  // İşçi növü (dövlət və ya özəl) - vergi hesablamaları üçün ÇOX VACİB
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
  salary_status: { type: String, default: "pending" }, // "pending", "paid", "cancelled"
  
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
  filename: { type: String },
  contentType: { type: String },
  data: { type: Buffer },
}, 
{ timestamps: true });

export default mongoose.model("Employee", employeeSchema);