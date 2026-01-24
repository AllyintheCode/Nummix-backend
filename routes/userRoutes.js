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
 *   - name: Financial
 *     description: Maliyyə məlumatları idarəetməsi
 *   - name: Events
 *     description: Tədbir idarəetməsi
 *   - name: Payments
 *     description: Ödəniş idarəetməsi
 *   - name: Employee Flow
 *     description: İşçi axını idarəetməsi
 *   - name: Accounting
 *     description: Mühasibat uçotu əməliyyatları
 *   - name: Asset Categories
 *     description: Əsas vəsait kateqoriyaları
 *   - name: Assets
 *     description: Əsas vəsaitlər
 *   - name: Category Reports
 *     description: Kateqoriya hesabatları
 *   - name: Department Reports
 *     description: Şöbə hesabatları
 *   - name: Reports
 *     description: Excel və PDF hesabatlar
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
 *     description: Müəyyən edilmiş ID-yə uyğun istifadəçi məlumatını qaytarır
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
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   put:
 *     summary: İstifadəçi məlumatlarını yenilə
 *     tags: [Users]
 *     description: Müəyyən edilmiş istifadəçinin məlumatlarını yeniləyir
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
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 *
 *   delete:
 *     summary: İstifadəçi sil
 *     tags: [Users]
 *     description: Müəyyən edilmiş istifadəçini sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: İstifadəçi uğurla silindi
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Daxili server xətası
 */

router.get("/:id", protect, getUserById);
router.put("/:id", updateUser);
router.delete("/:id", protect, deleteUser);




export default router;
