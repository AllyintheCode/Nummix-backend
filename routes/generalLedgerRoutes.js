import express from "express";
import { getGeneralLedgerWithTotals } from "../controllers/GeneralLedgerController.js";

const router = express.Router();

/**
 * @swagger
 * /general-ledger:
 *   get:
 *     summary: Baş Kitab + Ümumi Aktivlər, Öhdəliklər, Kapital, Gəlir, Xərc
 *     responses:
 *       200:
 *         description: General Ledger məlumatları
 *         content:
 *           application/json:
 *             example:
 *               totalAssets: 23000
 *               totalLiabilities: 15000
 *               totalEquity: 8000
 *               totalIncome: 15000
 *               totalExpense: 12000
 *               netIncome: 3000
 *               breakdown:
 *                 - account: "Cash"
 *                   balance: 10000
 *                 - account: "Bank"
 *                   balance: 13000
 */
router.get("/", getGeneralLedgerWithTotals);

export default router;
