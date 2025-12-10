import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentStats,
  getNext7DaysSchedule,
} from "../controllers/PaymentController.js";

const router = express.Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Yeni ödəniş yaratmaq
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ödəniş yaradıldı
 */
router.post("/", createPayment);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Bütün ödənişləri gətirmək
 *     responses:
 *       200:
 *         description: Ödəniş siyahısı
 */
router.get("/", getAllPayments);

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Ödəniş statistikasını gətirmək
 *     responses:
 *       200:
 *         description: Ödəniş statistik məlumatları
 *         content:
 *           application/json:
 *             example:
 *               totalPayments: 100
 *               totalAmount: 50000
 */
router.get("/stats", getPaymentStats);

/**
 * @swagger
 * /payments/schedule:
 *   get:
 *     summary: Növbəti 7 gün üçün ödəniş cədvəli
 *     responses:
 *       200:
 *         description: 7 günlük ödəniş planı
 *         content:
 *           application/json:
 *             example:
 *               - date: "2025-11-15"
 *                 amount: 1000
 *               - date: "2025-11-16"
 *                 amount: 1500
 */
router.get("/schedule", getNext7DaysSchedule);

export default router;
