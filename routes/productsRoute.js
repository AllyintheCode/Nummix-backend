import express from "express";

import {
    changeProductStatus,
    createProduct,
    editProduct,
    getAllProducts,
    getSingleProduct,
} from "../controllers/productsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Product management
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products
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
 *         description: Products retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No products found
 */

router.get("/", protect, getAllProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get("/:id", protect, getSingleProduct);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [SKU, barcode, name, category, unitOfMeasure, minStock, maxStock, price, storageLocation]
 *             properties:
 *               SKU:
 *                 type: string
 *               barcode:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               unitOfMeasure:
 *                 type: string
 *                 enum: [kg, g, lb, oz, l, ml, pieces]
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *               price:
 *                 type: number
 *               storageLocation:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Down, Good]
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               SKU:
 *                 type: string
 *               barcode:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               unitOfMeasure:
 *                 type: string
 *                 enum: [kg, g, lb, oz, l, ml, pieces]
 *               minStock:
 *                 type: number
 *               maxStock:
 *                 type: number
 *               price:
 *                 type: number
 *               storageLocation:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Down, Good]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.patch("/:id", protect, editProduct);

/**
 * @openapi
 * /api/products/{id}/status:
 *   patch:
 *     tags: [Products]
 *     summary: Toggle product active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product active status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.patch("/:id/status", protect, changeProductStatus);
export default router;
