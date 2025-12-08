// routes/users.js
import express from "express";
import {
  registerUser,
  loginUser,
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
  deleteAccountingEntry,
  uploadCompanyFile,
  getCompanyFiles,
  downloadCompanyFile,
  viewCompanyFile,
  deleteCompanyFile
} from "../controllers/userController.js";
import { upload } from '../controllers/userController.js';

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
 *   - name: Calendar
 *     description: Təqvim və gün idarəetməsi
 *   - name: Events
 *     description: Hadisə idarəetməsi
 *   - name: Accounting
 *     description: Mühasibat uçotu əməliyyatları
 *   - name: Company Files
 *     description: Şirkət fayllarının idarə edilməsi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullName
 *         - companyName
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: İstifadəçi unikal ID-si
 *         fullName:
 *           type: string
 *           description: İstifadəçinin tam adı
 *         companyName:
 *           type: string
 *           description: Şirkət adı
 *         email:
 *           type: string
 *           description: İstifadəçi email ünvanı
 *         password:
 *           type: string
 *           description: Şifrə (hashlənmiş)
 *         active_employee:
 *           type: number
 *           description: Aktiv işçi sayı
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Yaradılma tarixi
 * 
 *     UserRegistration:
 *       type: object
 *       required:
 *         - fullName
 *         - companyName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Əli Məmmədov"
 *         companyName:
 *           type: string
 *           example: "Şirkət MMC"
 *         email:
 *           type: string
 *           example: "eli@example.com"
 *         password:
 *           type: string
 *           example: "password123"
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
 *         _id:
 *           type: string
 *         fullName:
 *           type: string
 *         companyName:
 *           type: string
 *         email:
 *           type: string
 * 
 *     FinancialData:
 *       type: object
 *       properties:
 *         gross_profit:
 *           type: number
 *           description: Ümumi gəlir
 *         Net_profit:
 *           type: number
 *           description: Xalis gəlir
 *         total_assets:
 *           type: number
 *           description: Ümumi aktivlər
 *         Obligations_assets:
 *           type: number
 *           description: Öhdəliklər
 * 
 *     CalendarDay:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         dayOfWeek:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Workday, Off day, Holiday]
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *         note:
 *           type: string
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
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 * 
 *     AccountingEntry:
 *       type: object
 *       required:
 *         - accountCode
 *         - amount
 *         - type
 *         - description
 *         - documentNumber
 *       properties:
 *         id:
 *           type: string
 *         accountCode:
 *           type: string
 *           enum: [543, 531, 533, 535]
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
 *         documentNumber:
 *           type: string
 *           description: Sənəd nömrəsi
 *         date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [draft, posted, cancelled]
 * 
 *     SalaryFundUpdate:
 *       type: object
 *       required:
 *         - month
 *         - amount
 *       properties:
 *         month:
 *           type: string
 *           enum: [January, February, March, April, May, June, July, August, September, October, November, December]
 *           example: "January"
 *         amount:
 *           type: number
 *           example: 50000
 * 
 *     CompanyTaxesUpdate:
 *       type: object
 *       properties:
 *         month:
 *           type: string
 *           enum: [January, February, March, April, May, June, July, August, September, October, November, December]
 *         dsmf:
 *           type: number
 *         ish:
 *           type: number
 *         its:
 *           type: number
 * 
 *     CompanyFileUpload:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [document, policy, report, training, template, other]
 *         visibleTo:
 *           type: string
 *           enum: [all, departments, managers]
 *         departments:
 *           type: array
 *           items:
 *             type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
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
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
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
 *             $ref: '#/components/schemas/UserRegistration'
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
 *                 fullName:
 *                   type: string
 *                 companyName:
 *                   type: string
 *                 email:
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

// ===================== 👥 USER CRUD ROUTES =====================

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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
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
 *               $ref: '#/components/schemas/User'
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
 *               $ref: '#/components/schemas/User'
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
 *                 message:
 *                   type: string
 *                   example: "İstifadəçi silindi"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// ===================== 💰 FINANCIAL ROUTES =====================

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *               dataType:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: Aylıq məlumatlar uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/monthly", updateMonthlyData);

// ===================== 💰 ƏMƏKHAQQI VƏ VERGİ ROUTES =====================

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
 *             $ref: '#/components/schemas/SalaryFundUpdate'
 *     responses:
 *       200:
 *         description: Əməkhaqqı fondu uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 month:
 *                   type: string
 *                 salary_fund:
 *                   type: number
 *                 company_taxes:
 *                   type: object
 *                 message:
 *                   type: string
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
 *             $ref: '#/components/schemas/CompanyTaxesUpdate'
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
 *     responses:
 *       200:
 *         description: İşçi axını məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthly_stats:
 *                   type: object
 *                 history:
 *                   type: array
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *               month:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [new_hires, terminations, resignations]
 *               count:
 *                 type: number
 *               employeeData:
 *                 type: object
 *     responses:
 *       200:
 *         description: İşçi axını məlumatları uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *     responses:
 *       200:
 *         description: Ödəniş ümumi baxış məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                 current_month:
 *                   type: object
 *                 recent_employee_payments:
 *                   type: array
 *                 recent_employer_payments:
 *                   type: array
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id/payment-overview", getPaymentOverview);

// ===================== 📅 CALENDAR ROUTES =====================

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
 *               dayOfWeek:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Workday, Off day, Holiday]
 *               events:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Event'
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Təqvim günü uğurla yaradıldı
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *     responses:
 *       200:
 *         description: Təqvim günləri siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalendarDay'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *               $ref: '#/components/schemas/CalendarDay'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *               dayOfWeek:
 *                 type: string
 *               status:
 *                 type: string
 *               events:
 *                 type: array
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Təqvim günü uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id/calendar/:dayId", getCalendarDayById);
router.put("/:id/calendar/:dayId", updateCalendarDay);
router.delete("/:id/calendar/:dayId", deleteCalendarDay);

// ===================== 🎯 EVENT ROUTES =====================

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
 *       500:
 *         description: Daxili server xətası
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *       500:
 *         description: Daxili server xətası
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
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id/calendar/:dayId/events/:eventId", getEventById);
router.put("/:id/calendar/:dayId/events/:eventId", updateEvent);
router.delete("/:id/calendar/:dayId/events/:eventId", deleteEvent);

// ===================== 📊 ACCOUNTING ROUTES =====================

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AccountingEntry'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [debit, credit]
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccountingEntry'
 *                 count:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     balances:
 *                       type: object
 *                     summary:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *           enum: [543, 531, 533, 535]
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
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:id/accounting/balances/:accountCode", getAccountBalance);

/**
 * @swagger
 * /api/users/{id}/accounting/report:
 *   get:
 *     summary: Hesabat yarat
 *     tags: [Accounting]
 *     description: Mühasibat hesabatı yaradır
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
 *         description: Hesabat məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccountingEntry'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AccountingEntry'
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Daxili server xətası
 */
router.put("/:id/accounting/entries/:entryId", updateAccountingEntry);
router.delete("/:id/accounting/entries/:entryId", deleteAccountingEntry);

// ===================== 📁 COMPANY FILE ROUTES =====================

/**
 * @swagger
 * /api/users/{companyId}/files/upload:
 *   post:
 *     summary: Şirkət faylı yüklə
 *     tags: [Company Files]
 *     description: Şirkət üçün fayl yükləyir
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               visibleTo:
 *                 type: string
 *               departments:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Fayl uğurla yükləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Fayl seçilməyib
 *       500:
 *         description: Daxili server xətası
 */
router.post("/:companyId/files/upload", upload.single("file"), uploadCompanyFile);

/**
 * @swagger
 * /api/users/{companyId}/files:
 *   get:
 *     summary: Şirkət fayllarını list et
 *     tags: [Company Files]
 *     description: Şirkətin bütün fayllarını list edir
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Fayllar siyahısı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:companyId/files", getCompanyFiles);

/**
 * @swagger
 * /api/users/{companyId}/files/{fileId}/download:
 *   get:
 *     summary: Faylı download et
 *     tags: [Company Files]
 *     description: Şirkət faylını download edir
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fayl məlumatları
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fayl tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:companyId/files/:fileId/download", downloadCompanyFile);

/**
 * @swagger
 * /api/users/{companyId}/files/{fileId}/view:
 *   get:
 *     summary: Faylı preview et
 *     tags: [Company Files]
 *     description: Şirkət faylını preview edir
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fayl məlumatları
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fayl tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.get("/:companyId/files/:fileId/view", viewCompanyFile);

/**
 * @swagger
 * /api/users/{companyId}/files/{fileId}:
 *   delete:
 *     summary: Faylı sil
 *     tags: [Company Files]
 *     description: Şirkət faylını silir
 *     parameters:
 *       - name: companyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: fileId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fayl uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Fayl tapılmadı
 *       500:
 *         description: Daxili server xətası
 */
router.delete("/:companyId/files/:fileId", deleteCompanyFile);

export default router;