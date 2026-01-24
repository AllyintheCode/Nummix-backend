import express from "express";
import {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes,
  getCompanyPayrollSummary,
  getTaxBreakdown,
  createAccountingEntries,
  getAccountingEntries
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

// ===================== VERGİ HESABLAMALARI =====================
router.post("/calculate", protect, calculateTaxes);
router.get("/examples", protect, getCalculationExamples);
router.post("/calculate-bulk", protect, calculateBulkTaxes);

// ===================== ŞİRKƏT ÜMUMİ MƏLUMATLARI =====================
/**
 * @swagger
 * /api/payroll/company-summary:
 *   get:
 *     summary: Şirkətin ümumi əməkhaqqı, net maaş, bonus və vergilərin hesablanması
 *     description: |
 *       Şirkətin bütün işçiləri üçün ümumi məlumatlar və işçilər siyahısı:
 *       - Ümumi brüt maaş
 *       - Ümumi net maaş
 *       - Ümumi vergilər
 *       - İşçilər üzrə detallı siyahı (ad, soyad, vəzifə, brüt, net, bonus, status)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *         example: 2024
 *     responses:
 *       200:
 *         description: Şirkət ümumi məlumatları
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
 *                     period:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: number
 *                         year:
 *                           type: number
 *                         name:
 *                           type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: number
 *                         totalGrossSalary:
 *                           type: number
 *                         totalNetSalary:
 *                           type: number
 *                         totalTax:
 *                           type: number
 *                         totalSocialPay:
 *                           type: number
 *                         totalBonus:
 *                           type: number
 *                         totalCompanyCost:
 *                           type: number
 *                         averageSalary:
 *                           type: number
 *                         averageNetSalary:
 *                           type: number
 *                     employees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           position:
 *                             type: string
 *                           basicSalary:
 *                             type: number
 *                           bonus:
 *                             type: number
 *                           gross:
 *                             type: number
 *                           net:
 *                             type: number
 *                           status:
 *                             type: string
 */
router.get("/company-summary", protect, getCompanyPayrollSummary);

// ===================== VERGİ AYRINTILARI =====================
/**
 * @swagger
 * /api/payroll/tax-breakdown:
 *   get:
 *     summary: Vergilərin ayrıntılı bölgüsü
 *     description: |
 *       Şirkətin ümumi vergi bölgüsü:
 *       - İşçi vergiləri (gəlir vergisi, DSMF, İTS, İŞS, GV vergisi)
 *       - İşəgötürən vergiləri (DSMF, İTS, İŞS)
 *       - Faiz bölgüləri
 *       - Vergi dərəcələri
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
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
 *                                 percentage:
 *                                   type: string
 *                                 description:
 *                                   type: string
 *                             dsmf:
 *                               type: object
 *                             its:
 *                               type: object
 *                             ish:
 *                               type: object
 *                             gvTax:
 *                               type: object
 *                             total:
 *                               type: number
 *                         employerTaxes:
 *                           type: object
 *                         totalTaxes:
 *                           type: object
 *                         taxPercentages:
 *                           type: object
 */
router.get("/tax-breakdown", protect, getTaxBreakdown);

// ===================== MÜHASİBAT UÇOTU ƏMƏLİYYATLARI =====================
/**
 * @swagger
 * /api/payroll/accounting-entries:
 *   post:
 *     summary: Mühasibat uçotu yazılışlarını yarat
 *     description: |
 *       Əməkhaqqı ödənişləri üçün mühasibat yazılışlarını avtomatik yaradır:
 *       - 543 hesabı: Əməkhaqqı xərcləri (Debet)
 *       - 531 hesabı: İşçilərlə hesablaşmalar (Kredit)
 *       - 533 hesabı: Vergi ödənişləri (Kredit)
 *       - 535 hesabı: Sosial sığorta ödənişləri (Kredit)
 *     tags: [Accounting]
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
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 5
 *               year:
 *                 type: number
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Mühasibat yazılışları yaradıldı
 */
router.post("/accounting-entries", protect, createAccountingEntries);

/**
 * @swagger
 * /api/payroll/accounting-entries:
 *   get:
 *     summary: Mühasibat uçotu yazılışlarını gətir
 *     description: |
 *       Mühasibat yazılışlarının siyahısını və statistikalarını gətirir
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Ay (1-12)
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *         example: 2024
 *       - in: query
 *         name: accountCode
 *         schema:
 *           type: string
 *           enum: ["543", "531", "533", "535"]
 *         description: Hesab kodu
 *         example: "543"
 *     responses:
 *       200:
 *         description: Mühasibat yazılışları siyahısı
 */
router.get("/accounting-entries", protect, getAccountingEntries);

export default router;