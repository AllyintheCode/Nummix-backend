const express = require("express");
const router = express.Router();
const cashAndBankController = require("../controllers/CashAndBankController");

/**
 * @swagger
 * /cash-and-bank:
 *   post:
 *     summary: Yeni nağd və bank əməliyyatı yaratmaq
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 enum: [Cash, Bank]
 *               type:
 *                 type: string
 *                 enum: [debit, credit]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction yaradıldı
 */
router.post("/", cashAndBankController.createTransaction);

/**
 * @swagger
 * /cash-and-bank:
 *   get:
 *     summary: Bütün əməliyyatları gətirmək
 *     responses:
 *       200:
 *         description: Transaction siyahısı
 */
router.get("/", cashAndBankController.getAllTransactions);

/**
 * @swagger
 * /cash-and-bank/{id}:
 *   get:
 *     summary: ID üzrə əməliyyat məlumatını gətirmək
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
router.get("/:id", cashAndBankController.getTransactionById);

/**
 * @swagger
 * /cash-and-bank/{id}:
 *   put:
 *     summary: Əməliyyatı yeniləmək
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
 *               account:
 *                 type: string
 *                 enum: [Cash, Bank]
 *               type:
 *                 type: string
 *                 enum: [debit, credit]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction yeniləndi
 */
router.put("/:id", cashAndBankController.updateTransaction);

/**
 * @swagger
 * /cash-and-bank/{id}:
 *   delete:
 *     summary: Əməliyyatı silmək
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
router.delete("/:id", cashAndBankController.deleteTransaction);

module.exports = router;
