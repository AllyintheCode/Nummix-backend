import express from "express";
import { getGeneralLedgerWithTotals } from "../controllers/GeneralLedgerController.js";

const router = express.Router();
import protect from "../middlewares/authMiddleware.js";

/**
 * @swagger
 * tags:
 *   - name: GeneralLedger
 *     description: Ümumi mühasibat (General Ledger) əməliyyatları üçün API-lər
 */

/**
 * @swagger
 * /api/general-ledger:
 *   get:
 *     summary: Ümumi mühasibat (General Ledger) və toplamlar
 *     tags: [GeneralLedger]
 *     description: Bütün əməliyyatları hesablamaqla General Ledger-i və hər bir bölmənin toplam balanslarını qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: General Ledger uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totals:
 *                   type: object
 *                   properties:
 *                     totalAssets:
 *                       type: number
 *                       example: 50000
 *                     totalLiabilities:
 *                       type: number
 *                       example: 20000
 *                     totalEquity:
 *                       type: number
 *                       example: 30000
 *                     totalIncome:
 *                       type: number
 *                       example: 15000
 *                     totalExpense:
 *                       type: number
 *                       example: 8000
 *                 ledger:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       account:
 *                         type: string
 *                         example: "Cash"
 *                       balance:
 *                         type: number
 *                         example: 20000
 *                       entries:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             date:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-12-12T00:00:00.000Z"
 *                             reference:
 *                               type: string
 *                               example: "INV-001"
 *                             description:
 *                               type: string
 *                               example: "Payment received"
 *                             type:
 *                               type: string
 *                               example: "debit"
 *                             amount:
 *                               type: number
 *                               example: 5000
 *                             balance:
 *                               type: number
 *                               example: 20000
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

router.get("/", protect, getGeneralLedgerWithTotals);

export default router;
