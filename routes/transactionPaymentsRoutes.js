import express from "express";

import {
    changeTransactionPaymentStatus,
    createTransactionPayment,
    editTransactionPayment,
    getAllTransactionPayments,
    getSingleTransactionPayment,
} from "../controllers/transactionPaymentController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: TransactionPayments
 *     description: Customer payment management
 */

/**
 * @openapi
 * /api/transaction-payments:
 *   get:
 *     tags: [TransactionPayments]
 *     summary: Get all payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Full-text search query
 *     responses:
 *       200:
 *         description: TransactionPayments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No payments found
 */

router.get("/", protect, getAllTransactionPayments);

/**
 * @openapi
 * /api/transaction-payments/{id}:
 *   get:
 *     tags: [TransactionPayments]
 *     summary: Get a single payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TransactionPayment ID
 *     responses:
 *       200:
 *         description: TransactionPayment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TransactionPayment not found
 */
router.get("/:id", protect, getSingleTransactionPayment);

/**
 * @openapi
 * /api/transaction-payments:
 *   post:
 *     tags: [TransactionPayments]
 *     summary: Create a payment record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, customerId, invoiceNumber, amount, method, status]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               customerId:
 *                 type: string
 *               invoiceNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [Cash, Credit Card, Bank Transfer]
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Cancelled]
 *     responses:
 *       201:
 *         description: TransactionPayment record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post("/", protect, createTransactionPayment);

/**
 * @openapi
 * /api/transaction-payments/{id}:
 *   patch:
 *     tags: [TransactionPayments]
 *     summary: Update a payment record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TransactionPayment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               customerId:
 *                 type: string
 *               invoiceNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [Cash, Credit Card, Bank Transfer]
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: TransactionPayment record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TransactionPayment record not found
 */
router.patch("/:id", protect, editTransactionPayment);

/**
 * @openapi
 * /api/transaction-payments/{id}/status:
 *   patch:
 *     tags: [TransactionPayments]
 *     summary: Toggle payment record active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TransactionPayment ID
 *     responses:
 *       200:
 *         description: TransactionPayment record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: TransactionPayment record not found
 */
router.patch("/:id/status", protect, changeTransactionPaymentStatus);
export default router;
