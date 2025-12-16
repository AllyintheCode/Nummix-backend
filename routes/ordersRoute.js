import express from "express";

import {
    changeOrderStatus,
    createOrder,
    editOrder,
    getAllOrders,
    getSingleOrder,
} from "../controllers/ordersController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Order management
 */

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
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
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No orders found
 */

router.get("/", protect, getAllOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get a single order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get("/:id", protect, getSingleOrder);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderNumber, supplierId, date, deliveryDate, amount]
 *             properties:
 *               orderNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Shipped, Delivered, Cancelled, Delayed]
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.post("/", protect, createOrder);

/**
 * @openapi
 * /api/orders/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update an order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Pending, Shipped, Delivered, Cancelled, Delayed]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.patch("/:id", protect, editOrder);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Toggle order active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order active status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.patch("/:id/status", protect, changeOrderStatus);
export default router;
