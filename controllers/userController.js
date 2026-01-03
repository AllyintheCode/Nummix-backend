import User from "../models/User.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import TaxCalculationService from "../services/taxCalculationService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import jwt from "jsonwebtoken"; // JWT üçün

const OTP_EXPIRE_MIN = 5; // OTP 5 dəqiqə sonra bitir

// ✅ Yeni istifadəçi qeydiyyatı
export const registerUser = async (req, res) => {
  try {
    const { fullName, companyName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Bu email artıq istifadə olunub" });
    }

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

    res.status(201).json({
      _id: user._id,
      email: user.email,
      message: "OTP göndərildi",
    });

    // 👉 email-i background-da göndər (await YOX)
    sendEmail(
      email,
      "Nummix OTP Təsdiqləmə",
      `Salam ${fullName}, OTP: ${otpCode}`
    ).catch((err) => {
      console.error("Email error:", err.message);
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

    try {
      await sendEmail(
        user.email,
        "Nummix Yeni OTP",
        `Salam ${user.fullName},\nSizin yeni OTP kodunuz: ${otpCode}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
      );
      return res.json({ message: "Yeni OTP göndərildi." });
    } catch (emailErr) {
      console.error("Email göndərmə xətası:", emailErr.message);
      return res.status(500).json({ message: "Email göndərilmədi" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ İstifadəçi girişi
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

    // Token-lər
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      email: user.email,
      accessToken,
      refreshToken,
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

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = resetOtp;
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);
    await user.save();

    try {
      await sendEmail(
        user.email,
        "Nummix Şifrə Yeniləmə OTP",
        `Salam ${user.fullName},\nŞifrənizi yeniləmək üçün OTP kodunuz: ${resetOtp}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
      );
      return res.json({ message: "OTP email-ə göndərildi" });
    } catch (emailErr) {
      console.error("Email göndərmə xətası:", emailErr.message);
      return res.status(500).json({ message: "Email göndərilmədi" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Refresh token
export const refreshAccessToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(401).json({ message: "Refresh token tələb olunur" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Refresh token etibarsızdır" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    const newAccessToken = generateAccessToken(user._id);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    if (!user.resetOtp || user.resetOtpExpires < Date.now())
      return res
        .status(400)
        .json({ message: "OTP etibarsız və ya vaxtı bitib" });

    if (user.resetOtp !== otp)
      return res.status(400).json({ message: "OTP yanlışdır" });

    user.password = newPassword; // ⚠️ plain
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    res.json({ message: "Şifrə uğurla yeniləndi ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bütün istifadəçiləri getir
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ID ilə istifadəçi getir
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// İstifadəçi məlumatlarını yenilə
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    if (
      req.user._id.toString() !== user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Siz yalnız öz profilinizi yeniləyə bilərsiniz" });
    }

    if (req.body.password) {
      user.password = req.body.password; // ⚠️ plain
    }

    user.fullName = req.body.fullName ?? user.fullName;
    user.companyName = req.body.companyName ?? user.companyName;
    user.email = req.body.email ?? user.email;

    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// İstifadəçini sil
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    if (req.user._id.toString() === user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Öz hesabınızı silə bilməzsiniz" });
    }

    res.json({ message: "İstifadəçi silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 💰 YENİ VERGİ VƏ ÖDƏNİŞ FUNKSİYALARI =====================

// ✅ Əməkhaqqı fondu yenilə

export const updateSalaryFund = async (req, res) => {
  try {
    const { month, amount } = req.body;

    console.log("🟡 Received month:", month, "Amount:", amount);

    // ✅ User ID yoxlanışı
    if (!req.params.id) {
      return res
        .status(400)
        .json({ message: "İstifadəçi ID-si təqdim edilməyib" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log("🔴 User not found with ID:", req.params.id);
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // ✅ AY YOXLANIŞI
    const validMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const normalizedMonth = validMonths.find(
      (m) => m.toLowerCase() === month.toLowerCase()
    );

    if (!normalizedMonth) {
      return res.status(400).json({
        message: "Yanlış ay adı",
        availableMonths: validMonths,
        receivedMonth: month,
      });
    }

    // ✅ TAXCALCULATION SERVICE İSTİFADƏSİ
    let companyTaxes;
    try {
      companyTaxes = TaxCalculationService.calculateEmployerTaxes(amount);
      console.log("🟢 Tax calculation successful:", companyTaxes);
    } catch (taxError) {
      console.error("🔴 Tax calculation error:", taxError);
      return res.status(500).json({
        message: "Vergi hesablanmasında xəta",
        error: taxError.message,
      });
    }

    // Əgər ay mövcud deyilsə, avtomatik yarat
    if (!user.monthly_total_salary_fund[normalizedMonth]) {
      user.monthly_total_salary_fund[normalizedMonth] = 0;
    }

    // Əməkhaqqı fondu yenilə
    user.monthly_total_salary_fund[normalizedMonth] = amount;

    // Şirkət vergilərini avtomatik hesabla
    user.company_taxes.dsmf[normalizedMonth] = companyTaxes.employerTaxes.dsmf;
    user.company_taxes.ish[normalizedMonth] = companyTaxes.employerTaxes.ish;
    user.company_taxes.its[normalizedMonth] = companyTaxes.employerTaxes.its;
    user.company_taxes.total_company_taxes[normalizedMonth] =
      companyTaxes.totalEmployerTaxes;

    // Cari ay ümumi məlumatları yenilə
    const currentMonth = new Date().toLocaleString("en-US", { month: "long" });
    if (normalizedMonth === currentMonth) {
      user.current_month_total.salary_fund = amount;
      user.current_month_total.company_taxes = companyTaxes.totalEmployerTaxes;
    }

    await user.save();

    console.log("✅ User saved successfully");

    res.json({
      success: true,
      month: normalizedMonth,
      salary_fund: user.monthly_total_salary_fund[normalizedMonth],
      company_taxes: {
        dsmf: user.company_taxes.dsmf[normalizedMonth],
        ish: user.company_taxes.ish[normalizedMonth],
        its: user.company_taxes.its[normalizedMonth],
        total: user.company_taxes.total_company_taxes[normalizedMonth],
      },
      message: "Əməkhaqqı fondu uğurla yeniləndi",
    });
  } catch (error) {
    console.error("🔴 Salary fund update error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};
// ✅ Şirkət vergilərini yenilə
export const updateCompanyTaxes = async (req, res) => {
  try {
    const { month, dsmf, ish, its } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    if (!user.company_taxes.dsmf[month]) {
      return res.status(400).json({ message: "Yanlış ay adı" });
    }

    // Vergiləri yenilə
    user.company_taxes.dsmf[month] = dsmf || user.company_taxes.dsmf[month];
    user.company_taxes.ish[month] = ish || user.company_taxes.ish[month];
    user.company_taxes.its[month] = its || user.company_taxes.its[month];

    // Ümumi vergi hesabla
    user.company_taxes.total_company_taxes[month] =
      user.company_taxes.dsmf[month] +
      user.company_taxes.ish[month] +
      user.company_taxes.its[month];

    await user.save();

    res.json(user.company_taxes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi axını məlumatlarını gətir
export const getEmployeeFlowData = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "monthly_employee_flow employee_flow_history"
    );
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json({
      monthly_stats: user.monthly_employee_flow,
      history: user.employee_flow_history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi axını məlumatlarını yenilə
export const updateEmployeeFlowData = async (req, res) => {
  try {
    const { month, type, count, employeeData } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    if (month && type) {
      // Aylıq statistikaları yenilə
      if (type === "new_hires") {
        user.monthly_employee_flow[month].new_hires += count;
        user.monthly_employee_flow[month].net_change += count;
      } else if (type === "terminations") {
        user.monthly_employee_flow[month].terminations += count;
        user.monthly_employee_flow[month].net_change -= count;
      } else if (type === "resignations") {
        user.monthly_employee_flow[month].resignations += count;
        user.monthly_employee_flow[month].net_change -= count;
      }
    }

    if (employeeData) {
      // Tarixçəyə yeni qeyd əlavə et
      user.employee_flow_history.push(employeeData);
    }

    await user.save();

    res.json({
      monthly_stats: user.monthly_employee_flow,
      history: user.employee_flow_history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Ödəniş ümumi baxışını gətir
export const getPaymentOverview = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "employee_payments employer_payments current_month_total"
    );
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Ödəniş statistikalarını hesabla
    const totalEmployeePayments = user.employee_payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalEmployerPayments = user.employer_payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const completedPayments = user.employee_payments.filter(
      (p) => p.status === "completed"
    ).length;
    const pendingPayments = user.employee_payments.filter(
      (p) => p.status === "pending"
    ).length;

    res.json({
      summary: {
        total_employee_payments: totalEmployeePayments,
        total_employer_payments: totalEmployerPayments,
        total_payments: totalEmployeePayments + totalEmployerPayments,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        payment_success_rate:
          user.employee_payments.length > 0
            ? (
                (completedPayments / user.employee_payments.length) *
                100
              ).toFixed(2)
            : 0,
      },
      current_month: user.current_month_total,
      recent_employee_payments: user.employee_payments.slice(-5).reverse(),
      recent_employer_payments: user.employer_payments.slice(-5).reverse(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📅 MÖVCUD TƏQVİM FUNKSİYALARI =====================

// ✅ Təqvim günü əlavə et
export const addCalendarDay = async (req, res) => {
  try {
    const { date, dayOfWeek, status, events, note } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Eyni tarixli gün varmı yoxla
    const existingDay = user.calendar.find(
      (day) =>
        new Date(day.date).toDateString() === new Date(date).toDateString()
    );

    if (existingDay) {
      return res
        .status(400)
        .json({ message: "Bu tarix üçün gün artıq mövcuddur" });
    }

    user.calendar.push({ date, dayOfWeek, status, events, note });
    await user.save();

    res.json(user.calendar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCalendar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user.calendar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCalendarDayById = async (req, res) => {
  try {
    const { id, dayId } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const calendarDay = user.calendar.id(dayId);
    if (!calendarDay) {
      return res.status(404).json({ message: "Calendar günü tapılmadı" });
    }

    res.json(calendarDay);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Təqvim gününü yenilə
export const updateCalendarDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const dayIndex = user.calendar.id(dayId);
    if (!dayIndex) {
      return res.status(404).json({ message: "Gün tapılmadı" });
    }

    Object.assign(dayIndex, updateData);
    await user.save();

    res.json(user.calendar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Təqvim gününü sil
export const deleteCalendarDay = async (req, res) => {
  try {
    const { dayId } = req.params;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    user.calendar.pull(dayId);
    await user.save();

    res.json({ message: "Gün silindi", calendar: user.calendar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 🎯 MÖVCUD TƏDBİR FUNKSİYALARI =====================

// ✅ Tədbir əlavə et
export const addEvent = async (req, res) => {
  try {
    const { dayId } = req.params;
    const { title, description, startTime, endTime, location } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const day = user.calendar.id(dayId);
    if (!day) {
      return res.status(404).json({ message: "Gün tapılmadı" });
    }

    day.events.push({ title, description, startTime, endTime, location });
    await user.save();

    res.json(day.events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Tədbiri yenilə
export const updateEvent = async (req, res) => {
  try {
    const { dayId, eventId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const day = user.calendar.id(dayId);
    if (!day) {
      return res.status(404).json({ message: "Gün tapılmadı" });
    }

    const event = day.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: "Tədbir tapılmadı" });
    }

    Object.assign(event, updateData);
    await user.save();

    res.json(day.events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Tədbiri sil
export const deleteEvent = async (req, res) => {
  try {
    const { dayId, eventId } = req.params;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const day = user.calendar.id(dayId);
    if (!day) {
      return res.status(404).json({ message: "Gün tapılmadı" });
    }

    day.events.pull(eventId);
    await user.save();

    res.json({ message: "Tədbir silindi", events: day.events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id, dayId, eventId } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const calendarDay = user.calendar.id(dayId);
    if (!calendarDay) {
      return res.status(404).json({ message: "Calendar günü tapılmadı" });
    }

    const event = calendarDay.events.id(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event tapılmadı" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { id, dayId, eventId } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const calendarDay = user.calendar.id(dayId);
    if (!calendarDay) {
      return res.status(404).json({ message: "Calendar günü tapılmadı" });
    }

    res.json(calendarDay.events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 💰 MÖVCUD MALİYYƏ FUNKSİYALARI =====================

// ✅ Maliyyə məlumatlarını yenilə
export const updateFinancialData = async (req, res) => {
  try {
    const financialData = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, financialData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Aylıq məlumatları yenilə
export const updateMonthlyData = async (req, res) => {
  try {
    const { month, dataType, value } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Aylıq məlumatları yenilə
    if (user[dataType] && user[dataType][month] !== undefined) {
      user[dataType][month] = value;
      await user.save();
    } else {
      return res.status(400).json({ message: "Yanlış data tipi və ya ay" });
    }

    res.json(user[dataType]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import AccountingService from "../services/accountingService.js";

// ✅ MÜHASİBAT YAZILIŞI ƏLAVƏ ET
export const addAccountingEntry = async (req, res) => {
  try {
    const { accountCode, amount, type, description, documentNumber, date } =
      req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Hesab məlumatlarını al
    const accountInfo = AccountingService.getAccountInfo(accountCode);
    if (!accountInfo) {
      return res.status(400).json({ message: "Yanlış hesab kodu" });
    }

    // Validation
    const validation = AccountingService.validateAccountingEntry({
      accountCode,
      amount,
      type,
      documentNumber,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Validation xətası",
        errors: validation.errors,
      });
    }

    const newEntry = {
      accountCode,
      accountName: accountInfo.name,
      amount,
      type,
      description,
      documentNumber,
      date: date || new Date(),
      status: "posted",
    };

    user.accountingEntries.push(newEntry);

    // Aylıq statistikaları yenilə
    user.updateMonthlyAccounting(newEntry);

    await user.save();

    res.status(201).json({
      success: true,
      data: newEntry,
      message: "Mühasibat yazılışı uğurla əlavə edildi",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ BÜTÜN MÜHASİBAT YAZILIŞLARINI GƏTİR
export const getAccountingEntries = async (req, res) => {
  try {
    const { startDate, endDate, accountCode, type } = req.query;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    let entries = user.accountingEntries;

    // Filterləmə
    if (startDate) {
      entries = entries.filter(
        (entry) => new Date(entry.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      entries = entries.filter(
        (entry) => new Date(entry.date) <= new Date(endDate)
      );
    }
    if (accountCode) {
      entries = entries.filter((entry) => entry.accountCode === accountCode);
    }
    if (type) {
      entries = entries.filter((entry) => entry.type === type);
    }

    // Sıralama (ən yeni üstə)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ MÜHASİBAT BALANSLARINI GƏTİR
export const getAccountingBalances = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    // Balansları yenilə
    user.updateAccountingBalances();
    await user.save();

    const balances = AccountingService.calculateAllBalances(
      user.accountingEntries
    );

    res.json({
      success: true,
      data: {
        balances: balances.balances,
        summary: balances.summary,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ HESAB KODU ÜZRƏ BALANS GƏTİR
export const getAccountBalance = async (req, res) => {
  try {
    const { accountCode } = req.params;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const accountInfo = AccountingService.getAccountInfo(accountCode);
    if (!accountInfo) {
      return res.status(404).json({ message: "Hesab kodu tapılmadı" });
    }

    const balance = AccountingService.calculateAccountBalance(
      user.accountingEntries,
      accountCode
    );

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ MÜHASİBAT HESABATI YARAT
export const generateAccountingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const report = AccountingService.generateAccountingReport(
      user.accountingEntries,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NÜMUNƏ MÜHASİBAT ƏMƏLİYYATI YARAT
export const createSampleAccountingTransaction = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const sampleEntries = AccountingService.createSampleTransaction();

    sampleEntries.forEach((entry) => {
      user.accountingEntries.push(entry);
      user.updateMonthlyAccounting(entry);
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: sampleEntries,
      message: "Nümunə mühasibat əməliyyatı uğurla yaradıldı",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ MÜHASİBAT YAZILIŞINI SİL
export const deleteAccountingEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const entryIndex = user.accountingEntries.findIndex(
      (entry) => entry._id.toString() === entryId
    );
    if (entryIndex === -1) {
      return res.status(404).json({ message: "Yazılış tapılmadı" });
    }

    user.accountingEntries.splice(entryIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Mühasibat yazılışı uğurla silindi",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ MÜHASİBAT YAZILIŞINI YENİLƏ
export const updateAccountingEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const entry = user.accountingEntries.id(entryId);
    if (!entry) {
      return res.status(404).json({ message: "Yazılış tapılmadı" });
    }

    Object.assign(entry, updateData);
    await user.save();

    res.json({
      success: true,
      data: entry,
      message: "Mühasibat yazılışı uğurla yeniləndi",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// controllers/companyFileController.js
import multer from "multer";
import CompanyFile from "../models/companyFileModel.js";

// Multer konfiqurasiyası
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Destəklənməyən fayl formatı"), false);
    }
  },
});

// ✅ ŞİRKƏT ÜÇÜN FAYL YÜKLƏMƏ - DÜZƏLİŞ EDİLMİŞ VERSİYA
export const uploadCompanyFile = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { title, description, category, visibleTo, departments, tags } =
      req.body;

    // uploadedBy-i düzəldirik
    let uploadedBy = "system";
    if (req.user && req.user.id) {
      uploadedBy = req.user.id;
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Fayl seçilməyib",
      });
    }

    // Category və visibleTo dəyərlərini validate edirik
    const validCategories = [
      "document",
      "policy",
      "report",
      "training",
      "template",
      "other",
    ];
    const validVisibleTo = ["all", "departments", "managers"];

    const finalCategory = validCategories.includes(category)
      ? category
      : "document";
    const finalVisibleTo = validVisibleTo.includes(visibleTo)
      ? visibleTo
      : "all";

    // Yeni fayl yaradırıq
    const companyFile = new CompanyFile({
      companyId,
      title: title || req.file.originalname,
      description: description || "",
      category: finalCategory,

      filename: req.file.originalname,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      fileSize: req.file.size,

      uploadedBy,
      visibleTo: finalVisibleTo,
      departments: departments
        ? Array.isArray(departments)
          ? departments
          : [departments]
        : [],
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim())
        : [],
    });

    await companyFile.save();

    res.status(201).json({
      success: true,
      message: "Fayl şirkət üçün uğurla yükləndi",
      data: {
        fileId: companyFile._id,
        title: companyFile.title,
        filename: companyFile.filename,
        originalName: companyFile.originalName,
        contentType: companyFile.contentType,
        fileSize: companyFile.fileSize,
        category: companyFile.category,
        visibleTo: companyFile.visibleTo,
        uploadedAt: companyFile.createdAt,
        downloadUrl: `/api/company/${companyId}/files/${companyFile._id}/download`,
        previewUrl: `/api/company/${companyId}/files/${companyFile._id}/view`,
      },
    });
  } catch (error) {
    console.error("Upload xətası:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ ŞİRKƏTİN BÜTÜN FAYLLARINI LİST ETMƏK (DÜZƏLİŞ EDİLMİŞ)
export const getCompanyFiles = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { category, search, page = 1, limit = 20 } = req.query;

    const employeeId = req.user?.id;
    const employeeDepartment = req.user?.department;

    // Filter yaradırıq
    let filter = {
      companyId,
      isActive: true,
    };

    if (
      category &&
      [
        "document",
        "policy",
        "report",
        "training",
        "template",
        "other",
      ].includes(category)
    ) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Bütün faylları getir
    const files = await CompanyFile.find(filter)
      .select("-data") // Fayl datalarını çıxarırıq (performans)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // İşçinin görə biləcəyi faylları filter et
    const accessibleFiles = files.filter((file) => {
      if (file.visibleTo === "all") return true;
      if (file.visibleTo === "managers") {
        // Manager yoxlaması
        return req.user?.role === "manager" || req.user?.role === "admin";
      }
      if (file.visibleTo === "departments") {
        return file.departments.includes(employeeDepartment);
      }
      return false;
    });

    // Total say
    const total = await CompanyFile.countDocuments(filter);

    res.json({
      success: true,
      data: accessibleFiles.map((file) => ({
        _id: file._id,
        title: file.title,
        description: file.description,
        category: file.category,
        filename: file.filename,
        originalName: file.originalName,
        contentType: file.contentType,
        fileSize: file.fileSize,
        uploadedBy: file.uploadedBy,
        visibleTo: file.visibleTo,
        departments: file.departments,
        downloadCount: file.downloadCount,
        createdAt: file.createdAt,
        downloadUrl: `/api/company/${companyId}/files/${file._id}/download`,
        previewUrl: `/api/company/${companyId}/files/${file._id}/view`,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ ŞİRKƏT FAYLINI DOWNLOAD ETMƏK (DÜZƏLİŞ EDİLMİŞ)
export const downloadCompanyFile = async (req, res) => {
  try {
    const { companyId, fileId } = req.params;

    // Faylı tap
    const file = await CompanyFile.findOne({
      _id: fileId,
      companyId,
      isActive: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Fayl tapılmadı",
      });
    }

    // İşçinin bu faylı görə biləcəyini yoxla
    const hasAccess = checkFileAccess(file, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu fayla giriş icazəniz yoxdur",
      });
    }

    // Download sayını artır
    file.downloadCount += 1;
    file.lastDownloaded = new Date();
    await file.save();

    // Response header-larını təyin et
    const filename = encodeURIComponent(file.originalName || file.filename);

    res.set({
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": file.fileSize,
    });

    // Buffer məlumatını göndər
    res.send(file.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ FAYL ACCESS YOXLAMA FUNKSİYASI (DÜZƏLİŞ EDİLMİŞ)
// BU FUNKSİYANIN İÇİNİ DƏYİŞDİRƏK:
const checkFileAccess = (file, user) => {
  // Əgər user yoxdursa, default olaraq true qaytar (test üçün)
  if (!user) {
    return true; // TEST ÜÇÜN TRUE QAYTARIRIQ
  }

  // Admin hər şeyə baxa bilər
  if (user.role === "admin" || user.role === "company_admin") {
    return true;
  }

  // Normal işçilər üçün access qaydaları
  switch (file.visibleTo) {
    case "all":
      return true;

    case "managers":
      return user.role === "manager" || user.role === "supervisor";

    case "departments":
      return (
        file.departments.includes(user.department) ||
        file.departments.length === 0
      );

    default:
      return false;
  }
};

// ✅ ŞİRKƏT FAYLINI SİLMƏK
export const deleteCompanyFile = async (req, res) => {
  try {
    const { companyId, fileId } = req.params;

    // Soft delete - isActive false edirik
    const file = await CompanyFile.findOneAndUpdate(
      {
        _id: fileId,
        companyId,
      },
      {
        isActive: false,
      },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Fayl tapılmadı",
      });
    }

    res.json({
      success: true,
      message: "Fayl uğurla silindi",
      data: {
        fileId: file._id,
        title: file.title,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ ŞİRKƏT FAYLINI PREVIEW ETMƏK
export const viewCompanyFile = async (req, res) => {
  try {
    const { companyId, fileId } = req.params;

    const file = await CompanyFile.findOne({
      _id: fileId,
      companyId,
      isActive: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "Fayl tapılmadı",
      });
    }

    // Access yoxlaması
    const hasAccess = checkFileAccess(file, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Bu fayla giriş icazəniz yoxdur",
      });
    }

    // Content-Type'ı təyin et
    res.set("Content-Type", file.contentType);

    // PDF və şəkillər üçün preview, digərləri üçün download
    if (
      file.contentType.startsWith("image/") ||
      file.contentType === "application/pdf"
    ) {
      res.set(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(file.originalName)}"`
      );
    } else {
      res.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.originalName)}"`
      );
    }

    res.send(file.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
