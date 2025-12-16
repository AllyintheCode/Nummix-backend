import express from "express";

import {
    changeAgreementStatus,
    createAgreement,
    editAgreement,
    getAllAgreements,
    getSingleAgreement,
} from "../controllers/agreementsController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Agreements
 *     description: Agreement management
 */

/**
 * @openapi
 * /api/agreements:
 *   get:
 *     tags: [Agreements]
 *     summary: Get all agreements
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
 *         description: Agreements retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No agreements found
 */

router.get("/", protect, getAllAgreements);

/**
 * @openapi
 * /api/agreements/{id}:
 *   get:
 *     tags: [Agreements]
 *     summary: Get a single agreement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agreement ID
 *     responses:
 *       200:
 *         description: Agreement retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Agreement not found
 */
router.get("/:id", protect, getSingleAgreement);

/**
 * @openapi
 * /api/agreements:
 *   post:
 *     tags: [Agreements]
 *     summary: Create a new agreement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agreementNumber, supplierId, startDate, endDate, amount]
 *             properties:
 *               agreementNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, AZN]
 *               terms:
 *                 type: string
 *                 enum: [30 days, 60 days, 90 days]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Agreement created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.post("/", protect, createAgreement);

/**
 * @openapi
 * /api/agreements/{id}:
 *   patch:
 *     tags: [Agreements]
 *     summary: Update an agreement by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agreement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agreementNumber:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, AZN]
 *               terms:
 *                 type: string
 *                 enum: [30 days, 60 days, 90 days]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agreement updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Agreement not found
 */
router.patch("/:id", protect, editAgreement);

/**
 * @openapi
 * /api/agreements/{id}/status:
 *   patch:
 *     tags: [Agreements]
 *     summary: Toggle agreement active status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agreement ID
 *     responses:
 *       200:
 *         description: Agreement status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Agreement not found
 */
router.patch("/:id/status", protect, changeAgreementStatus);
export default router;
