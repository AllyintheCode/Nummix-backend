import express from "express";

import {
    changePaymentStatus,
    createPayment,
    editPayment,
    getALLPayments,
    getSinglePayment,
} from "../controllers/paymentsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Customer payment management
 */

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags: [Payments]
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
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No payments found
 */

router.get("/", protect, getALLPayments);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get a single payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
router.get("/:id", protect, getSinglePayment);

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Payments]
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
 *         description: Payment record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post("/", protect, createPayment);

/**
 * @openapi
 * /api/payments/{id}:
 *   patch:
 *     tags: [Payments]
 *     summary: Update a payment record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
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
 *         description: Payment record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment record not found
 */
router.patch("/:id", protect, editPayment);

/**
 * @openapi
 * /api/payments/{id}/status:
 *   patch:
 *     tags: [Payments]
 *     summary: Toggle payment record active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment record not found
 */
router.patch("/:id/status", protect, changePaymentStatus);
export default router;
