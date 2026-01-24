import express from 'express';
import {
  getCompanySalarySummary,
  getDepartmentSalaryDistribution,
  getEmployeeTurnover,
  getAttendanceStatistics,
  getCompanyDashboardStats,
  getYearlyMonthlySalaryStats,
  getYearlyDepartmentSalaryDistribution,
  getMonthlyKPIs
} from '../controllers/statsController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Statistics
 *     description: Statistika və analitika məlumatları
 *   - name: Dashboard
 *     description: Dashboard üçün statistik məlumatlar
 */

// ===================== DASHBOARD STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/dashboard-stats:
 *   get:
 *     summary: Şirkət dashboard ümumi statistikaları
 *     description: |
 *       Şirkət dashboard üçün əsas statistik göstəricilər:
 *       - Ümumi işçi sayı
 *       - Aktiv işçi sayı
 *       - Orta maaş
 *       - Aylıq gəlir/xərc
 *       - Departament statistikaları
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: Vaxt periodu
 *         example: monthly
 *     responses:
 *       200:
 *         description: Dashboard statistikaları
 */
router.get('/dashboard-stats', protect,  getCompanyDashboardStats);

// ===================== MAAŞ STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/salary-summary:
 *   get:
 *     summary: Şirkət ümumi maaş xülasəsi
 *     description: |
 *       Şirkətin ümumi maaş statistikaları:
 *       - Ümumi brüt maaş
 *       - Ümumi net maaş
 *       - Vergi ödənişləri
 *       - Orta maaşlar
 *       - Departamentlər üzrə maaş paylanması
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *         description: Ay (1-12)
 *         example: 5
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *         example: 2024
 *     responses:
 *       200:
 *         description: Maaş statistikaları
 */
router.get('/salary-summary', protect,  getCompanySalarySummary);

/**
 * @swagger
 * /api/stats/{companyId}/department-salaries:
 *   get:
 *     summary: Departamentlər üzrə maaş paylanması
 *     description: |
 *       Hər departament üzrə maaş statistikaları:
 *       - Departament üzrə orta maaş
 *       - İşçi sayı
 *       - Ümumi maaş xərci
 *       - Maksimum/minimum maaş
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *     responses:
 *       200:
 *         description: Departament maaş statistikaları
 */
router.get('/department-salaries', protect, getDepartmentSalaryDistribution);

// ===================== ZAMAN SERIYALARI STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/yearly-salary-stats:
 *   get:
 *     summary: İl üzrə aylıq maaş statistikası
 *     description: |
 *       Bir il ərzində aylar üzrə maaş dəyişiklikləri:
 *       - Aylıq ümumi maaş
 *       - Aylıq orta maaş
 *       - Vergi dəyişiklikləri
 *       - Trend analizi
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *         example: 2024
 *     responses:
 *       200:
 *         description: İllik maaş statistikaları
 */
router.get('/yearly-salary-stats', protect,  getYearlyMonthlySalaryStats);

/**
 * @swagger
 * /api/stats/{companyId}/yearly-department-salaries:
 *   get:
 *     summary: İl üzrə departamentlər üzrə maaş bölgüsü
 *     description: |
 *       İllik departament maaş statistikaları:
 *       - Departamentlər üzrə illik xərc
 *       - Aylıq dəyişikliklər
 *       - İllik büdcə analizi
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *     responses:
 *       200:
 *         description: İllik departament maaş statistikaları
 */
router.get('/yearly-department-salaries', protect, getYearlyDepartmentSalaryDistribution);

// ===================== İŞÇİ STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/employee-turnover:
 *   get:
 *     summary: İşçi dövriyyəsi (giriş-çıxış)
 *     description: |
 *       İşçi dəyişikliklərinin statistikası:
 *       - Yeni işə götürülənlər
 *       - İşdən çıxarılanlar
 *       - Dövriyyə nisbəti
 *       - Sebəblər üzrə statistikalar
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlanğıc tarixi
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarixi
 *     responses:
 *       200:
 *         description: İşçi dövriyyə statistikaları
 */
router.get('/employee-turnover', protect,  getEmployeeTurnover);

// ===================== DAVAMIYYƏT STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/attendance-stats:
 *   get:
 *     summary: Davamiyyət statistikaları
 *     description: |
 *       İşçilərin davamiyyət statistikaları:
 *       - Gecikmələr
 *       - Gəlməmələr
 *       - İş saatları
 *       - Overtime statistikası
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Ay (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *     responses:
 *       200:
 *         description: Davamiyyət statistikaları
 */
router.get('/attendance-stats', protect,  getAttendanceStatistics);

// ===================== KPI STATISTIKALARI =====================
/**
 * @swagger
 * /api/stats/{companyId}/monthly-kpis:
 *   get:
 *     summary: Aylıq KPI göstəriciləri
 *     description: |
 *       Aylıq Performans Göstəriciləri:
 *       - Məhsuldarlıq
 *       - Maliyyə göstəriciləri
 *       - İnsan resursları metrikləri
 *       - Əvvəlki aylarla müqayisə
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: month
 *         schema:
 *           type: number
 *         description: Ay (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: İl
 *     responses:
 *       200:
 *         description: KPI statistikaları
 */
router.get('/monthly-kpis', protect,  getMonthlyKPIs);

export default router;