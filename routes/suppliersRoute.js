import express from "express";

import {
    changeSupplierStatus,
    createSupplier,
    editSupplier,
    getAllSuppliers,
    getSingleSupplier,
} from "../controllers/suppliersController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Suppliers
 *     description: Supplier management
 */

/**
 * @openapi
 * /api/suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get all suppliers
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
 *         description: Suppliers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No suppliers found
 */

router.get("/", protect, getAllSuppliers);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get a single supplier by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.get("/:id", protect, getSingleSupplier);

/**
 * @openapi
 * /api/suppliers:
 *   post:
 *     tags: [Suppliers]
 *     summary: Create a new supplier
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, taxId, contactName, phoneNumber, contactEmail, address]
 *             properties:
 *               companyName:
 *                 type: string
 *               taxId:
 *                 type: string
 *               contactName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createSupplier);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   patch:
 *     tags: [Suppliers]
 *     summary: Update a supplier by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               taxId:
 *                 type: string
 *               contactName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.patch("/:id", protect, editSupplier);

/**
 * @openapi
 * /api/suppliers/{id}/status:
 *   patch:
 *     tags: [Suppliers]
 *     summary: Toggle supplier active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.patch("/:id/status", protect, changeSupplierStatus);
export default router;
