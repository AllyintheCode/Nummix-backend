import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
} from "../controllers/CashAndBankController.js";

import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: CashAndBank
 *     description: Cash və Bank əməliyyatları üçün API-lər
 */

/**
 * @swagger
 * /api/cash-bank:
 *   post:
 *     summary: Yeni əməliyyat əlavə et
 *     tags:[CashAndBank]
 *     description: Yeni əməliyyat (cash və bank) əlavə edir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operationType:
 *                 type: string
 *                 description: Əməliyyat növü (məs: "income", "expense")
 *                 example: "income"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               category:
 *                 type: string
 *                 example: "Sales"
 *               type:
 *                 type: string
 *                 description: "cash" və ya "bank"
 *                 example: "bank"
 *               account:
 *                 type: string
 *                 description: Bank əməliyyatları üçün hesab adı
 *                 example: "Bank of America"
 *               description:
 *                 type: string
 *                 example: "Payment received from client"
 *               createdBy:
 *                 type: string
 *                 example: "650f1c2b4a3d2c00123abcd4"
 *     responses:
 *       201:
 *         description: Əməliyyat uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 operationType:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 category:
 *                   type: string
 *                 type:
 *                   type: string
 *                 account:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdBy:
 *                   type: string
 *       400:
 *         description: Yanlış məlumat göndərildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.post("/", protect, createTransaction);

/**
 * @swagger
 * /api/cash-bank:
 *   get:
 *     summary: Bütün əməliyyatları gətir
 *     tags: [CashAndBank]
 *     description: Sistemdə mövcud olan bütün əməliyyatları qaytarır. Hər əməliyyatın yaradıcı istifadəçisi də göstərilir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Əməliyyatlar uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   operationType:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   category:
 *                     type: string
 *                   type:
 *                     type: string
 *                   account:
 *                     type: string
 *                   description:
 *                     type: string
 *                   createdBy:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       fullName:
 *                         type: string
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.get("/", protect, getAllTransactions);

/**
 * @swagger
 * /api/cash-bank/{id}:
 *   get:
 *     summary: Müəyyən əməliyyatı ID üzrə gətir
 *     tags: [CashAndBank]
 *     description: Verilmiş ID-ə uyğun əməliyyatı qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Əməliyyatın Mongo ObjectId-si
 *         example: "650f1c2b4a3d2c00123abcd4"
 *     responses:
 *       200:
 *         description: Əməliyyat uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 operationType:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 category:
 *                   type: string
 *                 type:
 *                   type: string
 *                 account:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdBy:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *       404:
 *         description: Əməliyyat tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction not found"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

router.get("/:id", protect, getTransactionById);

/**
 * @swagger
 * /api/cash-bank/{id}:
 *   put:
 *     summary: Mövcud əməliyyatı yenilə
 *     tags: [CashAndBank]
 *     description: Verilmiş ID-ə uyğun əməliyyatı yeniləyir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yenilənəcək əməliyyatın Mongo ObjectId-si
 *         example: "650f1c2b4a3d2c00123abcd4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operationType:
 *                 type: string
 *                 example: "expense"
 *               amount:
 *                 type: number
 *                 example: 500
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               category:
 *                 type: string
 *                 example: "Supplies"
 *               type:
 *                 type: string
 *                 example: "cash"
 *               account:
 *                 type: string
 *                 example: "Bank of America"
 *               description:
 *                 type: string
 *                 example: "Purchase of office supplies"
 *               createdBy:
 *                 type: string
 *                 example: "650f1c2b4a3d2c00123abcd4"
 *     responses:
 *       200:
 *         description: Əməliyyat uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 operationType:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 category:
 *                   type: string
 *                 type:
 *                   type: string
 *                 account:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdBy:
 *                   type: string
 *       404:
 *         description: Əməliyyat tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction not found"
 *       400:
 *         description: Yanlış məlumat göndərildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid data"
 */

router.put("/:id", protect, updateTransaction);

/**
 * @swagger
 * /api/cash-bank/{id}:
 *   delete:
 *     summary: Mövcud əməliyyatı sil
 *     tags: [CashAndBank]
 *     description: Verilmiş ID-ə uyğun əməliyyatı silir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Silinəcək əməliyyatın Mongo ObjectId-si
 *         example: "650f1c2b4a3d2c00123abcd4"
 *     responses:
 *       200:
 *         description: Əməliyyat uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction deleted successfully"
 *       404:
 *         description: Əməliyyat tapılmadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transaction not found"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

router.delete("/:id", protect, deleteTransaction);

export default router;
