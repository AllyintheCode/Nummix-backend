// routes/users.js
import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { loginLimiter, otpLimiter } from "../middlewares/rateLimit.js";
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
  addCalendarDay,
  updateCalendarDay,
  deleteCalendarDay,
  addEvent,
  updateEvent,
  deleteEvent,
  updateFinancialData,
  updateMonthlyData,
  getAllCalendar,
  getAllEvents,
  getEventById,
  getCalendarDayById,
  updateSalaryFund,
  updateCompanyTaxes,
  getEmployeeFlowData,
  updateEmployeeFlowData,
  getPaymentOverview,
  addAccountingEntry,
  getAccountingEntries,
  getAccountingBalances,
  getAccountBalance,
  generateAccountingReport,
  createSampleAccountingTransaction,
  updateAccountingEntry,
  deleteAccountingEntry

} from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger

 * tags:
 *   name: Authentication
 *   description: İstifadəçi qeydiyyatı və giriş əməliyyatları
 * 
 *   name: Users
 *   description: İstifadəçi CRUD əməliyyatları
 * 
 *   name: Financial
 *   description: Maliyyə məlumatları idarəetməsi
 * 
 *   name: Calendar
 *   description: Təqvim və gün idarəetməsi
 * 
 *   name: Events
 *   description: Hadisə idarəetməsi
 * 
 *   name: Accounting
 *   description: Mühasibat uçotu əməliyyatları
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: İstifadəçi unikal ID-si
 *         name:
 *           type: string
 *           description: İstifadəçi adı
 *         email:
 *           type: string
 *           description: İstifadəçi email ünvanı
 *         password:
 *           type: string
 *           description: Şifrə (hashlənmiş)
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: İstifadəçi rolu
 *         financialData:
 *           $ref: '#/components/schemas/FinancialData'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Yaradılma tarixi
 * 
 *     UserRegistration:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "Əli Məmmədov"
 *         email:
 *           type: string
 *           example: "eli@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: "user"
 * 
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "eli@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 * 
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: JWT token
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     FinancialData:
 *       type: object
 *       properties:
 *         salary:
 *           type: number
 *           description: Aylıq maaş
 *         bonus:
 *           type: number
 *           description: Bonus məbləği
 *         deductions:
 *           type: number
 *           description: Tutulmalar
 *         netSalary:
 *           type: number
 *           description: Xalis maaş
 * 
 *     CalendarDay:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 * 
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         type:
 *           type: string
 *           enum: [meeting, task, reminder, holiday]
 * 
 *     AccountingEntry:
 *       type: object
 *       required:
 *         - accountCode
 *         - amount
 *         - type
 *       properties:
 *         id:
 *           type: string
 *         accountCode:
 *           type: string
 *           description: Hesab kodu
 *         accountName:
 *           type: string
 *           description: Hesab adı
 *         amount:
 *           type: number
 *           description: Məbləğ
 *         type:
 *           type: string
 *           enum: [debit, credit]
 *           description: Əməliyyat növü
 *         description:
 *           type: string
 *           description: Əməliyyat təsviri
 *         date:
 *           type: string
 *           format: date
 * 
 *   responses:
 *     UnauthorizedError:
 *       description: İcazə yoxdur

 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:

 *               error:
 *                 type: string
 *                 example: "İcazə yoxdur"
 * 
 *     NotFoundError:
 *       description: Məlumat tapılmadı
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "İstifadəçi tapılmadı"
 * 
 *     ValidationError:
 *       description: Validasiya xətası
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Yanlış məlumat formatı"
 */

// 🔐 AUTH ROUTES

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
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: İstifadəçi uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "İstifadəçi uğurla qeydiyyatdan keçdi"
 *                 user:
 *                   $ref: '#/components/schemas/User'
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

 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Uğurlu giriş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Giriş məlumatları yanlış
 *       500:
 *         description: Daxili server xətası
 */
router.post("/login", loginUser);

// 👥 USER CRUD ROUTES

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Bütün istifadəçiləri gətir
 *     tags: [Users]
 *     description: Sistemdəki bütün istifadəçilərin siyahısını qaytarır
 *     responses:
 *       200:
 *         description: İstifadəçi siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: number
 *                   example: 15
 *       500:
 *         description: Daxili server xətası
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ID-ə görə istifadəçi məlumatı
 *     tags: [Users]
 *     description: Müəyyən edilmiş ID-yə uyğun istifadəçi məlumatını qaytarır
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 * 
 *   put:
 *     summary: İstifadəçi məlumatlarını yenilə
 *     tags: [Users]
 *     description: Müəyyən edilmiş istifadəçinin məlumatlarını yeniləyir
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: İstifadəçi uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "İstifadəçi məlumatları yeniləndi"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 * 
 *   delete:
 *     summary: İstifadəçi sil
 *     tags: [Users]
 *     description: Müəyyən edilmiş istifadəçini sistemdən silir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: İstifadəçi uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "İstifadəçi uğurla silindi"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// 💰 MALİYYƏ ROUTES

/**
 * @swagger
 * /api/users/{id}/financial:
 *   put:
 *     summary: Maliyyə məlumatlarını yenilə
 *     tags: [Financial]
 *     description: İstifadəçinin maliyyə məlumatlarını yeniləyir
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
 *             $ref: '#/components/schemas/FinancialData'
 *     responses:
 *       200:
 *         description: Maliyyə məlumatları uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/financial", updateFinancialData);

/**
 * @swagger
 * /api/users/{id}/monthly:
 *   put:
 *     summary: Aylıq məlumatları yenilə
 *     tags: [Financial]
 *     description: İstifadəçinin aylıq məlumatlarını yeniləyir
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
 *               month:
 *                 type: string
 *                 format: date
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Aylıq məlumatlar uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/monthly", updateMonthlyData);

// 📊 YENİ ƏMƏKHAQQI VƏ VERGİ ROUTES

/**
 * @swagger
 * /api/users/{id}/salary-fund:
 *   put:
 *     summary: Əməkhaqqı fondu yenilə
 *     tags: [Financial]
 *     description: Şirkətin əməkhaqqı fondunu yeniləyir
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
 *               salaryFund:
 *                 type: number
 *                 description: Yeni əməkhaqqı fondu
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Əməkhaqqı fondu uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/salary-fund", updateSalaryFund);

/**
 * @swagger
 * /api/users/{id}/company-taxes:
 *   put:
 *     summary: Şirkət vergilərini yenilə
 *     tags: [Financial]
 *     description: Şirkətin vergi məlumatlarını yeniləyir
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
 *               incomeTax:
 *                 type: number
 *                 description: Gəlir vergisi
 *               socialTax:
 *                 type: number
 *                 description: Sosial vergi
 *               vat:
 *                 type: number
 *                 description: ƏDV
 *     responses:
 *       200:
 *         description: Vergi məlumatları uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/company-taxes", updateCompanyTaxes);

/**
 * @swagger
 * /api/users/{id}/employee-flow:
 *   get:
 *     summary: İşçi axını məlumatları
 *     tags: [Financial]
 *     description: İşçi gəliş-çıxış statistikasını gətirir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, yearly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: İşçi axını məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     newHires:
 *                       type: number
 *                     terminations:
 *                       type: number
 *                     netChange:
 *                       type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   put:
 *     summary: İşçi axını məlumatlarını yenilə
 *     tags: [Financial]
 *     description: İşçi gəliş-çıxış məlumatlarını yeniləyir
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
 *               newHires:
 *                 type: number
 *               terminations:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: İşçi axını məlumatları uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/employee-flow", getEmployeeFlowData);
router.put("/:id/employee-flow", updateEmployeeFlowData);

/**
 * @swagger
 * /api/users/{id}/payment-overview:
 *   get:
 *     summary: Ödəniş ümumi baxışı
 *     tags: [Financial]
 *     description: Bütün ödənişlərin ümumi baxışını gətirir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: month
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: year
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Ödəniş ümumi baxış məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: number
 *                     pendingPayments:
 *                       type: number
 *                     completedPayments:
 *                       type: number
 *                     paymentBreakdown:
 *                       type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/payment-overview", getPaymentOverview);

// 📅 CALENDAR ROUTES

/**
 * @swagger
 * /api/users/{id}/calendar:
 *   post:
 *     summary: Yeni təqvim günü əlavə et
 *     tags: [Calendar]
 *     description: İstifadəçi üçün yeni təqvim günü yaradır
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
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Təqvim günü uğurla yaradıldı
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   get:
 *     summary: Bütün təqvim günlərini gətir
 *     tags: [Calendar]
 *     description: İstifadəçinin bütün təqvim günlərini qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Təqvim günləri siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalendarDay'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post("/:id/calendar", addCalendarDay);
router.get("/:id/calendar", getAllCalendar);

/**
 * @swagger
 * /api/users/{id}/calendar/{dayId}:
 *   get:
 *     summary: Xüsusi təqvim gününü gətir
 *     tags: [Calendar]
 *     description: Müəyyən edilmiş təqvim gününün məlumatlarını qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Təqvim günü məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalendarDay'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   put:
 *     summary: Təqvim gününü yenilə
 *     tags: [Calendar]
 *     description: Müəyyən edilmiş təqvim gününün məlumatlarını yeniləyir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
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
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Təqvim günü uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   delete:
 *     summary: Təqvim gününü sil
 *     tags: [Calendar]
 *     description: Müəyyən edilmiş təqvim gününü silir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Təqvim günü uğurla silindi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put("/:id/calendar/:dayId", updateCalendarDay);
router.get("/:id/calendar/:dayId", getCalendarDayById);
router.delete("/:id/calendar/:dayId", deleteCalendarDay);

// 🎯 EVENT ROUTES

/**
 * @swagger
 * /api/users/{id}/calendar/{dayId}/events:
 *   post:
 *     summary: Yeni hadisə əlavə et
 *     tags: [Events]
 *     description: Təqvim gününə yeni hadisə əlavə edir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Hadisə uğurla yaradıldı
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   get:
 *     summary: Bütün hadisələri gətir
 *     tags: [Events]
 *     description: Təqvim günündəki bütün hadisələri qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hadisələr siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post("/:id/calendar/:dayId/events", addEvent);
router.get("/:id/calendar/:dayId/events", getAllEvents);

/**
 * @swagger
 * /api/users/{id}/calendar/{dayId}/events/{eventId}:
 *   get:
 *     summary: Xüsusi hadisəni gətir
 *     tags: [Events]
 *     description: Müəyyən edilmiş hadisənin məlumatlarını qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hadisə məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   put:
 *     summary: Hadisəni yenilə
 *     tags: [Events]
 *     description: Müəyyən edilmiş hadisənin məlumatlarını yeniləyir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Hadisə uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   delete:
 *     summary: Hadisəni sil
 *     tags: [Events]
 *     description: Müəyyən edilmiş hadisəni silir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: dayId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hadisə uğurla silindi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/calendar/:dayId/events/:eventId", getEventById);
router.put("/:id/calendar/:dayId/events/:eventId", updateEvent);
router.delete("/:id/calendar/:dayId/events/:eventId", deleteEvent);

// 📊 MÜHASİBAT ROUTES

/**
 * @swagger
 * /api/users/{id}/accounting/entries:
 *   post:
 *     summary: Mühasibat yazılışı əlavə et
 *     tags: [Accounting]
 *     description: Yeni mühasibat yazılışı əlavə edir
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
 *             $ref: '#/components/schemas/AccountingEntry'
 *     responses:
 *       201:
 *         description: Yazılış uğurla əlavə edildi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   get:
 *     summary: Bütün yazılışları gətir
 *     tags: [Accounting]
 *     description: Bütün mühasibat yazılışlarını qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: accountCode
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yazılışlar siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccountingEntry'
 *                 total:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post("/:id/accounting/entries", addAccountingEntry);
router.get("/:id/accounting/entries", getAccountingEntries);

/**
 * @swagger
 * /api/users/{id}/accounting/balances:
 *   get:
 *     summary: Bütün balansları gətir
 *     tags: [Accounting]
 *     description: Bütün hesabların cari balanslarını qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Balans məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     balances:
 *                       type: object
 *                     totalAssets:
 *                       type: number
 *                     totalLiabilities:
 *                       type: number
 *                     equity:
 *                       type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/accounting/balances", getAccountingBalances);

/**
 * @swagger
 * /api/users/{id}/accounting/balances/{accountCode}:
 *   get:
 *     summary: Xüsusi hesab balansı
 *     tags: [Accounting]
 *     description: Müəyyən edilmiş hesabın cari balansını qaytarır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: accountCode
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Hesab balansı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accountCode:
 *                       type: string
 *                     accountName:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AccountingEntry'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/accounting/balances/:accountCode", getAccountBalance);

/**
 * @swagger
 * /api/users/{id}/accounting/report:
 *   get:
 *     summary: Hesabat yarat
 *     tags: [Accounting]
 *     description: Mühasibat hesabatı yaradır (Müvəqqəti Balans, Gəlir Əlavə və s.)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [balance-sheet, income-statement, trial-balance, cash-flow]
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Hesabat məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 reportType:
 *                   type: string
 *                 period:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/accounting/report", generateAccountingReport);

/**
 * @swagger
 * /api/users/{id}/accounting/sample:
 *   post:
 *     summary: Nümunə əməliyyat yarat
 *     tags: [Accounting]
 *     description: Test məqsədli nümunə mühasibat əməliyyatı yaradır
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Nümunə əməliyyat uğurla yaradıldı
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post("/:id/accounting/sample", createSampleAccountingTransaction);

/**
 * @swagger
 * /api/users/{id}/accounting/entries/{entryId}:
 *   put:
 *     summary: Yazılışı yenilə
 *     tags: [Accounting]
 *     description: Müəyyən edilmiş mühasibat yazılışını yeniləyir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: entryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountingEntry'
 *     responses:
 *       200:
 *         description: Yazılış uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 * 
 *   delete:
 *     summary: Yazılışı sil
 *     tags: [Accounting]
 *     description: Müəyyən edilmiş mühasibat yazılışını silir
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: entryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:

 *         description: Yazılış uğurla silindi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put("/:id/accounting/entries/:entryId", updateAccountingEntry);
router.delete("/:id/accounting/entries/:entryId", deleteAccountingEntry);

export default router;

