import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentStats,
  getNext7DaysSchedule,
} from "../controllers/PaymentController.js";

import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Ödənişlər üçün API-lər
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Yeni ödəniş əlavə et
 *     tags: [Payments]
 *     description: Yeni Payment (ödəmə) yaradaraq verilənlər bazasına əlavə edir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Ödəniş uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Yanlış məlumat göndərildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.post("/", protect, createPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Bütün ödənişləri gətir
 *     tags: [Payments]
 *     description: Verilənlər bazasındakı bütün Payment (ödəmə) qeydlərini qaytarır.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Ödənişlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/", protect, getAllPayments);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Ödəniş və alacaqlar üzrə statistik məlumatlar
 *     tags: [Payments]
 *     description: Ödənişlərin (outflow) və alacaqların (receipt) toplam məbləğini və gecikmiş ödənişləri/alacaqları göstərir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Ödəniş statistikası uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOutflow:
 *                   type: number
 *                   example: 12000
 *                 totalReceivable:
 *                   type: number
 *                   example: 15000
 *                 overduePayments:
 *                   type: number
 *                   example: 3
 *                 overdueReceivables:
 *                   type: number
 *                   example: 2
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/stats", protect, getPaymentStats);

/**
 * @swagger
 * /api/payments/schedule:
 *   get:
 *     summary: Növbəti 7 gün üçün planlaşdırılmış ödənişlər və gəlirlər
 *     tags: [Payments]
 *     description: Növbəti 7 gün ərzində ödənişlər və alacaqlar üzrə planlaşdırılmış məlumatları göstərir. Gecikmiş ödənişlər "Təcili" olaraq işarələnir.
 *     security:
 *       - bearerAuth: []   # JWT tələb olunur
 *     responses:
 *       200:
 *         description: Növbəti 7 günün ödəniş/gəlir planı uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-12-15T00:00:00.000Z"
 *                   supplierName:
 *                     type: string
 *                     example: "ABC Supplier"
 *                   type:
 *                     type: string
 *                     example: "outflow"
 *                   amount:
 *                     type: number
 *                     example: 5000
 *                   urgent:
 *                     type: string
 *                     nullable: true
 *                     example: "Təcili"
 *       500:
 *         description: Server xətası baş verdi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xətası"
 */

router.get("/schedule", protect, getNext7DaysSchedule);

export default router;
