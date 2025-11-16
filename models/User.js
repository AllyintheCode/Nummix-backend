import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ===================== 📅 Event və Calendar schema =====================
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },        // Tədbirin adı
  description: { type: String },                  // Tədbirin təsviri
  startTime: { type: String, required: true },    // Başlama vaxtı (məs: 10:00)
  endTime: { type: String, required: true },      // Bitmə vaxtı (məs: 11:30)
  location: { type: String },                     // Tədbir yeri
});

const daySchema = new mongoose.Schema({
  date: { type: Date, required: true },           // Tarix
  dayOfWeek: { type: String },                    // Həftənin günü
  status: {
    type: String,
    enum: ["Workday", "Off day", "Holiday"],      // Gün növü
    default: "Workday",
  },
  events: [eventSchema],                          // Gündəki tədbirlər
  note: { type: String },                         // Əlavə qeydlər
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
    gross_profit: { type: Number },
    Net_profit: { type: Number },
    last_gross_profit: { type: Number },
    last_Net_profit: { type: Number },
    total_assets: { type: Number },
    Obligations_assets: { type: Number },
    expected_taxes: { type: Number },
    vacation: { type: Number },
    Attendance: { type: Number },
    position: { type: Array },
    taxes: { type: String },
    Bonuses: { type: String },
    waiting_request_Graduation: { type: Number },
    active_employee: { type: Number },
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
    January: { type: String, default: 0 },
    February: { type: String, default: 0 },
    March: { type: String, default: 0 },
    April: { type: String, default: 0 },
    May: { type: String, default: 0 },
    June: { type: String, default: 0 },
    July: { type: String, default: 0 },
    August: { type: String, default: 0 },
    September: { type: String, default: 0 },
    October: { type: String, default: 0 },
    November: { type: String, default: 0 },
    December: { type: String, default: 0 },
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
  common_late:{type: Number, default: 0 },
  common_attendance:{type: Number, default: 0 },
  new_employees:{type: Number, default: 0 },
 left_job:{type: Number, default: 0 },
 change_employees:{type: Number, default: 0 },
 Payroll_fund:{type: Number, default: 0 },
 change_Payroll_fund:{type: Number, default: 0 },
 Average_salary:{type: Number, default: 0 },
 change_Average_salary:{type: Number, default: 0 },
 Attendance:{type: Number, default: 0 },
change_Attendance:{type: Number, default: 0 },
Employee_turnover:{type: Number, default: 0 },
change_Employee_turnover:{type: Number, default: 0 },







    // 📅 İstifadəçinin təqvimi (aylıq/günlük plan)
    calendar: [daySchema],
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

// ===================== 🔰 Model Export =====================
const User = mongoose.model("User", userSchema);
export default User;
