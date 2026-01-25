import express from "express";
import {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes,
  getCompanyPayrollSummary,
  getTaxBreakdown,
  createAccountingEntries,
  getAccountingEntries,
  exportComprehensivePayrollExcel
} from "../controllers/payrollController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payroll
 *     description: Əməkhaqqı və vergi hesablamaları
 *   - name: Accounting
 *     description: Mühasibat uçotu əməliyyatları
 */

/**
 * @swagger
 * /api/payroll/calculate:
 *   post:
 *     summary: Fərdi vergi hesablaması
 *     tags: [Payroll]
 *     description: Bir işçi üçün brüt maaşdan net maaş və vergiləri hesablayır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grossSalary
 *               - employeeType
 *             properties:
 *               grossSalary:
 *                 type: number
 *                 minimum: 400
 *                 example: 1500
 *               employeeType:
 *                 type: string
 *                 enum: [state, private]
 *                 example: "private"
 *               hasBonus:
 *                 type: boolean
 *                 example: false
 *               bonusAmount:
 *                 type: number
 *                 example: 0
 *     responses:
 *       200:
 *         description: Vergi hesablaması uğurlu
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
 *                     grossSalary:
 *                       type: number
 *                     netSalary:
 *                       type: number
 *                     taxes:
 *                       type: object
 *       400:
 *         description: Yanlış məlumat
 */
router.post("/calculate", protect, calculateTaxes);

/**
 * @swagger
 * /api/payroll/examples:
 *   get:
 *     summary: Vergi hesablama nümunələri
 *     tags: [Payroll]
 *     description: Müxtəlif maaş aralıqları üçün vergi hesablama nümunələri
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nümunələr siyahısı
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
 *                     type: object
 */
router.get("/examples", protect, getCalculationExamples);


/**
 * @swagger
 * /api/payroll/calculate-bulk:
 *   post:
 *     summary: Toplu vergi hesablaması
 *     tags: [Payroll]
 *     description: Birdən çox işçi üçün eyni anda vergi hesablaması
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     grossSalary:
 *                       type: number
 *                     employeeType:
 *                       type: string
 *     responses:
 *       200:
 *         description: Toplu hesablama nəticələri
 */
router.post("/calculate-bulk", protect, calculateBulkTaxes);

/**
 * @swagger
 * /api/payroll/company-summary:
 *   get:
 *     summary: Şirkət əməkhaqqı xülasəsi
 *     tags: [Payroll]
 *     description: Şirkətin bütün işçiləri üçün ümumi maaş və vergi statistikaları
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 11
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: İl
 *         example: 2024
 *     responses:
 *       200:
 *         description: Şirkət statistikaları
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: number
 *                           example: 11
 *                         year:
 *                           type: number
 *                           example: 2024
 *                         name:
 *                           type: string
 *                           example: "Noyabr 2024"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: number
 *                           example: 25
 *                         totalGrossSalary:
 *                           type: number
 *                           example: 37500
 *                         totalNetSalary:
 *                           type: number
 *                           example: 28500
 *                         totalTax:
 *                           type: number
 *                           example: 4500
 *                         totalSocialPay:
 *                           type: number
 *                           example: 4500
 *                         totalBonus:
 *                           type: number
 *                           example: 2500
 *                         totalCompanyCost:
 *                           type: number
 *                           example: 42000
 *                         averageSalary:
 *                           type: number
 *                           example: 1500
 *                         averageNetSalary:
 *                           type: number
 *                           example: 1140
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "654321abcdef"
 *                           name:
 *                             type: string
 *                             example: "Əli Hüseynov"
 *                           position:
 *                             type: string
 *                             example: "Proqramçı"
 *                           basicSalary:
 *                             type: number
 *                             example: 1500
 *                           bonus:
 *                             type: number
 *                             example: 100
 *                           gross:
 *                             type: number
 *                             example: 1600
 *                           net:
 *                             type: number
 *                             example: 1280
 *                           status:
 *                             type: string
 *                             example: "active"
 */
router.get("/company-summary", protect, getCompanyPayrollSummary);
/**
 * @swagger
 * /api/payroll/export/comprehensive:
 *   get:
 *     summary: Kompleks Excel hesabatı yüklə
 *     tags: [Payroll]
 *     description: Bütün işçilər üçün kompleks Excel hesabatı yaradır (4 vərəqli)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 11
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: İl
 *         example: 2024
 *       - in: query
 *         name: includeEmployees
 *         schema:
 *           type: boolean
 *           default: true
 *         description: İşçi məlumatlarını daxil et
 *       - in: query
 *         name: includeAccounting
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Mühasibat məlumatlarını daxil et
 *     responses:
 *       200:
 *         description: Excel faylı uğurla yaradıldı
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Fayl adı
 *             schema:
 *               type: string
 *       401:
 *         description: İcazə yoxdur
 *       404:
 *         description: İşçi tapılmadı
 *       500:
 *         description: Excel faylı yaradılarkən xəta baş verdi
 */
router.get('/export/comprehensive', protect, exportComprehensivePayrollExcel);

/**
 * 
 * @swagger
 * /api/payroll/tax-breakdown:
 *   get:
 *     summary: Vergilərin detallı bölgüsü
 *     tags: [Payroll]
 *     description: İşçi və işəgötürən vergilərinin ayrıntılı təhlili
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 11
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: İl
 *         example: 2024
 *     responses:
 *       200:
 *         description: Vergi bölgüsü məlumatları
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: number
 *                           example: 11
 *                         year:
 *                           type: number
 *                           example: 2024
 *                         name:
 *                           type: string
 *                           example: "Noyabr 2024"
 *                     taxBreakdown:
 *                       type: object
 *                       properties:
 *                         employeeTaxes:
 *                           type: object
 *                           properties:
 *                             incomeTax:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 2250
 *                                 percentage:
 *                                   type: string
 *                                   example: "6%"
 *                                 description:
 *                                   type: string
 *                                   example: "Gəlir vergisi"
 *                             dsmf:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 1500
 *                                 percentage:
 *                                   type: string
 *                                   example: "3%"
 *                             its:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 300
 *                                 percentage:
 *                                   type: string
 *                                   example: "0.5%"
 *                             ish:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 450
 *                                 percentage:
 *                                   type: string
 *                                   example: "0.5%"
 *                             gvTax:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 0
 *                                 description:
 *                                   type: string
 *                                   example: "8000+ üçün"
 *                             total:
 *                               type: number
 *                               example: 4500
 *                         employerTaxes:
 *                           type: object
 *                           properties:
 *                             dsmf:
 *                               type: number
 *                               example: 1500
 *                             its:
 *                               type: number
 *                               example: 300
 *                             ish:
 *                               type: number
 *                               example: 450
 *                             total:
 *                               type: number
 *                               example: 2250
 *                         totalTaxes:
 *                           type: object
 *                           properties:
 *                             employee:
 *                               type: number
 *                               example: 4500
 *                             employer:
 *                               type: number
 *                               example: 2250
 *                             grandTotal:
 *                               type: number
 *                               example: 6750
 *                         taxPercentages:
 *                           type: object
 *                           properties:
 *                             taxToGross:
 *                               type: string
 *                               example: "12%"
 *                             netToGross:
 *                               type: string
 *                               example: "76%"
 *                             totalCostToGross:
 *                               type: string
 *                               example: "112%"
 */
router.get("/tax-breakdown", protect, getTaxBreakdown);

/**
 * @swagger
 * /api/payroll/accounting-entries:
 *   post:
 *     summary: Mühasibat yazılışları yarat
 *     tags: [Accounting]
 *     description: Əməkhaqqı ödənişləri üçün mühasibat uçotu yazılışlarını generasiya edir
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 11
 *               year:
 *                 type: integer
 *                 example: 2024
 *               description:
 *                 type: string
 *                 example: "Noyabr ayı əməkhaqqı ödənişləri"
 *     responses:
 *       200:
 *         description: Mühasibat yazılışları yaradıldı
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           accountCode:
 *                             type: string
 *                             example: "543"
 *                           accountName:
 *                             type: string
 *                             example: "Əməkhaqqı xərcləri"
 *                           debit:
 *                             type: number
 *                             example: 37500
 *                           credit:
 *                             type: number
 *                             example: 0
 *                           description:
 *                             type: string
 *                     totalDebit:
 *                       type: number
 *                       example: 37500
 *                     totalCredit:
 *                       type: number
 *                       example: 37500
 *       400:
 *         description: Ay və ya il təqdim edilməyib
 */
router.post("/accounting-entries", protect, createAccountingEntries);

/**
 * @swagger
 * /api/payroll/accounting-entries:
 *   get:
 *     summary: Mühasibat yazılışlarını gətir
 *     tags: [Accounting]
 *     description: Saxlanılmış mühasibat uçotu yazılışlarının siyahısı
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Ay (1-12)
 *         example: 11
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: İl
 *         example: 2024
 *       - in: query
 *         name: accountCode
 *         schema:
 *           type: string
 *           enum: ["543", "531", "533", "535"]
 *         description: Hesab kodu
 *         example: "543"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Səhifə nömrəsi
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Hər səhifədə göstəriləcək maddə sayı
 *         example: 20
 *     responses:
 *       200:
 *         description: Mühasibat yazılışları siyahısı
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           accountCode:
 *                             type: string
 *                           accountName:
 *                             type: string
 *                           debit:
 *                             type: number
 *                           credit:
 *                             type: number
 *                           description:
 *                             type: string
 *                           date:
 *                             type: string
 *                           createdBy:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         pages:
 *                           type: number
 */
router.get("/accounting-entries", protect, getAccountingEntries);

export default router;