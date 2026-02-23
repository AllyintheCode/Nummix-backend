import express from 'express';
import {
  getDashboardData,
  getWeeklyAttendance,
  getDepartmentDetails,
  getPaymentStatistics,
  getEmployeeGroupStats,
  getRealTimeDashboard,
  getBalanceBreakdownPercentages,
  getPaymentAnalytics,
  getEmployeeFlowStats,
  getUserStatistics,
  testDashboard
} from '../controllers/dashboardController.js';
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistikaları və analitika API-ləri
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Dashboard ümumi məlumatları
 *     tags: [Dashboard]
 *     description: İşçi, maaş, davamlılıq və ödəniş statistikalarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard məlumatları uğurla gətirildi
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: number
 *                           example: 45
 *                         totalGrossSalary:
 *                           type: number
 *                           example: 50000
 *                         totalNetSalary:
 *                           type: number
 *                           example: 35000
 *                     recentPayments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           employeeName:
 *                             type: string
 *                           amount:
 *                             type: number
 *       401:
 *         description: İstifadəçi məlumatları tapılmadı
 *       500:
 *         description: Server xətası
 */
router.get('/', protect, getDashboardData);

/**
 * @swagger
 * /api/dashboard/weekly-attendance:
 *   get:
 *     summary: Həftəlik davamlılıq statistikaları
 *     tags: [Dashboard]
 *     description: Həftə üzrə işçi davamlılıq məlumatlarını gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Həftənin başlanğıc tarixi (opsional)
 *     responses:
 *       200:
 *         description: Həftəlik davamlılıq məlumatları
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
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           dayName:
 *                             type: string
 *                           attendance:
 *                             type: object
 *       500:
 *         description: Server xətası
 */
router.get('/weekly-attendance', protect, getWeeklyAttendance);

/**
 * @swagger
 * /api/dashboard/department/{department}:
 *   get:
 *     summary: Departament detallı məlumatları
 *     tags: [Dashboard]
 *     description: Müəyyən departament üzrə işçi və maaş statistikaları
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *         description: Departament adı
 *     responses:
 *       200:
 *         description: Departament məlumatları
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
 *                     department:
 *                       type: string
 *                     statistics:
 *                       type: object
 *                     employees:
 *                       type: array
 *       400:
 *         description: Departament adı təqdim edilməyib
 *       500:
 *         description: Server xətası
 */
router.get('/department/:department', protect, getDepartmentDetails);

/**
 * @swagger
 * /api/dashboard/payment-statistics:
 *   get:
 *     summary: Ödəniş statistikaları
 *     tags: [Dashboard]
 *     description: Maaş ödənişləri və trend analitikası
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Ay nömrəsi (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *     responses:
 *       200:
 *         description: Ödəniş statistikaları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server xətası
 */
router.get('/payment-statistics', protect, getPaymentStatistics);

/**
 * @swagger
 * /api/dashboard/employee-group-stats:
 *   get:
 *     summary: İşçi qrupları statistikaları
 *     tags: [Dashboard]
 *     description: Vəzifə, işə qəbul ili və maaş aralıqları üzrə qruplaşdırma
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: İşçi qrupları statistikaları
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
 *                     positions:
 *                       type: array
 *                     hireYears:
 *                       type: array
 *       500:
 *         description: Server xətası
 */
router.get('/employee-group-stats', protect, getEmployeeGroupStats);

/**
 * @swagger
 * /api/dashboard/realtime:
 *   get:
 *     summary: Real-time dashboard məlumatları
 *     tags: [Dashboard]
 *     description: Günlük davamlılıq, ödənişlər və aktivliklər
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time məlumatlar
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
 *                     today:
 *                       type: object
 *                     upcoming:
 *                       type: object
 *       500:
 *         description: Server xətası
 */
router.get('/realtime', protect, getRealTimeDashboard);

/**
 * @swagger
 * /api/dashboard/balance-breakdown:
 *   get:
 *     summary: Balans bölgüsü faizləri
 *     tags: [Dashboard]
 *     description: Maaş, vergi və departament bölgüsü üzrə faiz analitikası
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balans bölgüsü məlumatları
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
 *                     balanceBreakdown:
 *                       type: object
 *                     summary:
 *                       type: object
 *       500:
 *         description: Server xətası
 */
router.get('/balance-breakdown', protect, getBalanceBreakdownPercentages);

/**
 * @swagger
 * /api/dashboard/payment-analytics:
 *   get:
 *     summary: Ödəniş analitikası
 *     tags: [Dashboard]
 *     description: Cashflow, overdue ödənişlər və ödəniş statistikaları
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ödəniş analitikası məlumatları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server xətası
 */
router.get('/payment-analytics', protect, getPaymentAnalytics);

/**
 * @swagger
 * /api/dashboard/employee-flow-stats:
 *   get:
 *     summary: İşçi axını statistikaları
 *     tags: [Dashboard]
 *     description: İşə qəbul, işdən çıxma və səbəblər üzrə statistikalar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl (opsional, cari il default)
 *     responses:
 *       200:
 *         description: İşçi axını statistikaları
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server xətası
 */
router.get('/employee-flow-stats', protect, getEmployeeFlowStats);

/**
 * @swagger
 * /api/dashboard/user-statistics:
 *   get:
 *     summary: İstifadəçi statistikaları
 *     tags: [Dashboard]
 *     description: İstifadəçi və şirkət aylıq statistikaları
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: İstifadəçi statistikaları
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
 *                     userInfo:
 *                       type: object
 *                     monthlyActive:
 *                       type: array
 *       404:
 *         description: İstifadəçi tapılmadı
 *       500:
 *         description: Server xətası
 */
router.get('/user-statistics', protect, getUserStatistics);

/**
 * @swagger
 * /api/dashboard/test:
 *   get:
 *     summary: Dashboard API test endpointi
 *     tags: [Dashboard]
 *     description: Bütün endpointləri siyahılayan test endpointi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API işləyir
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *       500:
 *         description: Server xətası
 */
router.get('/test', protect, testDashboard);

export default router;