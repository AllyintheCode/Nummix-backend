// routes/users.js
import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  verifyOtp,
  resendOtp,
  forgotPassword,
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
  calculateCompanyTaxes,
  calculateCompanyTaxesFromEmployees,
  getCompanyTaxStatistics,

  // Auth function
  refreshAccessToken,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import { loginLimiter, otpLimiter } from "../middlewares/rateLimit.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: İstifadəçi qeydiyyatı və giriş əməliyyatları
 *   - name: Users
 *     description: İstifadəçi CRUD əməliyyatları
 */

// ===================== 🔐 AUTH ROUTES =====================

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Yeni istifadəçi qeydiyyatı
 *     tags: [Authentication]
 *     description: Sistemə yeni istifadəçi əlavə edir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Əli Məmmədov"
 *               companyName:
 *                 type: string
 *                 example: "Şirkət MMC"
 *               email:
 *                 type: string
 *                 example: "eli@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: İstifadəçi uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Yanlış məlumat göndərildi
 *       500:
 *         description: Daxili server xətası
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: İstifadəçi girişi
 *     tags: [Authentication]
 *     description: İstifadəçi sistəmə giriş edir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "eli@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Uğurlu giriş
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 companyName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Giriş məlumatları yanlış
 *       500:
 *         description: Daxili server xətası
 */
router.post("/login", loginLimiter, loginUser);

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: OTP təsdiqi
 *     tags: [Authentication]
 *     description: İstifadəçi göndərilən OTP-ni təsdiqləyir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - otp
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64ab12c3d4ef567890123456"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Hesab uğurla təsdiqləndi
 *       400:
 *         description: OTP və ya istifadəçi vəziyyəti ilə bağlı səhv
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/verify-otp", otpLimiter, verifyOtp);

/**
 * @swagger
 * /api/users/resend-otp:
 *   post:
 *     summary: Yeni OTP göndərmək
 *     tags: [Authentication]
 *     description: İstifadəçi üçün yeni OTP kodu yaradır və email vasitəsilə göndərir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "64ab12c3d4ef567890123456"
 *     responses:
 *       200:
 *         description: Yeni OTP uğurla göndərildi
 *       400:
 *         description: Hesab artıq təsdiqlənib
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/resend-otp", otpLimiter, resendOtp);

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Şifrəni unutmuş istifadəçi üçün OTP göndərmək
 *     tags: [Authentication]
 *     description: İstifadəçinin email ünvanına şifrə yeniləmə üçün OTP göndərir
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP email-ə uğurla göndərildi
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Şifrəni yeniləmək
 *     tags: [Authentication]
 *     description: İstifadəçi email və OTP təqdim edərək şifrəsini yeniləyə bilər
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "YeniParol123"
 *     responses:
 *       200:
 *         description: Şifrə uğurla yeniləndi
 *       400:
 *         description: OTP etibarsız və ya müddəti bitib
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/users/refresh-token:
 *   post:
 *     summary: Refresh token ilə yeni access token əldə etmək
 *     tags: [Authentication]
 *     description: İstifadəçi refresh token təqdim edərək yeni access token ala bilər
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Yeni access token uğurla yaradıldı
 *       401:
 *         description: Token düzgün deyil və ya təqdim edilməyib
 *       403:
 *         description: Refresh token etibarsız və ya vaxtı bitib
 *       500:
 *         description: Daxili server xətası
 */
router.post("/refresh-token", refreshAccessToken);

// ===================== 👥 USER CRUD ROUTES =====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Bütün istifadəçiləri gətir
 *     tags: [Users]
 *     description: Sistemdəki bütün istifadəçilərin siyahısını qaytarır
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: İstifadəçi siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   companyName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   isVerified:
 *                     type: boolean
 *       500:
 *         description: Daxili server xətası
 */
router.get("/", protect, getAllUsers);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: İstifadəçi profili
 *     tags: [Users]
 *     description: Aktiv token ilə istifadəçi öz profil məlumatlarını əldə edə bilər
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil məlumatları uğurla qaytarıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 companyName:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Token etibarsız və ya daxil edilməyib
 *       500:
 *         description: Daxili server xətası
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ID-ə görə istifadəçi məlumatı
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi ID-si
 *     responses:
 *       200:
 *         description: İstifadəçi məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 companyName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   put:
 *     summary: İstifadəçi məlumatlarını yenilə
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: İstifadəçi uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 fullName:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Yanlış sorğu
 *       403:
 *         description: İcazə yoxdur
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: İstifadəçi sil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi ID-si
 *     responses:
 *       200:
 *         description: İstifadəçi uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: İcazə yoxdur
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */

router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

// ===================== 📅 EVENT ROUTES =====================

/**
 * @swagger
 * /api/users/events:
 *   post:
 *     summary: Yeni tədbir əlavə et
 *     tags: [Events]
 *     description: İstifadəçi üçün yeni tədbir yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Müşavirə"
 *               description:
 *                 type: string
 *                 example: "Aylıq müşavirə"
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *               location:
 *                 type: string
 *                 example: "Baş ofis"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *               dayOfWeek:
 *                 type: string
 *                 example: "Saturday"
 *               status:
 *                 type: string
 *                 enum: [Workday, Off day, Holiday]
 *                 example: "Workday"
 *               note:
 *                 type: string
 *                 example: "Vacib müşavirə"
 *     responses:
 *       201:
 *         description: Tədbir uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün tədbirləri gətir
 *     tags: [Events]
 *     description: İstifadəçinin bütün tədbirlərini qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *     responses:
 *       200:
 *         description: Tədbirlər siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/events", protect, addEvent);
router.get("/events", protect, getEvents);

/**
 * @swagger
 * /api/users/events/{eventId}:
 *   put:
 *     summary: Tədbiri yenilə
 *     tags: [Events]
 *     description: Müəyyən edilmiş tədbirin məlumatlarını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Tədbir ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tədbir uğurla yeniləndi
 *       404:
 *         description: Tədbir tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: Tədbiri sil
 *     tags: [Events]
 *     description: Müəyyən edilmiş tədbiri silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Tədbir ID-si
 *     responses:
 *       200:
 *         description: Tədbir uğurla silindi
 *       404:
 *         description: Tədbir tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/events/:eventId", protect, updateEvent);
router.delete("/events/:eventId", protect, deleteEvent);

// ===================== 🏢 MÜƏSSİSƏ VERGİ ROUTES =====================

/**
 * @swagger
 * /api/users/{id}/calculate-company-taxes:
 *   post:
 *     summary: Şirkət vergilərini avtomatik hesabla
 *     tags: [Financial]
 *     description: Maaş fondu əsasında şirkət vergilərini avtomatik hesablayır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi (şirkət) ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *             properties:
 *               month:
 *                 type: string
 *                 example: "January"
 *     responses:
 *       200:
 *         description: Şirkət vergiləri uğurla hesablandı
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/:id/calculate-company-taxes", protect, calculateCompanyTaxes);

/**
 * @swagger
 * /api/users/{id}/calculate-taxes-from-employees:
 *   post:
 *     summary: İşçilərdən şirkət vergilərini hesabla
 *     tags: [Financial]
 *     description: Bütün işçilərin maaşları əsasında şirkət vergilərini hesablayır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi (şirkət) ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *             properties:
 *               month:
 *                 type: string
 *                 example: "January"
 *     responses:
 *       200:
 *         description: İşçilərdən vergilər uğurla hesablandı
 *       404:
 *         description: İşçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.post(
  "/:id/calculate-taxes-from-employees",
  protect,
  calculateCompanyTaxesFromEmployees,
);

/**
 * @swagger
 * /api/users/{id}/tax-statistics:
 *   get:
 *     summary: Müəssisə vergi statistikaları
 *     tags: [Financial]
 *     description: Müəssisənin illik vergi statistikalarını gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi (şirkət) ID-si
 *       - name: year
 *         in: query
 *         schema:
 *           type: string
 *         description: İl (məs: 2024)
 *     responses:
 *       200:
 *         description: Vergi statistikaları uğurla gətirildi
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id/tax-statistics", protect, getCompanyTaxStatistics);

// ===================== 💰 PAYMENT ROUTES =====================

/**
 * @swagger
 * /api/users/payments:
 *   post:
 *     summary: Yeni ödəniş əlavə et
 *     tags: [Payments]
 *     description: İstifadəçi üçün yeni ödəniş yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentType
 *               - amount
 *               - paymentDate
 *               - forMonth
 *             properties:
 *               paymentType:
 *                 type: string
 *                 enum: [salary, social_insurance, income_tax, its, ish, gv]
 *                 example: "salary"
 *               amount:
 *                 type: number
 *                 example: 1500
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               forMonth:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               description:
 *                 type: string
 *                 example: "Yanvar ayı əməkhaqqı"
 *               paymentFor:
 *                 type: string
 *                 enum: [employee, employer]
 *                 example: "employee"
 *     responses:
 *       201:
 *         description: Ödəniş uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün ödənişləri gətir
 *     tags: [Payments]
 *     description: İstifadəçinin bütün ödənişlərini qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentFor
 *         in: query
 *         schema:
 *           type: string
 *           enum: [employee, employer]
 *         description: Ödəniş növü
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Status
 *     responses:
 *       200:
 *         description: Ödənişlər siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/payments", protect, addPayment);
router.get("/payments", protect, getPayments);

/**
 * @swagger
 * /api/users/payments/{paymentId}/status:
 *   put:
 *     summary: Ödəniş statusunu yenilə
 *     tags: [Payments]
 *     description: Müəyyən edilmiş ödənişin statusunu yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Ödəniş ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, pending, overdue, completed]
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Ödəniş statusu uğurla yeniləndi
 *       400:
 *         description: Yanlış status dəyəri
 *       404:
 *         description: Ödəniş tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/payments/:paymentId/status", protect, updatePaymentStatus);

/**
 * @swagger
 * /api/users/payments/{paymentId}:
 *   put:
 *     summary: Ödəniş məlumatlarını yenilə
 *     tags: [Payments]
 *     description: Müəyyən edilmiş ödənişin məlumatlarını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Ödəniş ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplierName:
 *                 type: string
 *                 example: "Example Supplier"
 *               category:
 *                 type: string
 *                 example: "Əməkhaqqı"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-20"
 *               amount:
 *                 type: number
 *                 example: 1500
 *               currency:
 *                 type: string
 *                 enum: [AZN, USD, RUB, EUR]
 *                 example: "AZN"
 *               status:
 *                 type: string
 *                 enum: [planned, pending, overdue, completed]
 *                 example: "pending"
 *     responses:
 *       200:
 *         description: Ödəniş məlumatları uğurla yeniləndi
 *       404:
 *         description: Ödəniş tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: Ödənişi sil
 *     tags: [Payments]
 *     description: Müəyyən edilmiş ödənişi silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: paymentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Ödəniş ID-si
 *     responses:
 *       200:
 *         description: Ödəniş uğurla silindi
 *       404:
 *         description: Ödəniş tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/payments/:paymentId", protect, updatePayment);
router.delete("/payments/:paymentId", protect, deletePayment);

// ===================== 👥 EMPLOYEE FLOW ROUTES =====================

/**
 * @swagger
 * /api/users/employee-flows:
 *   post:
 *     summary: Yeni işçi axını qeydi əlavə et
 *     tags: [Employee Flow]
 *     description: İstifadəçi üçün yeni işçi axını qeydi yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - type
 *               - date
 *             properties:
 *               employeeId:
 *                 type: string
 *                 example: "64ab12c3d4ef567890123456"
 *               type:
 *                 type: string
 *                 enum: [hired, terminated, resigned]
 *                 example: "hired"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               department:
 *                 type: string
 *                 example: "IT"
 *               position:
 *                 type: string
 *                 example: "Developer"
 *               reason:
 *                 type: string
 *                 example: "Yeni işçi"
 *               notes:
 *                 type: string
 *                 example: "3 illik təcrübə"
 *     responses:
 *       201:
 *         description: İşçi axını qeydi uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün işçi axını qeydlərini gətir
 *     tags: [Employee Flow]
 *     description: İstifadəçinin bütün işçi axını qeydlərini qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [hired, terminated, resigned]
 *         description: Axın növü
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *       - name: employeeId
 *         in: query
 *         schema:
 *           type: string
 *         description: İşçi ID-si
 *     responses:
 *       200:
 *         description: İşçi axını qeydləri siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/employee-flows", protect, addEmployeeFlow);
router.get("/employee-flows", protect, getEmployeeFlows);

// ===================== 📊 ACCOUNTING ROUTES =====================

/**
 * @swagger
 * /api/users/accounting-entries:
 *   post:
 *     summary: Yeni mühasibat yazılışı əlavə et
 *     tags: [Accounting]
 *     description: İstifadəçi üçün yeni mühasibat yazılışı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountCode
 *               - amount
 *               - type
 *               - description
 *               - documentNumber
 *             properties:
 *               accountCode:
 *                 type: string
 *                 enum: [543, 531, 533, 535]
 *                 example: "543"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               type:
 *                 type: string
 *                 enum: [debit, credit]
 *                 example: "debit"
 *               description:
 *                 type: string
 *                 example: "Ofis ləvazimatları"
 *               documentNumber:
 *                 type: string
 *                 example: "INV-2024-001"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *     responses:
 *       201:
 *         description: Mühasibat yazılışı uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün mühasibat yazılışlarını gətir
 *     tags: [Accounting]
 *     description: İstifadəçinin bütün mühasibat yazılışlarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *       - name: accountCode
 *         in: query
 *         schema:
 *           type: string
 *         description: Hesab kodu
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [debit, credit]
 *         description: Əməliyyat növü
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [draft, posted, cancelled]
 *         description: Status
 *     responses:
 *       200:
 *         description: Mühasibat yazılışları siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/accounting-entries", protect, addAccountingEntry);
router.get("/accounting-entries", protect, getAccountingEntries);

/**
 * @swagger
 * /api/users/accounting-entries/{entryId}:
 *   delete:
 *     summary: Mühasibat yazılışını sil
 *     tags: [Accounting]
 *     description: Müəyyən edilmiş mühasibat yazılışını silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: entryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Yazılış ID-si
 *     responses:
 *       200:
 *         description: Yazılış uğurla silindi
 *       404:
 *         description: Yazılış tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.delete("/accounting-entries/:entryId", protect, deleteAccountingEntry);

// ===================== 🏢 ASSET CATEGORY ROUTES =====================

/**
 * @swagger
 * /api/users/asset-categories:
 *   post:
 *     summary: Yeni vəsait kateqoriyası əlavə et
 *     tags: [Asset Categories]
 *     description: İstifadəçi üçün yeni vəsait kateqoriyası yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Komputer avadanlıqları"
 *               description:
 *                 type: string
 *                 example: "Komputer və periferik cihazlar"
 *               amortizationRate:
 *                 type: number
 *                 example: 20
 *     responses:
 *       201:
 *         description: Kateqoriya uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün vəsait kateqoriyalarını gətir
 *     tags: [Asset Categories]
 *     description: İstifadəçinin bütün vəsait kateqoriyalarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: activeOnly
 *         in: query
 *         schema:
 *           type: string
 *           default: "true"
 *         description: Yalnız aktiv kateqoriyalar
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Axtarış sözü
 *     responses:
 *       200:
 *         description: Kateqoriyalar siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/asset-categories", protect, addAssetCategory);
router.get("/asset-categories", protect, getAssetCategories);

/**
 * @swagger
 * /api/users/asset-categories/{categoryId}:
 *   put:
 *     summary: Vəsait kateqoriyasını yenilə
 *     tags: [Asset Categories]
 *     description: Müəyyən edilmiş vəsait kateqoriyasını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Kateqoriya ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amortizationRate:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla yeniləndi
 *       404:
 *         description: Kateqoriya tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: Vəsait kateqoriyasını sil
 *     tags: [Asset Categories]
 *     description: Müəyyən edilmiş vəsait kateqoriyasını silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Kateqoriya ID-si
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla silindi
 *       404:
 *         description: Kateqoriya tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/asset-categories/:categoryId", protect, updateAssetCategory);
router.delete("/asset-categories/:categoryId", protect, deleteAssetCategory);

/**
 * @swagger
 * /api/users/asset-categories/{categoryId}/assets:
 *   get:
 *     summary: Kateqoriya üzrə vəsaitləri gətir
 *     tags: [Asset Categories]
 *     description: Müəyyən edilmiş kateqoriya üzrə bütün vəsaitləri qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Kateqoriya ID-si
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Vəsait statusu
 *     responses:
 *       200:
 *         description: Vəsaitlər siyahısı
 *       404:
 *         description: Kateqoriya tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get(
  "/asset-categories/:categoryId/assets",
  protect,
  getAssetsByCategory,
);

// ===================== 📈 ASSET ROUTES =====================

/**
 * @swagger
 * /api/users/assets:
 *   post:
 *     summary: Yeni vəsait əlavə et
 *     tags: [Assets]
 *     description: İstifadəçi üçün yeni vəsait yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - location
 *               - initialValue
 *               - currentValue
 *               - purchaseDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dell Laptop"
 *               category:
 *                 type: string
 *                 example: "Komputer avadanlıqları"
 *               location:
 *                 type: string
 *                 example: "IT şöbəsi"
 *               initialValue:
 *                 type: number
 *                 example: 2000
 *               currentValue:
 *                 type: number
 *                 example: 1800
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-01-15"
 *               account:
 *                 type: string
 *                 example: "543"
 *               status:
 *                 type: string
 *                 enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb]
 *                 example: "Aktiv"
 *               serviceLife:
 *                 type: number
 *                 example: 3
 *               notes:
 *                 type: string
 *                 example: "Yeni laptop"
 *     responses:
 *       201:
 *         description: Vəsait uğurla əlavə edildi
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün vəsaitləri gətir
 *     tags: [Assets]
 *     description: İstifadəçinin bütün vəsaitlərini qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Kateqoriya
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Status
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Yerləşmə
 *     responses:
 *       200:
 *         description: Vəsaitlər siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/assets", protect, addAsset);
router.get("/assets", protect, getAssets);

/**
 * @swagger
 * /api/users/assets/{assetId}:
 *   put:
 *     summary: Vəsaiti yenilə
 *     tags: [Assets]
 *     description: Müəyyən edilmiş vəsaitin məlumatlarını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Vəsait ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               initialValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vəsait uğurla yeniləndi
 *       404:
 *         description: Vəsait tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/assets/:assetId", protect, updateAsset);

/**
 * @swagger
 * /api/users/assets/statistics:
 *   get:
 *     summary: Vəsait statistikalarını gətir
 *     tags: [Assets]
 *     description: İstifadəçinin vəsait statistikalarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vəsait statistikaları
 *       500:
 *         description: Daxili server xətası
 */
router.get("/assets/statistics", protect, getAssetStatistics);

/**
 * @swagger
 * /api/users/assets/search:
 *   get:
 *     summary: Vəsait axtarışı
 *     tags: [Assets]
 *     description: Vəsaitlər üzrə axtarış aparır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Axtarış sözü
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Kateqoriya
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Yerləşmə
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Status
 *       - name: minValue
 *         in: query
 *         schema:
 *           type: number
 *         description: Minimum dəyər
 *       - name: maxValue
 *         in: query
 *         schema:
 *           type: number
 *         description: Maksimum dəyər
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *     responses:
 *       200:
 *         description: Axtarış nəticələri
 *       500:
 *         description: Daxili server xətası
 */
router.get("/assets/search", protect, searchAssets);

// ===================== 📋 CATEGORY REPORT ROUTES =====================

/**
 * @swagger
 * /api/users/category-reports:
 *   post:
 *     summary: Yeni kateqoriya hesabatı yarat
 *     tags: [Category Reports]
 *     description: İstifadəçi üçün yeni kateqoriya hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "2024 İl Kateqoriya Hesabatı"
 *               description:
 *                 type: string
 *                 example: "Kateqoriyalar üzrə vəsait analizi"
 *               dateFrom:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               dateTo:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Komputer avadanlıqları", "Ofis mebelləri"]
 *     responses:
 *       201:
 *         description: Kateqoriya hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün kateqoriya hesabatlarını gətir
 *     tags: [Category Reports]
 *     description: İstifadəçinin bütün kateqoriya hesabatlarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *     responses:
 *       200:
 *         description: Kateqoriya hesabatları siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/category-reports", protect, createCategoryReport);
router.get("/category-reports", protect, getCategoryReports);

/**
 * @swagger
 * /api/users/category-reports/{reportId}:
 *   get:
 *     summary: Kateqoriya hesabatını gətir
 *     tags: [Category Reports]
 *     description: Müəyyən edilmiş kateqoriya hesabatını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hesabat ID-si
 *     responses:
 *       200:
 *         description: Kateqoriya hesabatı məlumatları
 *       404:
 *         description: Hesabat tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: Kateqoriya hesabatını sil
 *     tags: [Category Reports]
 *     description: Müəyyən edilmiş kateqoriya hesabatını silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hesabat ID-si
 *     responses:
 *       200:
 *         description: Kateqoriya hesabatı uğurla silindi
 *       404:
 *         description: Hesabat tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get("/category-reports/:reportId", protect, getCategoryReportById);
router.delete("/category-reports/:reportId", protect, deleteCategoryReport);

/**
 * @swagger
 * /api/users/category-reports/real-time:
 *   post:
 *     summary: Real-time kateqoriya hesabatı yarat
 *     tags: [Category Reports]
 *     description: Real-time kateqoriya hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Real-time kateqoriya hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 */
router.post(
  "/category-reports/real-time",
  protect,
  generateRealTimeCategoryReport,
);

// ===================== 🏢 DEPARTMENT REPORT ROUTES =====================

/**
 * @swagger
 * /api/users/department-reports:
 *   post:
 *     summary: Yeni şöbə hesabatı yarat
 *     tags: [Department Reports]
 *     description: İstifadəçi üçün yeni şöbə hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "2024 İl Şöbə Hesabatı"
 *               description:
 *                 type: string
 *                 example: "Şöbələr üzrə vəsait analizi"
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["IT şöbəsi", "Maliyyə şöbəsi"]
 *               dateFrom:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               dateTo:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       201:
 *         description: Şöbə hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 *
 *   get:
 *     summary: Bütün şöbə hesabatlarını gətir
 *     tags: [Department Reports]
 *     description: İstifadəçinin bütün şöbə hesabatlarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Yerləşmə
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlama tarixi
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *     responses:
 *       200:
 *         description: Şöbə hesabatları siyahısı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/department-reports", protect, createDepartmentReport);
router.get("/department-reports", protect, getDepartmentReports);

/**
 * @swagger
 * /api/users/department-reports/{reportId}:
 *   get:
 *     summary: Şöbə hesabatını gətir
 *     tags: [Department Reports]
 *     description: Müəyyən edilmiş şöbə hesabatını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hesabat ID-si
 *     responses:
 *       200:
 *         description: Şöbə hesabatı məlumatları
 *       404:
 *         description: Hesabat tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: Şöbə hesabatını sil
 *     tags: [Department Reports]
 *     description: Müəyyən edilmiş şöbə hesabatını silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Hesabat ID-si
 *     responses:
 *       200:
 *         description: Şöbə hesabatı uğurla silindi
 *       404:
 *         description: Hesabat tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get("/department-reports/:reportId", protect, getDepartmentReportById);
router.delete("/department-reports/:reportId", protect, deleteDepartmentReport);

/**
 * @swagger
 * /api/users/department-reports/real-time:
 *   post:
 *     summary: Real-time şöbə hesabatı yarat
 *     tags: [Department Reports]
 *     description: Real-time şöbə hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Real-time şöbə hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 */
router.post(
  "/department-reports/real-time",
  protect,
  generateRealTimeDepartmentReport,
);

// ===================== 📄 REPORT ROUTES =====================

/**
 * @swagger
 * /api/users/excel-reports:
 *   post:
 *     summary: Excel hesabatı yarat
 *     tags: [Reports]
 *     description: İstifadəçi üçün Excel hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - reportType
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Vəsait Hesabatı"
 *               description:
 *                 type: string
 *                 example: "Vəsaitlər üzrə Excel hesabatı"
 *               reportType:
 *                 type: string
 *                 enum: [assets, category, department]
 *                 example: "assets"
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *               summary:
 *                 type: object
 *               filters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Excel hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/excel-reports", protect, createExcelReport);

/**
 * @swagger
 * /api/users/pdf-reports:
 *   post:
 *     summary: PDF hesabatı yarat
 *     tags: [Reports]
 *     description: İstifadəçi üçün PDF hesabatı yaradır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - reportType
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Vəsait Hesabatı"
 *               description:
 *                 type: string
 *                 example: "Vəsaitlər üzrə PDF hesabatı"
 *               reportType:
 *                 type: string
 *                 enum: [amortization, category, department]
 *                 example: "amortization"
 *     responses:
 *       201:
 *         description: PDF hesabatı uğurla yaradıldı
 *       500:
 *         description: Daxili server xətası
 */
router.post("/pdf-reports", protect, createPdfReport);

// ===================== 💰 FINANCIAL ROUTES =====================

/**
 * @swagger
 * /api/users/{id}/salary-fund:
 *   put:
 *     summary: Əməkhaqqı fondu yenilə
 *     tags: [Financial]
 *     description: Şirkətin əməkhaqqı fondunu yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - amount
 *             properties:
 *               month:
 *                 type: string
 *                 example: "January"
 *               amount:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Əməkhaqqı fondu uğurla yeniləndi
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/salary-fund", protect, updateSalaryFund);

export default router;
