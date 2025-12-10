import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const OTP_EXPIRE_MIN = 5; // OTP 5 dəqiqə sonra bitir

// Yeni user qeydiyyatı + OTP göndər
export const registerUser = async (req, res) => {
  try {
    const { fullName, companyName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res
        .status(400)
        .json({ message: "Bu email artıq istifadə olunub" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      fullName,
      companyName,
      email,
      password,
      otp: otpCode,
      otpExpires: new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000),
      isVerified: false,
    });

    await sendEmail(
      email,
      "Nummix OTP Təsdiqləmə",
      `Salam ${fullName},\nSizin OTP kodunuz: ${otpCode}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
    );

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      email: user.email,
      token: generateToken(user._id),
      message:
        "Qeydiyyat uğurla tamamlandı. Emailinizə göndərilən OTP kodunu təsdiqləyin.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OTP təsdiqləmə
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "İstifadəçi tapılmadı." });

    if (user.isVerified)
      return res.status(400).json({ message: "Hesab artıq təsdiqlənib." });
    if (!user.otp || !user.otpExpires)
      return res
        .status(400)
        .json({ message: "OTP mövcud deyil, yenidən göndər." });
    if (user.otpExpires < Date.now())
      return res
        .status(400)
        .json({ message: "OTP müddəti bitib, yenidən göndər." });
    if (user.otp !== otp)
      return res.status(400).json({ message: "OTP yanlışdır." });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Hesab uğurla təsdiqləndi ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// OTP yenidən göndərmə
export const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "İstifadəçi tapılmadı." });
    if (user.isVerified)
      return res.status(400).json({ message: "Hesab artıq təsdiqlənib." });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    user.otpExpires = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
      "Nummix Yeni OTP",
      `Salam ${user.fullName},\nSizin yeni OTP kodunuz: ${otpCode}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
    );

    res.json({ message: "Yeni OTP göndərildi." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User login + login bloklama
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Email və ya şifrə səhvdir" });

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res
        .status(403)
        .json({ message: "Hesab müvəqqəti bloklanıb. Bir az gözləyin." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 dəqiqə blok
        user.failedLoginAttempts = 0;
      }

      await user.save();
      return res.status(401).json({ message: "Email və ya şifrə səhvdir" });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    if (!user.isVerified)
      return res.status(401).json({ message: "Email təsdiqlənməyib." });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Qorunan profil route
export const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    fullName: req.user.fullName,
    companyName: req.user.companyName,
    email: req.user.email,
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    const resetOtp = Math.floor(100000 + Math.random() * 900000);
    user.resetOtp = resetOtp;
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);
    await user.save();

    await sendEmail(
      user.email,
      "Nummix Şifrə Yeniləmə OTP",
      `Salam ${user.fullName},\nŞifrənizi yeniləmək üçün OTP kodunuz: ${resetOtp}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
    );

    res.json({ message: "OTP email-ə göndərildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Reset Password ---
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    if (!user.resetOtp || user.resetOtpExpires < Date.now())
      return res
        .status(400)
        .json({ message: "OTP etibarsız və ya müddəti bitib" });
    if (user.resetOtp != otp)
      return res.status(400).json({ message: "OTP yanlışdır" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: "Şifrə uğurla yeniləndi ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
