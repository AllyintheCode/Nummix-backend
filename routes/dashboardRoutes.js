import express from "express";
import {
  getBalanceBreakdownPercentage,
  getDashboardStats,
  getIncomeExpenseLast6Months,
  getProfitDynamicsLast6Months,
  getTotalAssets,
} from "../controllers/DashboardController.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard və maliyyə statistikası API-ləri
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Dashboard üçün maliyyə statistikasını gətir
 *     tags: [Dashboard]
 *     description: Ümumi gəlir, xərclər və xalis mənfəəti hesablayır və qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Statistika uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalIncome:
 *                   type: number
 *                   example: 50000
 *                 totalExpense:
 *                   type: number
 *                   example: 20000
 *                 netIncome:
 *                   type: number
 *                   example: 30000
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/stats", protect, getDashboardStats);

/**
 * @swagger
 * /api/dashboard/assets:
 *   get:
 *     summary: Ümumi aktivləri gətir
 *     tags: [Dashboard]
 *     description: Cash və Bank hesablarındakı balansları toplayaraq ümumi aktivləri və hər bir hesabın balansını qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Aktivlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAssets:
 *                   type: number
 *                   example: 75000
 *                 breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account:
 *                         type: string
 *                         example: "Cash"
 *                       balance:
 *                         type: number
 *                         example: 50000
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/assets", protect, getTotalAssets);

/**
 * @swagger
 * /api/dashboard/finance/last6months:
 *   get:
 *     summary: Son 6 ay üzrə gəlir və xərcləri gətir
 *     tags: [Dashboard]
 *     description: Son 6 ay üçün hər ayın gəlir və xərclərini hesablayır və qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Son 6 ayın gəlir və xərcləri uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                     example: "2025-07"
 *                   income:
 *                     type: number
 *                     example: 15000
 *                   expense:
 *                     type: number
 *                     example: 8000
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/finance/last6months", protect, getIncomeExpenseLast6Months);

/**
 * @swagger
 * /api/dashboard/profit-dynamics:
 *   get:
 *     summary: Son 6 ay üzrə mənfəət dinamikası
 *     tags: [Dashboard]
 *     description: Son 6 ay üçün hər ayın mənfəətini hesablayır (gəlir - xərclər) və qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Son 6 ayın mənfəət dinamikası uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                     example: "2025-07"
 *                   profit:
 *                     type: number
 *                     example: 7000
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/profit-dynamics", protect, getProfitDynamicsLast6Months);

/**
 * @swagger
 * /api/dashboard/balance-percentage:
 *   get:
 *     summary: Aktiv, Öhdəlik və Kapital üzrə balansın faiz paylanması
 *     tags: [Dashboard]
 *     description: Aktiv, Öhdəlik və Kapital hesablarının balanslarını toplayır və faiz nisbətlərini hesablayır. Hər bir hesabın balansı da göstərilir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Balans faizi və hesabların breakdown-u uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAssets:
 *                   type: number
 *                   example: 50000
 *                 totalLiabilities:
 *                   type: number
 *                   example: 20000
 *                 totalEquity:
 *                   type: number
 *                   example: 30000
 *                 breakdownPercent:
 *                   type: object
 *                   properties:
 *                     assets:
 *                       type: string
 *                       example: "50.00"
 *                     liabilities:
 *                       type: string
 *                       example: "20.00"
 *                     equity:
 *                       type: string
 *                       example: "30.00"
 *                 accountsBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account:
 *                         type: string
 *                         example: "Cash"
 *                       balance:
 *                         type: number
 *                         example: 30000
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/balance-percentage", protect, getBalanceBreakdownPercentage);

export default router;
