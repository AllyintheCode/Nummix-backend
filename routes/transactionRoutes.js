import express from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/TransactionController.js";

const router = express.Router();

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Yeni transaction yaratmaq
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
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: string
 *                       enum: [Cash, Bank, Sales, Expense]
 *                     type:
 *                       type: string
 *                       enum: [debit, credit]
 *                     amount:
 *                       type: number
 *     responses:
 *       201:
 *         description: Transaction yaradıldı
 */
router.post("/", createTransaction);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Bütün transaction-ları gətirmək
 *     responses:
 *       200:
 *         description: Transaction siyahısı
 */
router.get("/", getAllTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: ID üzrə transaction məlumatını gətirmək
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction məlumatı
 */
router.get("/:id", getTransactionById);

/**
 * @swagger
 * /transactions/{id}:
 *   put:
 *     summary: Transaction yeniləmək
 *     parameters:
 *       - in: path
 *         name: id
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
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     account:
 *                       type: string
 *                       enum: [Cash, Bank, Sales, Expense]
 *                     type:
 *                       type: string
 *                       enum: [debit, credit]
 *                     amount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Transaction yeniləndi
 */
router.put("/:id", updateTransaction);

/**
 * @swagger
 * /transactions/{id}:
 *   delete:
 *     summary: Transaction silmək
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction silindi
 */
router.delete("/:id", deleteTransaction);

export default router;
