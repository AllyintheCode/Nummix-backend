// controllers/userController.js
import {
  User,
  Event,
  Payment,
  EmployeeFlow,
  AccountingEntry,
  AssetCategory,
  Asset,
  ExcelReport,
  PdfReport,
  CategoryReport,
  DepartmentReport
} from "../models/index.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js";
import TaxCalculationService from "../services/taxCalculationService.js";
import AccountingService from "../services/accountingService.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import jwt from "jsonwebtoken";

const OTP_EXPIRE_MIN = 5;

// ===================== 👤 USER AUTH FUNCTIONS =====================

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

    sendEmail(
      email,
      "Nummix OTP Təsdiqləmə",
      `Salam ${fullName},\nSizin OTP kodunuz: ${otpCode}\nBu kod ${OTP_EXPIRE_MIN} dəqiqə ərzində etibarlıdır.`
    ).catch((err) => {
      console.error("Email error:", err.message);
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ OTP təsdiqləmə
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

// ✅ OTP yenidən göndərmə
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
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
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

// ✅ Qorunan profil route
export const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    fullName: req.user.fullName,
    companyName: req.user.companyName,
    email: req.user.email,
  });
};

// ✅ Forgot password
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

// ✅ Refresh token
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

// ✅ Reset password
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

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: "Şifrə uğurla yeniləndi ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Bütün istifadəçiləri getir
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ID ilə istifadəçi getir
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İstifadəçi məlumatlarını yenilə
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
      user.password = req.body.password;
    }

    user.fullName = req.body.fullName ?? user.fullName;
    user.companyName = req.body.companyName ?? user.companyName;
    user.email = req.body.email ?? user.email;

    await user.save();

    res.json({
      _id: use.r_id,
      fullName: user.fullName,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İstifadəçini sil
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

// ===================== 📅 EVENT FUNCTIONS =====================

// ✅ Tədbir əlavə et
export const addEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, date, dayOfWeek, status, note } = req.body;

    const event = await Event.create({
      userId: req.user._id,
      title,
      description,
      startTime,
      endTime,
      location,
      date,
      dayOfWeek,
      status,
      note
    });

    res.status(201).json({
      success: true,
      data: event,
      message: "Tədbir uğurla əlavə edildi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Bütün tədbirləri gətir
export const getEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const events = await Event.find(filter).sort({ date: 1 });

    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Tədbiri yenilə
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    const event = await Event.findOneAndUpdate(
      { _id: eventId, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ message: "Tədbir tapılmadı" });
    }

    res.json({
      success: true,
      data: event,
      message: "Tədbir uğurla yeniləndi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Tədbiri sil
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOneAndDelete({
      _id: eventId,
      userId: req.user._id
    });

    if (!event) {
      return res.status(404).json({ message: "Tədbir tapılmadı" });
    }

    res.json({
      success: true,
      message: "Tədbir uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 💰 PAYMENT FUNCTIONS =====================

// ✅ Ödəniş əlavə et
// ✅ Yeni ödəniş əlavə et (yeni Payment modelinə uyğun)
export const addPayment = async (req, res) => {
  try {
    const { 
      type,           // "outflow" (xərc) və ya "receipt" (gəlir)
      supplierName,   // Təchizatçı/Müştəri adı
      category,       // Kateqoriya (məs: "Əməkhaqqı", "Kommunal", "Ofis ləvazimatları")
      dueDate,        // Son tarix (format: "2024-01-20")
      amount,         // Məbləğ
      currency,       // Valyuta ("AZN", "USD", "RUB", "EUR") - default: "AZN"
      status,         // Status ("planned", "pending", "overdue", "completed") - default: "planned"
      description     // Əlavə təsvir (modeldə yoxdur, əlavə edə bilərsiniz)
    } = req.body;

    // Validation - Modelin tələb etdiyi field-lər
    const requiredFields = ['type', 'supplierName', 'category', 'dueDate', 'amount'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Aşağıdakı field-lər tələb olunur: ${missingFields.join(', ')}`
      });
    }

    // Type validation
    if (!['outflow', 'receipt'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type yalnız "outflow" və ya "receipt" ola bilər'
      });
    }

    // Currency validation
    if (currency && !['AZN', 'USD', 'RUB', 'EUR'].includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'currency yalnız "AZN", "USD", "RUB", "EUR" dəyərlərindən biri ola bilər'
      });
    }

    // Status validation
    if (status && !['planned', 'pending', 'overdue', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status yalnız "planned", "pending", "overdue", "completed" dəyərlərindən biri ola bilər'
      });
    }

    // Əgər status "completed" verilibsə, completedDate əlavə et
    const paymentData = {
      type,
      supplierName,
      category,
      dueDate: new Date(dueDate),
      amount: parseFloat(amount),
      currency: currency || 'AZN',
      status: status || 'planned',
      createdBy: req.user._id,
      // Əlavə field (modelə əlavə etmək istəsəniz)
      ...(description && { description })
    };

    const payment = await Payment.create(paymentData);

    res.status(201).json({
      success: true,
      data: payment,
      message: "Ödəniş uğurla əlavə edildi"
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};


// ✅ Ödənişləri gətir
// ✅ Ödənişləri gətir (yeni modelə uyğun)
export const getPayments = async (req, res) => {
  try {
    const { 
      type,           // outflow və ya receipt
      category,       // kateqoriya
      status,         // planned, pending, overdue, completed
      startDate,      // başlama tarixi
      endDate,        // bitmə tarixi
      currency,       // valyuta
      search,         // supplierName axtarışı
      sortBy = 'dueDate', // sıralama
      sortOrder = 'asc'   // sıralama istiqaməti
    } = req.query;

    const filter = { createdBy: req.user._id };

    // Filterləri tətbiq et
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (currency) filter.currency = currency;
    
    // Tarix filteri
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    // Axtarış filteri
    if (search) {
      filter.supplierName = { $regex: search, $options: 'i' };
    }

    // Sıralama
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .populate('createdBy', 'fullName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalPayments = await Payment.countDocuments(filter);

    // Statistikalar
    const stats = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          outflowTotal: {
            $sum: {
              $cond: [{ $eq: ["$type", "outflow"] }, "$amount", 0]
            }
          },
          receiptTotal: {
            $sum: {
              $cond: [{ $eq: ["$type", "receipt"] }, "$amount", 0]
            }
          },
          byStatus: {
            $push: {
              status: "$status",
              amount: "$amount"
            }
          },
          byCategory: {
            $push: {
              category: "$category",
              amount: "$amount",
              type: "$type"
            }
          }
        }
      }
    ]);

    // Kateqoriya üzrə statistikaları işlə
    const categoryStats = {};
    const statusStats = {};
    
    if (stats.length > 0) {
      stats[0].byCategory.forEach(item => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = {
            outflow: 0,
            receipt: 0,
            total: 0
          };
        }
        categoryStats[item.category][item.type] += item.amount;
        categoryStats[item.category].total += item.amount;
      });

      stats[0].byStatus.forEach(item => {
        if (!statusStats[item.status]) {
          statusStats[item.status] = 0;
        }
        statusStats[item.status] += item.amount;
      });
    }

    const summary = stats[0] ? {
      totalAmount: stats[0].totalAmount,
      outflowTotal: stats[0].outflowTotal,
      receiptTotal: stats[0].receiptTotal,
      netCashFlow: stats[0].receiptTotal - stats[0].outflowTotal,
      categoryStats,
      statusStats,
      count: totalPayments
    } : {
      totalAmount: 0,
      outflowTotal: 0,
      receiptTotal: 0,
      netCashFlow: 0,
      categoryStats: {},
      statusStats: {},
      count: 0
    };

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total: totalPayments,
        pages: Math.ceil(totalPayments / limit)
      },
      summary,
      filters: {
        type,
        category,
        status,
        startDate,
        endDate,
        currency,
        search
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ✅ Ödəniş statusunu yenilə
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!['planned', 'pending', 'overdue', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Yalnız "planned", "pending", "overdue", "completed" statusları dəyişdirilə bilər'
      });
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, createdBy: req.user._id },
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödəniş tapılmadı'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Ödəniş statusu yeniləndi'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Ödəniş məlumatlarını yenilə
export const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const updateData = req.body;

    // Əgər amount yenilənirsə, rəqəmə çevir
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    // Əgər dueDate yenilənirsə, Date obyektinə çevir
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, createdBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödəniş tapılmadı'
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Ödəniş məlumatları yeniləndi'
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Ödənişi sil
export const deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOneAndDelete({
      _id: paymentId,
      createdBy: req.user._id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Ödəniş tapılmadı'
      });
    }

    res.json({
      success: true,
      message: 'Ödəniş uğurla silindi'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===================== 👥 EMPLOYEE FLOW FUNCTIONS =====================

// ✅ İşçi axını qeydi əlavə et
export const addEmployeeFlow = async (req, res) => {
  try {
    const { employeeId, type, date, department, position, reason, notes } = req.body;

    const employeeFlow = await EmployeeFlow.create({
      userId: req.user._id,
      employeeId,
      type,
      date,
      department,
      position,
      reason,
      notes
    });

    res.status(201).json({
      success: true,
      data: employeeFlow,
      message: "İşçi axını qeydi əlavə edildi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi axını qeydlərini gətir
export const getEmployeeFlows = async (req, res) => {
  try {
    const { type, startDate, endDate, employeeId } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const flows = await EmployeeFlow.find(filter)
      .populate('employeeId', 'name email')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: flows,
      count: flows.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📊 ACCOUNTING FUNCTIONS =====================

// ✅ MÜHASİBAT YAZILIŞI ƏLAVƏ ET
export const addAccountingEntry = async (req, res) => {
  try {
    const { accountCode, amount, type, description, documentNumber, date } = req.body;

    const accountInfo = AccountingService.getAccountInfo(accountCode);
    if (!accountInfo) {
      return res.status(400).json({ message: "Yanlış hesab kodu" });
    }

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

    const accountingEntry = await AccountingEntry.create({
      userId: req.user._id,
      accountCode,
      accountName: accountInfo.name,
      amount,
      type,
      description,
      documentNumber,
      date: date || new Date(),
      status: "posted",
    });

    res.status(201).json({
      success: true,
      data: accountingEntry,
      message: "Mühasibat yazılışı uğurla əlavə edildi",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ BÜTÜN MÜHASİBAT YAZILIŞLARINI GƏTİR
export const getAccountingEntries = async (req, res) => {
  try {
    const { startDate, endDate, accountCode, type, status } = req.query;
    const filter = { userId: req.user._id };

    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      filter.date = filter.date || {};
      filter.date.$lte = new Date(endDate);
    }
    if (accountCode) filter.accountCode = accountCode;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const entries = await AccountingEntry.find(filter).sort({ date: -1 });

    const balances = AccountingService.calculateAllBalances(entries);

    res.json({
      success: true,
      data: entries,
      balances: balances.balances,
      summary: balances.summary,
      count: entries.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ MÜHASİBAT YAZILIŞINI SİL
export const deleteAccountingEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const entry = await AccountingEntry.findOneAndDelete({
      _id: entryId,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({ message: "Yazılış tapılmadı" });
    }

    res.json({
      success: true,
      message: "Mühasibat yazılışı uğurla silindi",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 🏢 ASSET CATEGORY FUNCTIONS =====================

// ✅ AssetCategory əlavə et
export const addAssetCategory = async (req, res) => {
  try {
    const { name, description, amortizationRate } = req.body;

    const existingCategory = await AssetCategory.findOne({
      userId: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Bu adla kateqoriya artıq mövcuddur"
      });
    }

    const category = await AssetCategory.create({
      userId: req.user._id,
      name,
      description,
      amortizationRate: amortizationRate || 0,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: category,
      message: "Kateqoriya uğurla əlavə edildi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ AssetCategory-ləri gətir
export const getAssetCategories = async (req, res) => {
  try {
    const { activeOnly = "true", search } = req.query;
    const filter = { userId: req.user._id };

    if (activeOnly === "true") {
      filter.isActive = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const categories = await AssetCategory.find(filter).sort({ name: 1 });

    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const assetCount = await Asset.countDocuments({
          userId: req.user._id,
          category: category.name,
          status: "Aktiv"
        });
        
        const assets = await Asset.find({
          userId: req.user._id,
          category: category.name,
          status: "Aktiv"
        }).limit(5);

        const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

        return {
          ...category.toObject(),
          assetCount,
          totalValue,
          recentAssets: assets.map(asset => ({
            id: asset._id,
            name: asset.name,
            currentValue: asset.currentValue
          }))
        };
      })
    );

    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.isActive).length;
    const totalAssets = await Asset.countDocuments({ userId: req.user._id, status: "Aktiv" });

    res.json({
      success: true,
      data: categoriesWithStats,
      summary: {
        totalCategories,
        activeCategories,
        inactiveCategories: totalCategories - activeCategories,
        totalAssets
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ AssetCategory-i yenilə
export const updateAssetCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const updateData = req.body;

    const category = await AssetCategory.findOneAndUpdate(
      { _id: categoryId, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    if (updateData.name && updateData.name !== category.name) {
      await Asset.updateMany(
        { 
          userId: req.user._id, 
          category: category.name 
        },
        { $set: { category: updateData.name } }
      );
    }

    res.json({
      success: true,
      data: category,
      message: "Kateqoriya uğurla yeniləndi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ AssetCategory-i sil
export const deleteAssetCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const assetsUsingCategory = await Asset.findOne({
      userId: req.user._id,
      categoryId: categoryId,
      status: "Aktiv"
    });

    if (assetsUsingCategory) {
      return res.status(400).json({
        success: false,
        message: "Bu kateqoriya istifadə olunur. Silə bilməzsiniz."
      });
    }

    const category = await AssetCategory.findOneAndUpdate(
      { _id: categoryId, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    res.json({
      success: true,
      message: "Kateqoriya uğurla deaktiv edildi",
      data: category
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Kateqoriya üzrə asset-ləri gətir
export const getAssetsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { status } = req.query;

    const category = await AssetCategory.findOne({
      _id: categoryId,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Kateqoriya tapılmadı" 
      });
    }

    const filter = { 
      userId: req.user._id,
      category: category.name 
    };

    if (status) {
      filter.status = status;
    }

    const assets = await Asset.find(filter).sort({ purchaseDate: -1 });

    const stats = {
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.status === "Aktiv").length,
      totalInitialValue: assets.reduce((sum, a) => sum + a.initialValue, 0),
      totalCurrentValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
      totalAmortization: assets.reduce((sum, a) => sum + a.amortization, 0),
      byStatus: {
        Aktiv: assets.filter(a => a.status === "Aktiv").length,
        Passiv: assets.filter(a => a.status === "Passiv").length,
        "Satılıb": assets.filter(a => a.status === "Satılıb").length,
        "Sıradan çıxıb": assets.filter(a => a.status === "Sıradan çıxıb").length
      }
    };

    res.json({
      success: true,
      category: category,
      data: assets,
      stats: stats,
      count: assets.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📈 ASSET FUNCTIONS =====================

// ✅ Asset əlavə et
export const addAsset = async (req, res) => {
  try {
    const assetData = req.body;

    const asset = await Asset.create({
      userId: req.user._id,
      ...assetData
    });

    res.status(201).json({
      success: true,
      data: asset,
      message: "Əsas vəsait uğurla əlavə edildi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Asset-ləri gətir
export const getAssets = async (req, res) => {
  try {
    const { category, status, location } = req.query;
    const filter = { userId: req.user._id };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = location;

    const assets = await Asset.find(filter).sort({ purchaseDate: -1 });

    const stats = {
      totalAssets: assets.length,
      totalInitialValue: assets.reduce((sum, a) => sum + a.initialValue, 0),
      totalCurrentValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
      totalAmortization: assets.reduce((sum, a) => sum + a.amortization, 0),
      activeAssets: assets.filter(a => a.status === "Aktiv").length
    };

    res.json({
      success: true,
      data: assets,
      stats,
      count: assets.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Asset-i yenilə
export const updateAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const updateData = req.body;

    const asset = await Asset.findOneAndUpdate(
      { _id: assetId, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ message: "Əsas vəsait tapılmadı" });
    }

    res.json({
      success: true,
      data: asset,
      message: "Əsas vəsait uğurla yeniləndi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Vəsait statistikalarını gətir
export const getAssetStatistics = async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user._id });
    const categories = await AssetCategory.find({ userId: req.user._id, isActive: true });

    const activeAssets = assets.filter(a => a.status === "Aktiv");
    const totalInitialValue = activeAssets.reduce((sum, a) => sum + a.initialValue, 0);
    const totalCurrentValue = activeAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalAmortization = activeAssets.reduce((sum, a) => sum + a.amortization, 0);

    const locationStats = {};
    activeAssets.forEach(asset => {
      if (!locationStats[asset.location]) {
        locationStats[asset.location] = {
          count: 0,
          value: 0
        };
      }
      locationStats[asset.location].count++;
      locationStats[asset.location].value += asset.currentValue;
    });

    const categoryStats = {};
    activeAssets.forEach(asset => {
      if (!categoryStats[asset.category]) {
        categoryStats[asset.category] = {
          count: 0,
          value: 0,
          amortization: 0
        };
      }
      categoryStats[asset.category].count++;
      categoryStats[asset.category].value += asset.currentValue;
      categoryStats[asset.category].amortization += asset.amortization;
    });

    const statusStats = {};
    assets.forEach(asset => {
      if (!statusStats[asset.status]) {
        statusStats[asset.status] = 0;
      }
      statusStats[asset.status]++;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalAssets: assets.length,
          activeAssets: activeAssets.length,
          totalInitialValue,
          totalCurrentValue,
          totalAmortization,
          averageAmortizationPercentage: totalInitialValue > 0 
            ? (totalAmortization / totalInitialValue * 100).toFixed(2)
            : 0,
          valueRetention: totalInitialValue > 0 
            ? (totalCurrentValue / totalInitialValue * 100).toFixed(2)
            : 0
        },
        byLocation: Object.entries(locationStats).map(([location, stats]) => ({
          location,
          count: stats.count,
          value: stats.value,
          percentage: totalCurrentValue > 0 
            ? (stats.value / totalCurrentValue * 100).toFixed(2)
            : 0
        })).sort((a, b) => b.value - a.value),
        byCategory: Object.entries(categoryStats).map(([category, stats]) => ({
          category,
          count: stats.count,
          value: stats.value,
          amortization: stats.amortization,
          amortizationPercentage: stats.value > 0 
            ? (stats.amortization / stats.value * 100).toFixed(2)
            : 0
        })).sort((a, b) => b.value - a.value),
        byStatus: Object.entries(statusStats).map(([status, count]) => ({
          status,
          count,
          percentage: assets.length > 0 ? (count / assets.length * 100).toFixed(2) : 0
        })),
        categoryList: categories.map(cat => ({
          id: cat._id,
          name: cat.name,
          description: cat.description,
          amortizationRate: cat.amortizationRate
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Vəsait axtarışı
export const searchAssets = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      location, 
      status,
      minValue, 
      maxValue,
      dateFrom,
      dateTo
    } = req.query;

    const filter = { userId: req.user._id };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { inventoryNumber: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (location) filter.location = location;
    if (status) filter.status = status;
    
    if (minValue || maxValue) {
      filter.currentValue = {};
      if (minValue) filter.currentValue.$gte = parseFloat(minValue);
      if (maxValue) filter.currentValue.$lte = parseFloat(maxValue);
    }

    if (dateFrom || dateTo) {
      filter.purchaseDate = {};
      if (dateFrom) filter.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) filter.purchaseDate.$lte = new Date(dateTo);
    }

    const assets = await Asset.find(filter)
      .sort({ currentValue: -1 })
      .limit(100);

    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    res.json({
      success: true,
      data: assets,
      summary: {
        count: assets.length,
        totalValue,
        averageValue: assets.length > 0 ? (totalValue / assets.length).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📋 CATEGORY REPORT FUNCTIONS =====================

// ✅ Kateqoriya hesabatı yarat
export const createCategoryReport = async (req, res) => {
  try {
    const { title, description, dateFrom, dateTo, categories } = req.body;

    const assetFilter = { userId: req.user._id, status: "Aktiv" };
    
    if (dateFrom && dateTo) {
      assetFilter.purchaseDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    if (categories && categories.length > 0) {
      assetFilter.category = { $in: categories };
    }

    const assets = await Asset.find(assetFilter);

    const categoryMap = new Map();

    assets.forEach((asset) => {
      if (!categoryMap.has(asset.category)) {
        categoryMap.set(asset.category, {
          assetCount: 0,
          initialValue: 0,
          currentValue: 0,
          amortization: 0,
        });
      }

      const category = categoryMap.get(asset.category);
      category.assetCount += 1;
      category.initialValue += asset.initialValue;
      category.currentValue += asset.currentValue;
      category.amortization += asset.amortization;
    });

    const data = Array.from(categoryMap.entries()).map(([category, stats]) => {
      const amortizationPercentage =
        stats.initialValue > 0
          ? (stats.amortization / stats.initialValue) * 100
          : 0;

      return {
        category,
        assetCount: stats.assetCount,
        initialValue: stats.initialValue,
        currentValue: stats.currentValue,
        amortization: stats.amortization,
        amortizationPercentage: Number(amortizationPercentage.toFixed(2)),
      };
    });

    const summary = {
      totalAssets: data.reduce((sum, item) => sum + item.assetCount, 0),
      totalInitialValue: data.reduce((sum, item) => sum + item.initialValue, 0),
      totalCurrentValue: data.reduce((sum, item) => sum + item.currentValue, 0),
      totalAmortization: data.reduce((sum, item) => sum + item.amortization, 0),
      averageAmortizationPercentage:
        data.length > 0
          ? data.reduce((sum, item) => sum + item.amortizationPercentage, 0) /
            data.length
          : 0,
    };

    const report = await CategoryReport.create({
      userId: req.user._id,
      title: title || "Kateqoriya Hesabatı",
      description: description || "Kateqoriyalar üzrə vəsait analizi",
      generatedAt: new Date(),
      data,
      summary,
      filters: {
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        categories: categories || []
      }
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "Kateqoriya hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Kateqoriya hesabatlarını gətir
export const getCategoryReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate) filter.generatedAt = { $gte: new Date(startDate) };
    if (endDate) {
      filter.generatedAt = filter.generatedAt || {};
      filter.generatedAt.$lte = new Date(endDate);
    }

    const reports = await CategoryReport.find(filter).sort({ generatedAt: -1 });

    const summary = {
      totalReports: reports.length,
      totalAssetsCovered: reports.reduce((sum, r) => sum + r.summary.totalAssets, 0),
      totalValueCovered: reports.reduce((sum, r) => sum + r.summary.totalCurrentValue, 0),
      averageAmortization: reports.length > 0 
        ? reports.reduce((sum, r) => sum + r.summary.averageAmortizationPercentage, 0) / reports.length
        : 0
    };

    res.json({
      success: true,
      data: reports,
      summary,
      count: reports.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Kateqoriya hesabatını gətir (ID ilə)
export const getCategoryReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await CategoryReport.findOne({
      _id: reportId,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Hesabat tapılmadı"
      });
    }

    const currentAssets = await Asset.find({
      userId: req.user._id,
      status: "Aktiv"
    });

    const currentCategoryMap = new Map();
    currentAssets.forEach(asset => {
      if (!currentCategoryMap.has(asset.category)) {
        currentCategoryMap.set(asset.category, {
          assetCount: 0,
          currentValue: 0
        });
      }
      const cat = currentCategoryMap.get(asset.category);
      cat.assetCount += 1;
      cat.currentValue += asset.currentValue;
    });

    const comparisonData = report.data.map(item => {
      const current = currentCategoryMap.get(item.category) || { assetCount: 0, currentValue: 0 };
      return {
        ...item.toObject(),
        currentAssetCount: current.assetCount,
        currentValue: current.currentValue,
        assetChange: current.assetCount - item.assetCount,
        valueChange: current.currentValue - item.currentValue,
        valueChangePercentage: item.currentValue > 0 
          ? ((current.currentValue - item.currentValue) / item.currentValue * 100).toFixed(2)
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        ...report.toObject(),
        comparisonData,
        currentSummary: {
          totalAssets: currentAssets.length,
          totalCurrentValue: currentAssets.reduce((sum, a) => sum + a.currentValue, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Kateqoriya hesabatını sil
export const deleteCategoryReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await CategoryReport.findOneAndDelete({
      _id: reportId,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Hesabat tapılmadı"
      });
    }

    res.json({
      success: true,
      message: "Kateqoriya hesabatı uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Real-time kateqoriya hesabatı yarat
export const generateRealTimeCategoryReport = async (req, res) => {
  try {
    const { categories } = req.body;

    const filter = { userId: req.user._id, status: "Aktiv" };
    if (categories && categories.length > 0) {
      filter.category = { $in: categories };
    }

    const assets = await Asset.find(filter);

    const categoryMap = new Map();
    const locationMap = new Map();

    assets.forEach((asset) => {
      if (!categoryMap.has(asset.category)) {
        categoryMap.set(asset.category, {
          assetCount: 0,
          initialValue: 0,
          currentValue: 0,
          amortization: 0,
        });
      }
      const cat = categoryMap.get(asset.category);
      cat.assetCount += 1;
      cat.initialValue += asset.initialValue;
      cat.currentValue += asset.currentValue;
      cat.amortization += asset.amortization;

      if (!locationMap.has(asset.location)) {
        locationMap.set(asset.location, {
          assetCount: 0,
          currentValue: 0,
          categories: new Set()
        });
      }
      const loc = locationMap.get(asset.location);
      loc.assetCount += 1;
      loc.currentValue += asset.currentValue;
      loc.categories.add(asset.category);
    });

    const categoryData = Array.from(categoryMap.entries()).map(([category, stats]) => {
      const amortizationPercentage =
        stats.initialValue > 0
          ? (stats.amortization / stats.initialValue) * 100
          : 0;

      return {
        category,
        assetCount: stats.assetCount,
        initialValue: stats.initialValue,
        currentValue: stats.currentValue,
        amortization: stats.amortization,
        amortizationPercentage: Number(amortizationPercentage.toFixed(2)),
      };
    });

    const locationData = Array.from(locationMap.entries()).map(([location, stats]) => ({
      location,
      assetCount: stats.assetCount,
      currentValue: stats.currentValue,
      categoryCount: stats.categories.size,
      categories: Array.from(stats.categories)
    }));

    const summary = {
      totalAssets: assets.length,
      totalInitialValue: assets.reduce((sum, a) => sum + a.initialValue, 0),
      totalCurrentValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
      totalAmortization: assets.reduce((sum, a) => sum + a.amortization, 0),
      averageAmortizationPercentage:
        assets.length > 0
          ? (assets.reduce((sum, a) => sum + a.amortization, 0) /
             assets.reduce((sum, a) => sum + a.initialValue, 0)) * 100
          : 0,
      uniqueCategories: categoryMap.size,
      uniqueLocations: locationMap.size
    };

    res.json({
      success: true,
      data: {
        categoryData,
        locationData,
        summary,
        generatedAt: new Date()
      },
      message: "Real-time kateqoriya hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 🏢 DEPARTMENT REPORT FUNCTIONS =====================

// ✅ Şöbə hesabatı yarat
export const createDepartmentReport = async (req, res) => {
  try {
    const { title, description, locations, dateFrom, dateTo } = req.body;

    const filter = { userId: req.user._id, status: "Aktiv" };
    
    if (locations && locations.length > 0) {
      filter.location = { $in: locations };
    }
    
    if (dateFrom && dateTo) {
      filter.purchaseDate = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }

    const assets = await Asset.find(filter);

    const locationMap = new Map();
    const categoryMap = new Map();

    assets.forEach((asset) => {
      if (!locationMap.has(asset.location)) {
        locationMap.set(asset.location, {
          assetCount: 0,
          initialValue: 0,
          currentValue: 0,
          categories: new Set()
        });
      }
      const loc = locationMap.get(asset.location);
      loc.assetCount += 1;
      loc.initialValue += asset.initialValue;
      loc.currentValue += asset.currentValue;
      loc.categories.add(asset.category);

      if (!categoryMap.has(asset.category)) {
        categoryMap.set(asset.category, {
          assetCount: 0,
          currentValue: 0,
          locations: new Set()
        });
      }
      const cat = categoryMap.get(asset.category);
      cat.assetCount += 1;
      cat.currentValue += asset.currentValue;
      cat.locations.add(asset.location);
    });

    const data = Array.from(locationMap.entries()).map(([location, stats]) => {
      const percentage = locationMap.size > 0 
        ? (stats.currentValue / Array.from(locationMap.values()).reduce((sum, l) => sum + l.currentValue, 0)) * 100
        : 0;

      return {
        location,
        assetCount: stats.assetCount,
        initialValue: stats.initialValue,
        currentValue: stats.currentValue,
        percentage: Number(percentage.toFixed(2)),
        categories: Array.from(stats.categories)
      };
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      assetCount: stats.assetCount,
      currentValue: stats.currentValue,
      locations: Array.from(stats.locations)
    }));

    const summary = {
      totalAssets: assets.length,
      totalInitialValue: assets.reduce((sum, a) => sum + a.initialValue, 0),
      totalCurrentValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
      uniqueLocations: locationMap.size,
      uniqueCategories: categoryMap.size
    };

    const report = await DepartmentReport.create({
      userId: req.user._id,
      title: title || "Şöbə Hesabatı",
      description: description || "Şöbələr üzrə vəsait analizi",
      generatedAt: new Date(),
      data,
      categoryDistribution,
      summary,
      filters: {
        dateFrom: dateFrom ? new Date(dateFrom) : null,
        dateTo: dateTo ? new Date(dateTo) : null,
        locations: locations || []
      }
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "Şöbə hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Şöbə hesabatlarını gətir
export const getDepartmentReports = async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (location) {
      filter['data.location'] = location;
    }
    
    if (startDate) filter.generatedAt = { $gte: new Date(startDate) };
    if (endDate) {
      filter.generatedAt = filter.generatedAt || {};
      filter.generatedAt.$lte = new Date(endDate);
    }

    const reports = await DepartmentReport.find(filter).sort({ generatedAt: -1 });

    const locationTrends = {};
    reports.forEach(report => {
      report.data.forEach(item => {
        if (!locationTrends[item.location]) {
          locationTrends[item.location] = [];
        }
        locationTrends[item.location].push({
          date: report.generatedAt,
          value: item.currentValue,
          assetCount: item.assetCount
        });
      });
    });

    const summary = {
      totalReports: reports.length,
      locationsCovered: Object.keys(locationTrends).length,
      totalAssetsCovered: reports.reduce((sum, r) => sum + r.summary.totalAssets, 0),
      totalValueCovered: reports.reduce((sum, r) => sum + r.summary.totalCurrentValue, 0)
    };

    res.json({
      success: true,
      data: reports,
      locationTrends,
      summary,
      count: reports.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Şöbə hesabatını gətir (ID ilə)
export const getDepartmentReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await DepartmentReport.findOne({
      _id: reportId,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Hesabat tapılmadı"
      });
    }

    const currentAssets = await Asset.find({
      userId: req.user._id,
      status: "Aktiv"
    });

    const currentLocationMap = new Map();
    currentAssets.forEach(asset => {
      if (!currentLocationMap.has(asset.location)) {
        currentLocationMap.set(asset.location, {
          assetCount: 0,
          currentValue: 0
        });
      }
      const loc = currentLocationMap.get(asset.location);
      loc.assetCount += 1;
      loc.currentValue += asset.currentValue;
    });

    const comparisonData = report.data.map(item => {
      const current = currentLocationMap.get(item.location) || { assetCount: 0, currentValue: 0 };
      return {
        ...item.toObject(),
        currentAssetCount: current.assetCount,
        currentValue: current.currentValue,
        assetChange: current.assetCount - item.assetCount,
        valueChange: current.currentValue - item.currentValue,
        valueChangePercentage: item.currentValue > 0 
          ? ((current.currentValue - item.currentValue) / item.currentValue * 100).toFixed(2)
          : 0
      };
    });

    res.json({
      success: true,
      data: {
        ...report.toObject(),
        comparisonData,
        currentSummary: {
          totalAssets: currentAssets.length,
          totalCurrentValue: currentAssets.reduce((sum, a) => sum + a.currentValue, 0),
          uniqueLocations: currentLocationMap.size
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Şöbə hesabatını sil
export const deleteDepartmentReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await DepartmentReport.findOneAndDelete({
      _id: reportId,
      userId: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Hesabat tapılmadı"
      });
    }

    res.json({
      success: true,
      message: "Şöbə hesabatı uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Real-time şöbə hesabatı
export const generateRealTimeDepartmentReport = async (req, res) => {
  try {
    const { locations } = req.body;

    const filter = { userId: req.user._id, status: "Aktiv" };
    if (locations && locations.length > 0) {
      filter.location = { $in: locations };
    }

    const assets = await Asset.find(filter);

    const locationStats = {};
    const categoryByLocation = {};
    const locationTotals = {
      totalAssets: 0,
      totalValue: 0
    };

    assets.forEach(asset => {
      if (!locationStats[asset.location]) {
        locationStats[asset.location] = {
          assetCount: 0,
          totalValue: 0,
          categories: {}
        };
      }
      
      locationStats[asset.location].assetCount++;
      locationStats[asset.location].totalValue += asset.currentValue;
      locationTotals.totalAssets++;
      locationTotals.totalValue += asset.currentValue;

      if (!locationStats[asset.location].categories[asset.category]) {
        locationStats[asset.location].categories[asset.category] = {
          count: 0,
          value: 0
        };
      }
      locationStats[asset.location].categories[asset.category].count++;
      locationStats[asset.location].categories[asset.category].value += asset.currentValue;

      if (!categoryByLocation[asset.category]) {
        categoryByLocation[asset.category] = {
          totalValue: 0,
          locations: {}
        };
      }
      categoryByLocation[asset.category].totalValue += asset.currentValue;
      
      if (!categoryByLocation[asset.category].locations[asset.location]) {
        categoryByLocation[asset.category].locations[asset.location] = 0;
      }
      categoryByLocation[asset.category].locations[asset.location]++;
    });

    const locationData = Object.entries(locationStats).map(([location, stats]) => ({
      location,
      assetCount: stats.assetCount,
      currentValue: stats.totalValue,
      percentage: locationTotals.totalValue > 0 
        ? (stats.totalValue / locationTotals.totalValue * 100).toFixed(2)
        : 0,
      categories: Object.entries(stats.categories).map(([category, catStats]) => ({
        category,
        count: catStats.count,
        value: catStats.value,
        percentage: stats.totalValue > 0 
          ? (catStats.value / stats.totalValue * 100).toFixed(2)
          : 0
      })).sort((a, b) => b.value - a.value)
    })).sort((a, b) => b.currentValue - a.currentValue);

    const categoryData = Object.entries(categoryByLocation).map(([category, stats]) => ({
      category,
      totalValue: stats.totalValue,
      locationDistribution: Object.entries(stats.locations).map(([location, count]) => ({
        location,
        count,
        percentage: locationTotals.totalAssets > 0 
          ? (count / locationTotals.totalAssets * 100).toFixed(2)
          : 0
      })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => b.totalValue - a.totalValue);

    res.json({
      success: true,
      data: {
        locationData,
        categoryData,
        summary: {
          totalAssets: locationTotals.totalAssets,
          totalValue: locationTotals.totalValue,
          uniqueLocations: Object.keys(locationStats).length,
          uniqueCategories: Object.keys(categoryByLocation).length,
          averageValuePerLocation: Object.keys(locationStats).length > 0 
            ? (locationTotals.totalValue / Object.keys(locationStats).length).toFixed(2)
            : 0,
          averageAssetsPerLocation: Object.keys(locationStats).length > 0 
            ? (locationTotals.totalAssets / Object.keys(locationStats).length).toFixed(1)
            : 0
        },
        generatedAt: new Date()
      },
      message: "Real-time şöbə hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📄 REPORT FUNCTIONS =====================

// ✅ Excel hesabatı yarat
export const createExcelReport = async (req, res) => {
  try {
    const { title, description, reportType, data, summary, filters } = req.body;

    const report = await ExcelReport.create({
      userId: req.user._id,
      title,
      description,
      reportType,
      fileName: `report_${Date.now()}.xlsx`,
      data,
      summary,
      filters,
      generatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "Excel hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ PDF hesabatı yarat
export const createPdfReport = async (req, res) => {
  try {
    const { title, description, reportType } = req.body;

    const report = await PdfReport.create({
      userId: req.user._id,
      title,
      description,
      reportType,
      fileName: `report_${Date.now()}.pdf`,
      generatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "PDF hesabatı uğurla yaradıldı"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 💰 FINANCIAL FUNCTIONS =====================

// ✅ Əməkhaqqı fondu yenilə
// Ən sadə versiya
export const updateSalaryFund = async (req, res) => {
  try {
    const { month, amount } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    // Ay validation
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthIndex = months.findIndex(m => 
      m.toLowerCase() === month.toLowerCase()
    );
    
    if (monthIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Yanlış ay adı. Doğru format: January, February, etc."
      });
    }

    // Əgər field yoxdursa yarat
    if (!user.monthly_total_salary_fund) {
      user.monthly_total_salary_fund = {};
    }

    // Sadəcə maaş fondu yenilə
    user.monthly_total_salary_fund[months[monthIndex]] = parseFloat(amount);
    await user.save();

    res.json({
      success: true,
      message: "Maaş fondu yeniləndi",
      data: {
        month: months[monthIndex],
        amount: user.monthly_total_salary_fund[months[monthIndex]],
        updatedAt: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Şirkət vergilərini yenilə
// ✅ Şirkət vergilərini yenilə (düzəldilmiş versiya)
export const updateCompanyTaxes = async (req, res) => {
  try {
    const { month, dsmf, ish, its } = req.body;
    const { id } = req.params;

    // Validation
    if (!month) {
      return res.status(400).json({ 
        success: false,
        message: "Ay adı tələb olunur" 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "İstifadəçi tapılmadı" 
      });
    }

    // Ay validation
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthIndex = months.findIndex(m => 
      m.toLowerCase() === month.toLowerCase()
    );
    
    if (monthIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Yanlış ay adı. Doğru format: January, February, etc.",
        availableMonths: months
      });
    }

    const normalizedMonth = months[monthIndex];

    // Əgər company_taxes yoxdursa yarat
    if (!user.company_taxes) {
      user.company_taxes = {
        dsmf: {},
        ish: {},
        its: {},
        total_company_taxes: {}
      };
    }

    // Əgər vergi field-ləri yoxdursa yarat
    if (!user.company_taxes.dsmf) user.company_taxes.dsmf = {};
    if (!user.company_taxes.ish) user.company_taxes.ish = {};
    if (!user.company_taxes.its) user.company_taxes.its = {};
    if (!user.company_taxes.total_company_taxes) user.company_taxes.total_company_taxes = {};

    // Vergiləri yenilə
    if (dsmf !== undefined) {
      user.company_taxes.dsmf[normalizedMonth] = parseFloat(dsmf);
    }
    
    if (ish !== undefined) {
      user.company_taxes.ish[normalizedMonth] = parseFloat(ish);
    }
    
    if (its !== undefined) {
      user.company_taxes.its[normalizedMonth] = parseFloat(its);
    }

    // Ümumi vergi hesabla
    const totalDsmf = user.company_taxes.dsmf[normalizedMonth] || 0;
    const totalIsh = user.company_taxes.ish[normalizedMonth] || 0;
    const totalIts = user.company_taxes.its[normalizedMonth] || 0;
    
    user.company_taxes.total_company_taxes[normalizedMonth] = 
      totalDsmf + totalIsh + totalIts;

    await user.save();

    res.json({
      success: true,
      data: {
        month: normalizedMonth,
        dsmf: user.company_taxes.dsmf[normalizedMonth] || 0,
        ish: user.company_taxes.ish[normalizedMonth] || 0,
        its: user.company_taxes.its[normalizedMonth] || 0,
        total: user.company_taxes.total_company_taxes[normalizedMonth] || 0
      },
      message: "Şirkət vergiləri uğurla yeniləndi"
    });
  } catch (error) {
    console.error('Update company taxes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi axını məlumatlarını gətir
export const getEmployeeFlowData = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "monthly_employee_flow"
    );
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const history = await EmployeeFlow.find({ userId: req.params.id })
      .populate('employeeId', 'name email')
      .sort({ date: -1 });

    res.json({
      monthly_stats: user.monthly_employee_flow,
      history: history
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
      if (user.monthly_employee_flow[month]) {
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
    }

    if (employeeData) {
      await EmployeeFlow.create({
        userId: req.params.id,
        ...employeeData
      });
    }

    await user.save();

    const history = await EmployeeFlow.find({ userId: req.params.id })
      .populate('employeeId', 'name email')
      .sort({ date: -1 });

    res.json({
      monthly_stats: user.monthly_employee_flow,
      history: history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Ödəniş ümumi baxışını gətir
export const getPaymentOverview = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "İstifadəçi tapılmadı" });
    }

    const employeePayments = await Payment.find({
      userId: req.params.id,
      paymentFor: "employee"
    }).sort({ paymentDate: -1 });

    const employerPayments = await Payment.find({
      userId: req.params.id,
      paymentFor: "employer"
    }).sort({ paymentDate: -1 });

    const totalEmployeePayments = employeePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalEmployerPayments = employerPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const completedPayments = employeePayments.filter(
      (p) => p.status === "completed"
    ).length;

    res.json({
      summary: {
        total_employee_payments: totalEmployeePayments,
        total_employer_payments: totalEmployerPayments,
        total_payments: totalEmployeePayments + totalEmployerPayments,
        completed_payments: completedPayments,
        pending_payments: employeePayments.length - completedPayments,
        payment_success_rate:
          employeePayments.length > 0
            ? (
                (completedPayments / employeePayments.length) *
                100
              ).toFixed(2)
            : 0,
      },
      current_month: user.current_month_total,
      recent_employee_payments: employeePayments.slice(0, 5),
      recent_employer_payments: employerPayments.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

// ===================== 📈 HELPER FUNCTIONS =====================

// User payment statistikalarını yenilə
const updateUserPaymentStats = async (userId, payment) => {
  const user = await User.findById(userId);
  if (!user) return;

  const month = new Date(payment.forMonth).toLocaleString('en-US', { month: 'long' });
  
  if (payment.paymentFor === "employee") {
    if (!user.employee_payments) user.employee_payments = [];
  }
  
  await user.save();
};

// User employee flow statistikalarını yenilə
const updateUserEmployeeFlowStats = async (userId, flow) => {
  const user = await User.findById(userId);
  if (!user) return;

  const month = new Date(flow.date).toLocaleString('en-US', { month: 'long' });
  
  if (user.monthly_employee_flow && user.monthly_employee_flow[month]) {
    if (flow.type === "hired") {
      user.monthly_employee_flow[month].new_hires += 1;
      user.monthly_employee_flow[month].net_change += 1;
    } else if (flow.type === "terminated" || flow.type === "resigned") {
      const field = flow.type === "terminated" ? "terminations" : "resignations";
      user.monthly_employee_flow[month][field] += 1;
      user.monthly_employee_flow[month].net_change -= 1;
    }
  }
  
  await user.save();
};

// User accounting statistikalarını yenilə
const updateUserAccountingStats = async (userId, entry) => {
  const user = await User.findById(userId);
  if (!user) return;

  const month = new Date(entry.date).toLocaleString("en-US", { month: "long" });
  
  if (user.monthlyAccounting && user.monthlyAccounting[month]) {
    user.monthlyAccounting[month].totalTransactions += 1;
    user.monthlyAccounting[month].totalAmount += entry.amount;
    
    if (entry.type === "debit") {
      user.monthlyAccounting[month].debitTotal += entry.amount;
    } else {
      user.monthlyAccounting[month].creditTotal += entry.amount;
    }
  }
  
  await user.save();
};

// User asset statistikalarını yenilə
const updateUserAssetStats = async (userId) => {
  const assets = await Asset.find({ userId, status: "Aktiv" });
  
  const user = await User.findById(userId);
  if (!user) return;

  user.assetStatistics = {
    totalAssets: assets.length,
    totalInitialValue: assets.reduce((sum, a) => sum + a.initialValue, 0),
    totalCurrentValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
    totalAmortization: assets.reduce((sum, a) => sum + a.amortization, 0),
    activeAssets: assets.length,
    lastUpdated: new Date()
  };

  if (user.assetStatistics.totalInitialValue > 0) {
    user.assetStatistics.averageAmortizationPercentage =
      (user.assetStatistics.totalAmortization /
        user.assetStatistics.totalInitialValue) *
      100;
  }

  await user.save();
};

// Export all functions
export default {
  // Auth functions
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  getProfile,
  forgotPassword,
  refreshAccessToken,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  
  // Event functions
  addEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  
  // Payment functions
  addPayment,
  getPayments,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
  
  // Employee flow functions
  addEmployeeFlow,
  getEmployeeFlows,
  
  // Accounting functions
  addAccountingEntry,
  getAccountingEntries,
  deleteAccountingEntry,
  
  // AssetCategory functions
  addAssetCategory,
  getAssetCategories,
  updateAssetCategory,
  deleteAssetCategory,
  getAssetsByCategory,
  
  // Asset functions
  addAsset,
  getAssets,
  updateAsset,
  getAssetStatistics,
  searchAssets,
  
  // CategoryReport functions
  createCategoryReport,
  getCategoryReports,
  getCategoryReportById,
  deleteCategoryReport,
  generateRealTimeCategoryReport,
  
  // DepartmentReport functions
  createDepartmentReport,
  getDepartmentReports,
  getDepartmentReportById,
  deleteDepartmentReport,
  generateRealTimeDepartmentReport,
  
  // Report functions
  createExcelReport,
  createPdfReport,
  
  // Financial functions
  updateSalaryFund,
  updateCompanyTaxes,
  getEmployeeFlowData,
  updateEmployeeFlowData,
  getPaymentOverview,
  updateFinancialData,
  updateMonthlyData,
  
  // Helper functions
  updateUserPaymentStats,
  updateUserEmployeeFlowStats,
  updateUserAccountingStats,
  updateUserAssetStats
};