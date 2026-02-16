import express from "express";

import {
    changeInvoiceStatus,
    createInvoice,
    editInvoice,
    getAllInvoices,
    getSingleInvoice,
} from "../controllers/invoicesController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Invoices
 *     description: Invoice management
 */

/**
 * @openapi
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: Get all invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No invoices found
 */

router.get("/", protect, getAllInvoices);

/**
 * @openapi
 * /api/invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get a single invoice by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.get("/:id", protect, getSingleInvoice);

/**
 * @openapi
 * /api/invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create a new invoice
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceNumber, customerId, date, currency, paymentTerm, products]
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               customerId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, AZN]
 *               paymentTerm:
 *                 type: string
 *                 enum: [15 days, 30 days, 60 days]
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productName, quantity, price]
 *                   properties:
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     discount:
 *                       type: number
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post("/", protect, createInvoice);

/**
 * @openapi
 * /api/invoices/{id}:
 *   patch:
 *     tags: [Invoices]
 *     summary: Update an invoice by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               customerId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, AZN]
 *               paymentTerm:
 *                 type: string
 *                 enum: [15 days, 30 days, 60 days]
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productName, quantity, price]
 *                   properties:
 *                     productName:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     discount:
 *                       type: number
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.patch("/:id", protect, editInvoice);

/**
 * @openapi
 * /api/invoices/{id}/status:
 *   patch:
 *     tags: [Invoices]
 *     summary: Toggle invoice active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.patch("/:id/status", protect, changeInvoiceStatus);

export default router;
