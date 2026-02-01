import express from "express";
import {
  createBudget,
  getBudgets,
  getBudgetByDepartment,
  updateBudget,
  deleteBudget,
  getBudgetReport,
  exportBudgetToExcel,
} from "../controllers/BudgetController.js";

import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @swagger

 * tags:
 *   - name: Budgets
 *     description: Büdcə idarəetmə əməliyyatları
  */

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Yeni büdcə planı yaratmaq
 *     tags: [Budgets]
 *     description: Yeni departament üzrə illik büdcə planı yaradır. Hər departament üçün bir il ərzində yalnız bir büdcə planı ola bilər.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *                 example: "Marketing"
 *               year:
 *                 type: number
 *                 example: 2025
 *               monthlyBudgets:
 *                 type: array
 *                 description: Hər ay üçün büdcə məlumatları
 *                 items:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: string
 *                       example: "January"
 *                     amount:
 *                       type: number
 *                       example: 15000
 *     responses:
 *       201:
 *         description: Büdcə planı uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Büdcə planı uğurla yaradıldı."
 *                 budget:
 *                   type: object
 *       400:
 *         description: Bu departament üçün bu il artıq büdcə planı mövcuddur
 *       401:
 *         description: Token yoxdur və ya yanlışdır
 *       500:
 *         description: Server xətası baş verdi
 */

router.post("/", protect, createBudget);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Bütün büdcə planlarını əldə etmək
 *     tags: [Budgets]
 *     description: Sistemdə mövcud olan bütün büdcə planlarını qaytarır. Nəticə il üzrə (azalan), departament üzrə (artan) sıralanır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Bütün büdcə planları uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   department:
 *                     type: string
 *                   year:
 *                     type: number
 *                   monthlyBudgets:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         month:
 *                           type: string
 *                           example: "January"
 *                         amount:
 *                           type: number
 *                           example: 15000
 *                   createdBy:
 *                     type: string
 *       500:
 *         description: Server xətası baş verdi
 */

router.get("/", protect, getBudgets);

/**
 * @swagger
 * /api/budgets/export/excel:
 *   get:
 *     summary: Büdcə məlumatlarını Excel faylı kimi ixrac et
 *     tags: [Budgets]
 *     description: Filtrlərə uyğun büdcə məlumatlarını Excel (.xlsx) formatında ixrac edir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filtr üçün departament adı (opsional)
 *         example: "Marketing"
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Filtr üçün il (opsional)
 *         example: 2025
 *     responses:
 *       200:
 *         description: Excel faylı uğurla yaradıldı və göndərildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Heç bir büdcə məlumatı tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No budget data found for this filter"
 *       500:
 *         description: Server xətası baş verdi (Excel export zamanı)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server xətası baş verdi (Excel export zamanı)"
 */

router.get("/export/excel", protect, exportBudgetToExcel);

/**
 * @swagger
 * /api/budgets/{department}/{year}:
 *   get:
 *     summary: Departament üzrə illik büdcə detalları
 *     tags: [Budgets]
 *     description: Müəyyən departament və il üçün büdcə məlumatlarını qaytarır. Chart və cədvəl üçün istifadə olunur.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *         description: Departament adı
 *         example: "Marketing"
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: number
 *         description: İl
 *         example: 2025
 *     responses:
 *       200:
 *         description: Büdcə məlumatları uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 department:
 *                   type: string
 *                 year:
 *                   type: number
 *                 monthlyBudgets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "January"
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Advertising"
 *                             plannedAmount:
 *                               type: number
 *                               example: 15000
 *                             actualAmount:
 *                               type: number
 *                               example: 12000
 *                             difference:
 *                               type: number
 *                               example: 3000
 *                             usageRate:
 *                               type: number
 *                               example: 80.0
 *                             status:
 *                               type: string
 *                               example: "On Track"
 *       404:
 *         description: Bu departament üçün büdcə tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bu departament üçün büdcə tapılmadı."
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server xətası baş verdi."
 */

router.get("/:department/:year", protect, getBudgetByDepartment);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Mövcud büdcəni yeniləmək
 *     tags: [Budgets]
 *     description: Müəyyən büdcə planını yeniləyir. Məsələn, faktiki xərcləri və aylıq məlumatları dəyişmək üçün istifadə olunur.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yenilənəcək büdcənin Mongo ObjectId-si
 *         example: "650f1c2b4a3d2c00123abcd4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monthlyBudgets:
 *                 type: array
 *                 description: Aylıq büdcə məlumatları
 *                 items:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: string
 *                       example: "January"
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Advertising"
 *                           plannedAmount:
 *                             type: number
 *                             example: 15000
 *                           actualAmount:
 *                             type: number
 *                             example: 12000
 *                           difference:
 *                             type: number
 *                             example: 3000
 *                           usageRate:
 *                             type: number
 *                             example: 80.0
 *                           status:
 *                             type: string
 *                             example: "On Track"
 *     responses:
 *       200:
 *         description: Büdcə uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Büdcə uğurla yeniləndi."
 *                 budget:
 *                   type: object
 *       404:
 *         description: Büdcə tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Büdcə tapılmadı."
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server xətası baş verdi."
 */

router.put("/:id", protect, updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Mövcud büdcəni silmək
 *     tags: [Budgets]
 *     description: Müəyyən büdcə planını silir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Silinəcək büdcənin Mongo ObjectId-si
 *         example: "650f1c2b4a3d2c00123abcd4"
 *     responses:
 *       200:
 *         description: Büdcə uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget deleted successfully"
 *       404:
 *         description: Büdcə tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget not found"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete budget"
 *                 error:
 *                   type: string
 */

router.delete("/:id", protect, deleteBudget);

/**
 * @swagger
 * /api/budgets/report:
 *   get:
 *     summary: Bütün büdcələr üzrə ümumi hesabat
 *     tags: [Budgets]
 *     description: Filtrlərə uyğun bütün büdcələr üzrə ümumi cəmləri və aylıq məlumatları qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filtr üçün departament adı (opsional)
 *         example: "Marketing"
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Filtr üçün il (opsional)
 *         example: 2025
 *     responses:
 *       200:
 *         description: Hesabat uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Budget report generated successfully"
 *                 totalPlanned:
 *                   type: number
 *                   example: 180000
 *                 totalActual:
 *                   type: number
 *                   example: 150000
 *                 totalDifference:
 *                   type: number
 *                   example: -30000
 *                 totalUsageRate:
 *                   type: string
 *                   example: "83.33%"
 *                 budgets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       department:
 *                         type: string
 *                       year:
 *                         type: number
 *                       monthlyData:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             month:
 *                               type: string
 *                               example: "January"
 *                             totalPlanned:
 *                               type: number
 *                               example: 15000
 *                             totalActual:
 *                               type: number
 *                               example: 12000
 *                             difference:
 *                               type: number
 *                               example: -3000
 *                             usageRate:
 *                               type: string
 *                               example: "80.00%"
 *       404:
 *         description: Filtrlərə uyğun büdcə məlumatı tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No budget data found for this filter"
 *                 totalPlanned:
 *                   type: number
 *                   example: 0
 *                 totalActual:
 *                   type: number
 *                   example: 0
 *                 totalDifference:
 *                   type: number
 *                   example: 0
 *                 totalUsageRate:
 *                   type: string
 *                   example: "0%"
 *                 budgets:
 *                   type: array
 *                   items: {}
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error while generating report"
 */

router.get("/report", protect, getBudgetReport);

export default router;
