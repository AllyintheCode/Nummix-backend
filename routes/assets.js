// routes/assets.js
import express from "express";
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats,
  getAssetDocument,
  uploadAssetDocument,
  deleteAssetDocument,
  downloadAssetDocument,
  exportAssetsToExcel,
  testSimpleExcel,
  updateAssetStatus,
  searchAssets,
  downloadAllAssetsExcel,
  generateAndDownloadExcel,
  generateAndDownloadPdf,
  downloadCategoryExcel,
  getPreviousReports,
  exportSearchResultsToExcel,
  downloadAmortizationReportPDF,
  downloadFormattedAmortizationPDF,
  testSimplePDF,
  getAssetStatistics,
  getSimpleAssetStatistics,
  getDepartmentValues,
  getSimpleDepartmentValues,
  getAssetsExportPage,
  downloadAssetsCSV,
    getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryDetails,
  loadDefaultCategories,
    getReports,
  getReportDetails,
  deleteReport,
  cleanupOldReports


} from "../controllers/assetController.js";

import {
  uploadDocuments,
  handleUploadError,
} from "../middlewares/uploadMiddleware.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Vəsaitlərlə bağlı əməliyyatlar
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Kateqoriya əməliyyatları
 */

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Hesabat əməliyyatları
 */

/**
 * @swagger
 * tags:
 *   name: Exports
 *   description: İxrac əməliyyatları
 */

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Statistik əməliyyatlar
 */

// ===================== KATEQORİYA ƏMƏLİYYATLARI =====================
// ===================== HESABAT ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/users/{userId}/assets/reports/previous:
 *   get:
 *     summary: Əvvəlki hesabatları gətir
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Əvvəlki hesabatlar uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/reports/previous', protect, getPreviousReports);

/**
 * @swagger
 * /api/users/{userId}/assets/reports:
 *   get:
 *     summary: Bütün hesabatları gətir
 *     tags: [Reports]
 *     description: |
 *       İstifadəçinin bütün hesabatlarını gətirir.
 *       Filtirləmə parametrləri:
 *       - type: Hesabat tipi (excel, pdf, all)
 *       - startDate: Başlanğıc tarix
 *       - endDate: Bitmə tarix
 *       - limit: Hər səhifədəki element sayı
 *       - page: Səhifə nömrəsi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, excel, pdf]
 *           default: all
 *         description: Hesabat tipi
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Başlanğıc tarix (YYYY-MM-DD)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Bitmə tarix (YYYY-MM-DD)
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Hər səhifədəki element sayı
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Səhifə nömrəsi
 *     responses:
 *       200:
 *         description: Hesabatlar uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/reports', protect, getReports);

/**
 * @swagger
 * /api/users/{userId}/assets/reports/{reportId}:
 *   get:
 *     summary: Hesabat təfərrüatlarını gətir
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hesabat təfərrüatları uğurla gətirildi
 *       404:
 *         description: Hesabat tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/reports/:reportId', protect, getReportDetails);

/**
 * @swagger
 * /api/users/{userId}/assets/reports/{reportId}:
 *   delete:
 *     summary: Hesabatı sil
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hesabat uğurla silindi
 *       404:
 *         description: Hesabat tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.delete('/:userId/assets/reports/:reportId', protect, deleteReport);

/**
 * @swagger
 * /api/users/{userId}/assets/reports/cleanup:
 *   post:
 *     summary: Köhnə hesabatları təmizlə
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 90
 *                 description: Neçə gündən köhnə hesabatlar silinsin
 *     responses:
 *       200:
 *         description: Köhnə hesabatlar uğurla təmizləndi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.post('/:userId/assets/reports/cleanup', protect, cleanupOldReports);

/**
 * @swagger
 * /api/users/{userId}/categories:
 *   get:
 *     summary: Bütün kateqoriyaları gətir
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kateqoriyalar uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/categories', protect, getCategories);

/**
 * @swagger
 * /api/users/{userId}/categories/default:
 *   post:
 *     summary: Default kateqoriyaları yüklə
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default kateqoriyalar uğurla yükləndi
 *       400:
 *         description: İstifadəçinin artıq kateqoriyaları var
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.post('/:userId/categories/default', protect, loadDefaultCategories);

/**
 * @swagger
 * /api/users/{userId}/categories:
 *   post:
 *     summary: Yeni kateqoriya yarat
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Kateqoriya adı
 *               description:
 *                 type: string
 *                 description: Təsvir
 *               amortizationRate:
 *                 type: number
 *                 description: Amortizasiya dərəcəsi
 *               colorCode:
 *                 type: string
 *                 description: Rəng kodu
 *               icon:
 *                 type: string
 *                 description: İkon
 *     responses:
 *       201:
 *         description: Kateqoriya uğurla yaradıldı
 *       400:
 *         description: Kateqoriya adı artıq mövcuddur
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.post('/:userId/categories', protect, createCategory);

/**
 * @swagger
 * /api/users/{userId}/categories/{categoryId}:
 *   get:
 *     summary: Kateqoriya təfərrüatlarını gətir
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kateqoriya təfərrüatları uğurla gətirildi
 *       404:
 *         description: Kateqoriya tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/categories/:categoryId', protect, getCategoryDetails);

/**
 * @swagger
 * /api/users/{userId}/categories/{categoryId}:
 *   put:
 *     summary: Kateqoriyanı yenilə
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               amortizationRate:
 *                 type: number
 *               colorCode:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla yeniləndi
 *       400:
 *         description: Kateqoriya adı artıq mövcuddur
 *       404:
 *         description: Kateqoriya tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.put('/:userId/categories/:categoryId', protect, updateCategory);

/**
 * @swagger
 * /api/users/{userId}/categories/{categoryId}:
 *   delete:
 *     summary: Kateqoriyanı sil
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla silindi
 *       400:
 *         description: Bu kateqoriyaya aid vəsaitlər var
 *       404:
 *         description: Kateqoriya tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.delete('/:userId/categories/:categoryId', protect, deleteCategory);

// ===================== ŞÖBƏ STATİSTİKALARI =====================

/**
 * @swagger
 * /api/users/{userId}/departments/values:
 *   get:
 *     summary: Şöbələr üzrə dəyərləri gətir (ətraflı)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Şöbə dəyərləri uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/departments/values', protect, getDepartmentValues);

/**
 * @swagger
 * /api/users/{userId}/departments/values/simple:
 *   get:
 *     summary: Şöbələr üzrə dəyərləri gətir (sadə)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Şöbə dəyərləri uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/departments/values/simple', protect, getSimpleDepartmentValues);

// ===================== VƏSAİT ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/users/{userId}/assets:
 *   get:
 *     summary: İstifadəçinin bütün vəsaitlərini gətir
 *     tags: [Assets]
 *     description: |
 *       İstifadəçinin bütün vəsaitlərini siyahı şəklində gətirir.
 *       Filtirləmə parametrləri:
 *       - category: Kateqoriya üzrə filtr
 *       - location: Yer üzrə filtr
 *       - status: Status üzrə filtr
 *       - department: Şöbə üzrə filtr
 *       - responsiblePerson: Məsul şəxs üzrə filtr
 *       - isInsured: Sığorta olub-olmadığı
 *       - page: Səhifə nömrəsi (default: 1)
 *       - limit: Hər səhifədəki element sayı (default: 20)
 *       - sortBy: Sıralama sahəsi (default: createdAt)
 *       - sortOrder: Sıralama istiqaməti (asc/desc, default: desc)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: İstifadəçi ID-si
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Kateqoriya üzrə filtr
 *       - name: location
 *         in: query
 *         schema:
 *           type: string
 *         description: Yer üzrə filtr
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Status üzrə filtr (Aktiv, Passiv, Satılıb, Sıradan çıxıb, Təmir üçün, İcarədə)
 *       - name: department
 *         in: query
 *         schema:
 *           type: string
 *         description: Şöbə üzrə filtr
 *       - name: responsiblePerson
 *         in: query
 *         schema:
 *           type: string
 *         description: Məsul şəxs üzrə filtr
 *       - name: isInsured
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Sığorta olub-olmadığı
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Səhifə nömrəsi
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Hər səhifədəki element sayı
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, updatedAt, name, initialValue, currentValue, purchaseDate]
 *         description: Sıralama sahəsi
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sıralama istiqaməti
 *     responses:
 *       200:
 *         description: Vəsaitlər siyahısı uğurla gətirildi
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
 *                     $ref: '#/components/schemas/Asset'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalAssets:
 *                       type: integer
 *                     totalInitialValue:
 *                       type: number
 *                     totalCurrentValue:
 *                       type: number
 *                     totalAmortization:
 *                       type: number
 *                     activeAssets:
 *                       type: integer
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Vəsaitlər tapılmadı
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets', protect, getAllAssets);

/**
 * @swagger
 * /api/users/{userId}/assets/stats:
 *   get:
 *     summary: İstifadəçinin vəsait statistikalarını gətir
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistika məlumatları uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/stats', protect, getAssetStats);

/**
 * @swagger
 * /api/users/{userId}/assets/statistics:
 *   get:
 *     summary: Ətraflı vəsait statistikalarını gətir
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ətraflı statistika məlumatları uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/statistics', protect, getAssetStatistics);

/**
 * @swagger
 * /api/users/{userId}/assets/statistics/simple:
 *   get:
 *     summary: Sadə vəsait statistikalarını gətir
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sadə statistika məlumatları uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/statistics/simple', protect, getSimpleAssetStatistics);

/**
 * @swagger
 * /api/users/{userId}/assets/search:
 *   get:
 *     summary: Vəsaitlərdə axtarış
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Axtarış termini
 *       - name: field
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, name, inventoryNumber, category, location, serialNumber, account, department, responsiblePerson, notes]
 *           default: all
 *         description: Axtarış sahəsi
 *     responses:
 *       200:
 *         description: Axtarış nəticələri
 *       400:
 *         description: Axtarış termini tələb olunur
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/search', protect, searchAssets);

/**
 * @swagger
 * /api/users/{userId}/assets:
 *   post:
 *     summary: Yeni vəsait yarat (fayl ilə)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - account
 *               - location
 *               - initialValue
 *               - currentValue
 *               - purchaseDate
 *             properties:
 *               inventoryNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               account:
 *                 type: string
 *               location:
 *                 type: string
 *               initialValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               serviceLife:
 *                 type: integer
 *               notes:
 *                 type: string
 *               depreciationMethod:
 *                 type: string
 *                 enum: [Düz xətt, Azalan qalıq, İstehsal həcmi, İkiqat azalan, İllər cəmi]
 *               warrantyExpiryDate:
 *                 type: string
 *                 format: date
 *               nextMaintenanceDate:
 *                 type: string
 *                 format: date
 *               supplier:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               barcode:
 *                 type: string
 *               department:
 *                 type: string
 *               responsiblePerson:
 *                 type: string
 *               isInsured:
 *                 type: boolean
 *               insuranceExpiryDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: string
 *               document:
 *                 type: file
 *                 description: Sənəd faylı
 *     responses:
 *       201:
 *         description: Vəsait uğurla yaradıldı
 *       400:
 *         description: Yanlış məlumat göndərildi
 *       401:
 *         description: Yetkisiz giriş
 *       413:
 *         description: Fayl həcmi çox böyükdür
 *       415:
 *         description: Desteklenmeyen dosya türü
 *       500:
 *         description: Server xətası
 */
router.post(
  '/:userId/assets', 
  protect, 
  uploadDocuments.single('document'), 
  createAsset
);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}:
 *   get:
 *     summary: ID ilə vəsaiti gətir
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vəsait məlumatları uğurla gətirildi
 *       404:
 *         description: Vəsait tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/:assetId', protect, getAssetById);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}:
 *   put:
 *     summary: Vəsaiti yenilə (fayl ilə)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               account:
 *                 type: string
 *               location:
 *                 type: string
 *               initialValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb, Təmir üçün, İcarədə]
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               serviceLife:
 *                 type: integer
 *               notes:
 *                 type: string
 *               depreciationMethod:
 *                 type: string
 *                 enum: [Düz xətt, Azalan qalıq, İstehsal həcmi, İkiqat azalan, İllər cəmi]
 *               warrantyExpiryDate:
 *                 type: string
 *                 format: date
 *               nextMaintenanceDate:
 *                 type: string
 *                 format: date
 *               supplier:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               barcode:
 *                 type: string
 *               department:
 *                 type: string
 *               responsiblePerson:
 *                 type: string
 *               isInsured:
 *                 type: boolean
 *               insuranceExpiryDate:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: string
 *               document:
 *                 type: file
 *                 description: Yeni sənəd faylı
 *     responses:
 *       200:
 *         description: Vəsait uğurla yeniləndi
 *       404:
 *         description: Vəsait tapılmadı
 *       400:
 *         description: Yanlış məlumat göndərildi
 *       413:
 *         description: Fayl həcmi çox böyükdür
 *       415:
 *         description: Desteklenmeyen dosya türü
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.put(
  '/:userId/assets/:assetId', 
  protect, 
  uploadDocuments.single('document'), 
  updateAsset
);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}:
 *   delete:
 *     summary: Vəsaiti sil
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vəsait uğurla silindi
 *       404:
 *         description: Vəsait tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.delete('/:userId/assets/:assetId', protect, deleteAsset);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}/status:
 *   put:
 *     summary: Vəsait statusunu yenilə
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb, Təmir üçün, İcarədə]
 *     responses:
 *       200:
 *         description: Status uğurla yeniləndi
 *       400:
 *         description: Status tələb olunur
 *       404:
 *         description: Vəsait tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.put('/:userId/assets/:assetId/status', protect, updateAssetStatus);

// ===================== SƏNƏD ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}/document:
 *   get:
 *     summary: Vəsait sənəd məlumatlarını gətir
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sənəd məlumatları uğurla gətirildi
 *       404:
 *         description: Vəsait və ya sənəd tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/:assetId/document', protect, getAssetDocument);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}/document:
 *   put:
 *     summary: Vəsaitə sənəd yüklə
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: document
 *         in: formData
 *         type: file
 *         required: true
 *         description: Yüklənəcək sənəd faylı
 *     responses:
 *       200:
 *         description: Sənəd uğurla yükləndi
 *       400:
 *         description: Fayl seçilməyib
 *       404:
 *         description: Vəsait tapılmadı
 *       413:
 *         description: Fayl həcmi çox böyükdür
 *       415:
 *         description: Desteklenmeyen dosya türü
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.put(
  '/:userId/assets/:assetId/document', 
  protect, 
  uploadDocuments.single('document'), 
  uploadAssetDocument
);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}/document:
 *   delete:
 *     summary: Vəsait sənədini sil
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sənəd uğurla silindi
 *       404:
 *         description: Sənəd tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.delete('/:userId/assets/:assetId/document', protect, deleteAssetDocument);

/**
 * @swagger
 * /api/users/{userId}/assets/{assetId}/download-document:
 *   get:
 *     summary: Vəsait sənədini yüklə (download)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: assetId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sənəd uğurla göndərildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Sənəd tapılmadı
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/:assetId/download-document', protect, downloadAssetDocument);

// ===================== EXPORT ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/users/{userId}/assets/export/excel:
 *   get:
 *     summary: Bütün vəsaitləri Excel formatında yüklə (TAM VERSİYA)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel faylı uğurla göndərildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/excel', protect, downloadAllAssetsExcel);

/**
 * @swagger
 * /api/users/{userId}/assets/export/excel-simple:
 *   get:
 *     summary: Vəsaitləri Excel formatında yüklə (BASIT)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel faylı uğurla göndərildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/excel-simple', protect, exportAssetsToExcel);

/**
 * @swagger
 * /api/users/{userId}/assets/export/generate-excel:
 *   get:
 *     summary: Aktiv vəsaitləri Excel formatında yüklə (Database report ilə)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel faylı uğurla göndərildi və database-ə qeyd edildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/generate-excel', protect, generateAndDownloadExcel);

/**
 * @swagger
 * /api/users/{userId}/assets/export/category-excel:
 *   get:
 *     summary: Kateqoriya üzrə Excel hesabatını yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kateqoriya Excel faylı uğurla göndərildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/category-excel', protect, downloadCategoryExcel);

/**
 * @swagger
 * /api/users/{userId}/assets/export/search-results-excel:
 *   get:
 *     summary: Axtarış nəticələrini Excel formatında yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Axtarış termini
 *       - name: field
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, name, inventoryNumber, category, location, serialNumber]
 *           default: all
 *         description: Axtarış sahəsi
 *     responses:
 *       200:
 *         description: Axtarış nəticələri Excel faylı uğurla göndərildi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Axtarış termini tələb olunur
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/search-results-excel', protect, exportSearchResultsToExcel);

/**
 * @swagger
 * /api/users/{userId}/assets/export/csv:
 *   get:
 *     summary: Vəsaitləri CSV formatında yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV faylı uğurla göndərildi
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/csv', protect, downloadAssetsCSV);

/**
 * @swagger
 * /api/users/{userId}/assets/export/test-excel:
 *   get:
 *     summary: Test Excel faylı yarat
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test Excel faylı uğurla göndərildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/test-excel', protect, testSimpleExcel);
/**
 * @swagger
 * /api/users/{userId}/assets/export/generate-pdf:
 *   get:
 *     summary: Aktiv vəsaitləri PDF formatında yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF faylı uğurla göndərildi
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/generate-pdf', protect, generateAndDownloadPdf);

/**
 * @swagger
 * /api/users/{userId}/assets/export/amortization-pdf:
 *   get:
 *     summary: Amortizasiya hesabatını PDF formatında yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Amortizasiya PDF faylı uğurla göndərildi
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/amortization-pdf', protect, downloadAmortizationReportPDF);

/**
 * @swagger
 * /api/users/{userId}/assets/export/formatted-amortization-pdf:
 *   get:
 *     summary: Formatlı amortizasiya hesabatını PDF formatında yüklə
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Formatlı amortizasiya PDF faylı uğurla göndərildi
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/formatted-amortization-pdf', protect, downloadFormattedAmortizationPDF);

/**
 * @swagger
 * /api/users/{userId}/assets/export/test-pdf:
 *   get:
 *     summary: Test PDF faylı yarat
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test PDF faylı uğurla göndərildi
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export/test-pdf', protect, testSimplePDF);

/**
 * @swagger
 * /api/users/{userId}/assets/export-page:
 *   get:
 *     summary: Export test səhifəsi (HTML)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: HTML export səhifəsi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/assets/export-page', protect, getAssetsExportPage);



// Fayl yükləmə xətası handler
router.use(handleUploadError);

export default router;