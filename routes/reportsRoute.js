import { Router } from "express";
import { 
  getReportByCategory, 
  getReportByLocation, 
  getDepreciationSummary 
} from "../controllers/reportController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Hesabatlar
 */

/**
 * @swagger
 * /api/reports/by-category:
 *   get:
 *     summary: Kateqoriyalar üzrə hesabat
 *     tags: [Reports]
 *     description: Fəal aktivlərin kateqoriyalar üzrə bölgüsü, ümumi dəyər, cari dəyər, amortizasiya və faiz nisbətlərini qaytarır.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Uğurlu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: number
 *                           totalValue:
 *                             type: number
 *                           currentValue:
 *                             type: number
 *                           depreciation:
 *                             type: number
 *                           depreciationPercent:
 *                             type: string
 *                     grandTotal:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                         currentValue:
 *                           type: number
 *                         depreciation:
 *                           type: number
 *                         depreciationPercent:
 *                           type: string
 *       500:
 *         description: Server xətası
 */
router.get("/by-category", protect, getReportByCategory);

/**
 * @swagger
 * /api/reports/by-location:
 *   get:
 *     summary: Lokasiyalar üzrə hesabat
 *     tags: [Reports]
 *     description: Fəal aktivlərin lokasiyalar üzrə bölgüsü, ümumi dəyər, cari dəyər və pay faizlərini qaytarır.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Uğurlu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           count:
 *                             type: number
 *                           totalValue:
 *                             type: number
 *                           currentValue:
 *                             type: number
 *                           share:
 *                             type: string
 *                     grandTotal:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                         totalValue:
 *                           type: number
 *                         currentValue:
 *                           type: number
 *                         share:
 *                           type: string
 *       500:
 *         description: Server xətası
 */
router.get("/by-location", protect, getReportByLocation);

/**
 * @swagger
 * /api/reports/depreciation-summary:
 *   get:
 *     summary: Amortizasiya xülasəsi
 *     tags: [Reports]
 *     description: Hər bir aktiv üçün ilkin dəyər, cari dəyər, amortizasiya məbləği və faizi, metodu və alış tarixini ehtiva edən hesabat.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Uğurlu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       invNo:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       initialValue:
 *                         type: number
 *                       currentValue:
 *                         type: number
 *                       depreciation:
 *                         type: number
 *                       depreciationRate:
 *                         type: string
 *                       depreciationMethod:
 *                         type: string
 *                       purchaseDate:
 *                         type: string
 *                         format: date
 *       500:
 *         description: Server xətası
 */
router.get("/depreciation-summary", protect, getDepreciationSummary);

export default router;