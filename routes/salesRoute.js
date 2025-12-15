import express from "express";

import {
    changeSaleStatus,
    createSale,
    editSale,
    getAllSales,
    getSingleSale,
} from "../controllers/salesController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Sales
 *     description: Sales management
 */

/**
 * @openapi
 * /api/sales:
 *   get:
 *     tags: [Sales]
 *     summary: Get all sales
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
 *         description: Sales records retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No sales records found
 */

router.get("/", protect, getAllSales);

/**
 * @openapi
 * /api/sales/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get a single sale by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale record retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale record not found
 */
router.get("/:id", protect, getSingleSale);

/**
 * @openapi
 * /api/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a sale record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceNumber, date, customerId, amount]
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               customerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Cancelled]
 *     responses:
 *       201:
 *         description: Sale record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post("/", protect, createSale);

/**
 * @openapi
 * /api/sales/{id}:
 *   patch:
 *     tags: [Sales]
 *     summary: Update a sale record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               customerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Sale record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale record not found
 */
router.patch("/:id", protect, editSale);

/**
 * @openapi
 * /api/sales/{id}/status:
 *   patch:
 *     tags: [Sales]
 *     summary: Toggle sale record active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sale record not found
 */
router.patch("/:id/status", protect, changeSaleStatus);
export default router;
