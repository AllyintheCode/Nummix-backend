import express from "express";

import {
    changeCustomerStatus,
    createCustomer,
    getAllCustomers,
    getSingleCustomer,
} from "../controllers/customersController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Customers
 *     description: Customer management
 */

/**
 * @openapi
 * /api/customers:
 *   get:
 *     tags: [Customers]
 *     summary: Get all customers
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
 *         description: Customers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No customers found
 */

router.get("/", protect, getAllCustomers);

/**
 * @openapi
 * /api/customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get a single customer by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get("/:id", protect, getSingleCustomer);

/**
 * @openapi
 * /api/customers:
 *   post:
 *     tags: [Customers]
 *     summary: Create a new customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, contactPerson, email, location, phone, tin, segment]
 *             properties:
 *               companyName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               location:
 *                 type: string
 *               phone:
 *                 type: string
 *               tin:
 *                 type: string
 *               segment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", protect, createCustomer);

/**
 * @openapi
 * /api/customers/{id}/status:
 *   patch:
 *     tags: [Customers]
 *     summary: Toggle customer active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.patch("/:id/status", protect, changeCustomerStatus);

export default router;
