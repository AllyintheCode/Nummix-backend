import express from "express";
import {
  getBalanceBreakdownPercentage,
  getDashboardStats,
  getIncomeExpenseLast6Months,
  getProfitDynamicsLast6Months,
  getTotalAssets,
} from "../controllers/DashboardController.js";

const router = express.Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Ümumi gəlir, ümumi xərclər və xalis mənfəət
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             example:
 *               totalIncome: 15000
 *               totalExpense: 12000
 *               netIncome: 3000
 */
router.get("/stats", getDashboardStats);

/**
 * @swagger
 * /dashboard/assets:
 *   get:
 *     summary: Ümumi aktivlər (Cash + Bank)
 *     responses:
 *       200:
 *         description: Ümumi aktivlər və breakdown
 *         content:
 *           application/json:
 *             example:
 *               totalAssets: 23000
 *               breakdown:
 *                 - account: "Cash"
 *                   balance: 10000
 *                 - account: "Bank"
 *                   balance: 13000
 */
router.get("/assets", getTotalAssets);

/**
 * @swagger
 * /dashboard/finance/last6months:
 *   get:
 *     summary: Son 6 ay Gəlir və Xərc
 *     responses:
 *       200:
 *         description: Aylara görə gəlir və xərclər
 *         content:
 *           application/json:
 *             example:
 *               - month: "2025-06"
 *                 income: 10000
 *                 expense: 5000
 *               - month: "2025-07"
 *                 income: 12000
 *                 expense: 7000
 */
router.get("/finance/last6months", getIncomeExpenseLast6Months);

/**
 * @swagger
 * /dashboard/profit-dynamics:
 *   get:
 *     summary: Son 6 ay Mənfəət Dinamikası
 *     responses:
 *       200:
 *         description: Aylara görə mənfəət
 *         content:
 *           application/json:
 *             example:
 *               - month: "2025-06"
 *                 profit: 5000
 *               - month: "2025-07"
 *                 profit: 5000
 */
router.get("/profit-dynamics", getProfitDynamicsLast6Months);

/**
 * @swagger
 * /dashboard/balance-percentage:
 *   get:
 *     summary: Balansın hesablar üzrə faizlə bölünməsi
 *     responses:
 *       200:
 *         description: Aktivlər, öhdəliklər və kapital faizləri
 *         content:
 *           application/json:
 *             example:
 *               totalAssets: 23000
 *               totalLiabilities: 23000
 *               totalEquity: 23000
 *               breakdownPercent:
 *                 assets: "33.33"
 *                 liabilities: "33.33"
 *                 equity: "33.33"
 */
router.get("/balance-percentage", getBalanceBreakdownPercentage);

export default router;
