import express from "express";

import {
    changeWarehouseStatus,
    createWarehouse,
    editWarehouse,
    getAllWarehouses,
    getSingleWarehouse,
} from "../controllers/warehousesController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Warehouses
 *     description: Warehouse management
 */

/**
 * @openapi
 * /api/warehouses:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get all warehouses
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
 *         description: Warehouses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No warehouses found
 */

router.get("/", protect, getAllWarehouses);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   get:
 *     tags: [Warehouses]
 *     summary: Get a single warehouse by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse not found
 */
router.get("/:id", protect, getSingleWarehouse);

/**
 * @openapi
 * /api/warehouses:
 *   post:
 *     tags: [Warehouses]
 *     summary: Create a new warehouse
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location, capacity]
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               capacity:
 *                 type: number
 *               stock:
 *                 type: array
 *                 description: Optional initial stock
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     lotSerial:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     quality:
 *                       type: string
 *                       enum: [Accept, Reject, Hold]
 *               history:
 *                 type: array
 *                 description: Optional initial history entries
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}:
 *   patch:
 *     tags: [Warehouses]
 *     summary: Update a warehouse by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               capacity:
 *                 type: number
 *               stock:
 *                 type: array
 *                 items:
 *                   type: object
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse not found
 */
router.patch("/:id", protect, editWarehouse);

/**
 * @openapi
 * /api/warehouses/{id}/status:
 *   patch:
 *     tags: [Warehouses]
 *     summary: Toggle warehouse active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Warehouse not found
 */
router.patch("/:id/status", protect, changeWarehouseStatus);
export default router;
