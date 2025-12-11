import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/TransactionController.js";

import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Transactions
 *     description: Transaction-lar üçün API-lər
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Yeni transaction (əməliyyat) əlavə et
 *     tags: [Transactions]
 *     description: Yeni transaction yaradaraq debit və credit entry-ləri ilə verilənlər bazasına əlavə edir. Ən azı 2 entry olmalıdır və debit = credit olmalıdır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: string
 *                       example: "Cash"
 *                     type:
 *                       type: string
 *                       enum: [debit, credit]
 *                       example: "debit"
 *                     amount:
 *                       type: number
 *                       example: 5000
 *                     description:
 *                       type: string
 *                       example: "Payment received"
 *     responses:
 *       201:
 *         description: Transaction uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Yanlış entry məlumatı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Debit və Credit bərabər olmalıdır."
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.post("/", protect, createTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Bütün transaction-ları gətir
 *     tags: [Transactions]
 *     description: Verilənlər bazasındakı bütün transaction-ları (əməliyyatları) qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Transaction-lar uğurla gətirildi
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
 *                     $ref: '#/components/schemas/Transaction'
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/", protect, getAllTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: ID üzrə transaction gətir
 *     tags: [Transactions]
 *     description: Verilən ID-ə uyğun transaction məlumatını qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction-un MongoDB ID-si
 *     responses:
 *       200:
 *         description: Transaction tapıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction tapılmadı"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/:id", protect, getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Transaction-u yenilə
 *     tags: [Transactions]
 *     description: Verilən ID-ə uyğun transaction məlumatlarını yeniləyir. Əgər entries mövcuddursa, debit = credit olmalıdır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction-un MongoDB ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entries:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: string
 *                       example: "Cash"
 *                     type:
 *                       type: string
 *                       enum: [debit, credit]
 *                       example: "debit"
 *                     amount:
 *                       type: number
 *                       example: 5000
 *                     description:
 *                       type: string
 *                       example: "Payment update"
 *     responses:
 *       200:
 *         description: Transaction uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Yanlış entry məlumatı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Debit və Credit bərabər olmalıdır."
 *       404:
 *         description: Transaction tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction tapılmadı"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.put("/:id", protect, updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Transaction-u sil
 *     tags: [Transactions]
 *     description: Verilən ID-ə uyğun transaction-u silir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction-un MongoDB ID-si
 *     responses:
 *       200:
 *         description: Transaction uğurla silindi
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
 *                   example: "Transaction silindi"
 *       404:
 *         description: Transaction tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction tapılmadı"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server xətası"
 */

router.delete("/:id", protect, deleteTransaction);

export default router;
