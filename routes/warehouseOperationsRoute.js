import express from "express";

import {
    createDelivery,
    createGRN,
    createTransfer,
    getWarehouseHistory,
} from "../controllers/warehouseOperationsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Warehouse Operations
 *     description: Goods receipt, delivery, transfer and warehouse history
 */

/**
 * @openapi
 * /api/warehouse-operations/grn:
 *   post:
 *     tags: [Warehouse Operations]
 *     summary: Create a goods receipt note (GRN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, quantity]
 *             properties:
 *               warehouseId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               lotSerial:
 *                 type: string
 *               quality:
 *                 type: string
 *                 enum: [Accept, Reject, Hold]
 *               purchaseOrder:
 *                 type: string
 *               notes:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Goods receipt recorded
 *       400:
 *         description: Validation/stock/capacity error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse or product not found
 */

router.post("/grn", protect, createGRN);

/**
 * @openapi
 * /api/warehouse-operations/delivery:
 *   post:
 *     tags: [Warehouse Operations]
 *     summary: Record a delivery (stock out)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [warehouseId, productId, quantity]
 *             properties:
 *               warehouseId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               lotSerial:
 *                 type: string
 *               notes:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Delivery recorded
 *       400:
 *         description: Validation/stock error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse or product not found
 */
router.post("/delivery", protect, createDelivery);

/**
 * @openapi
 * /api/warehouse-operations/transfer:
 *   post:
 *     tags: [Warehouse Operations]
 *     summary: Transfer stock between warehouses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromWarehouseId, toWarehouseId, productId, quantity]
 *             properties:
 *               fromWarehouseId:
 *                 type: string
 *               toWarehouseId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               lotSerial:
 *                 type: string
 *               notes:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Transfer completed
 *       400:
 *         description: Validation/stock error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse(s) or product not found
 */
router.post("/transfer", protect, createTransfer);

/**
 * @openapi
 * /api/warehouse-operations/history:
 *   get:
 *     tags: [Warehouse Operations]
 *     summary: Get warehouse operation history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *         required: true
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: History retrieved
 *       400:
 *         description: warehouseId is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse not found
 */
router.get("/history", protect, getWarehouseHistory);

export default router;
