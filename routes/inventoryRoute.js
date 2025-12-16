import express from "express";

import {
    changeInventoryStatus,
    createInventory,
    editInventory,
    getAllInventory,
    getSingleInventory,
} from "../controllers/inventoryController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Inventory
 *     description: Inventory management
 */

/**
 * @openapi
 * /api/inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: Get all inventory records
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
 *         description: Inventory records retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No inventory records found
 */

router.get("/", protect, getAllInventory);

/**
 * @openapi
 * /api/inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get a single inventory record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     responses:
 *       200:
 *         description: Inventory record retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inventory record not found
 */
router.get("/:id", protect, getSingleInventory);

/**
 * @openapi
 * /api/inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Create an inventory record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [SKU, product, warehouseId, localtion, quantity, cost]
 *             properties:
 *               SKU:
 *                 type: string
 *               product:
 *                 type: string
 *               warehouseId:
 *                 type: string
 *               localtion:
 *                 type: string
 *               quantity:
 *                 type: number
 *               cost:
 *                 type: number
 *               totalValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Inventory record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createInventory);

/**
 * @openapi
 * /api/inventory/{id}:
 *   patch:
 *     tags: [Inventory]
 *     summary: Update an inventory record by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               SKU:
 *                 type: string
 *               product:
 *                 type: string
 *               warehouseId:
 *                 type: string
 *               localtion:
 *                 type: string
 *               quantity:
 *                 type: number
 *               cost:
 *                 type: number
 *               totalValue:
 *                 type: number
 *     responses:
 *       200:
 *         description: Inventory record updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inventory record not found
 */
router.patch("/:id", protect, editInventory);

/**
 * @openapi
 * /api/inventory/{id}/status:
 *   patch:
 *     tags: [Inventory]
 *     summary: Toggle inventory record active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory record ID
 *     responses:
 *       200:
 *         description: Inventory record status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Inventory record not found
 */
router.patch("/:id/status", protect, changeInventoryStatus);
export default router;
