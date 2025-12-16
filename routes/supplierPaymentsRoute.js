import express from "express";

import {
    changeSupplierPaymentStatus,
    createSupplierPayment,
    editSupplierPayment,
    getAllSupplierPayments,
    getSingleSupplierPayment,
} from "../controllers/supplierPaymentsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Supplier Payments
 *     description: Supplier payment management
 */

/**
 * @openapi
 * /api/supplier-payments:
 *   get:
 *     tags: [Supplier Payments]
 *     summary: Get all supplier payments
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
 *         description: Supplier payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No supplier payments found
 */

router.get("/", protect, getAllSupplierPayments);

/**
 * @openapi
 * /api/supplier-payments/{id}:
 *   get:
 *     tags: [Supplier Payments]
 *     summary: Get a single supplier payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier payment ID
 *     responses:
 *       200:
 *         description: Supplier payment retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier payment not found
 */
router.get("/:id", protect, getSingleSupplierPayment);

/**
 * @openapi
 * /api/supplier-payments:
 *   post:
 *     tags: [Supplier Payments]
 *     summary: Create a supplier payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentNumber, supplierId, amount, balance, dueDate]
 *             properties:
 *               paymentNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               amount:
 *                 type: number
 *               balance:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               paid:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [Paid, Partially Paid, Overdue, Pending]
 *     responses:
 *       201:
 *         description: Supplier payment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.post("/", protect, createSupplierPayment);

/**
 * @openapi
 * /api/supplier-payments/{id}:
 *   patch:
 *     tags: [Supplier Payments]
 *     summary: Update a supplier payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               amount:
 *                 type: number
 *               balance:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               paid:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [Paid, Partially Paid, Overdue, Pending]
 *     responses:
 *       200:
 *         description: Supplier payment updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier payment not found
 */
router.patch("/:id", protect, editSupplierPayment);

/**
 * @openapi
 * /api/supplier-payments/{id}/status:
 *   patch:
 *     tags: [Supplier Payments]
 *     summary: Toggle supplier payment active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier payment ID
 *     responses:
 *       200:
 *         description: Supplier payment status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier payment not found
 */
router.patch("/:id/status", protect, changeSupplierPaymentStatus);
export default router;
