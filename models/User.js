import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Digər user xüsusiyyətləri...
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
    
    // Cəmi və statistika sahələri burada qala bilər
    current_month_total: {
      salary_fund: { type: Number, default: 0 },
      company_taxes: { type: Number, default: 0 },
      employee_count: { type: Number, default: 0 },
    },
    
    // Digər statistika sahələri...
    
    // Artıq köhnə array-ları çıxardıq, sadəcə cəmi məlumatlar qalır
  },
  { timestamps: true }
);

// Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;