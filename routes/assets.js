// routes/assets.js
import express from "express";
import {
  // Vəsait əməliyyatları
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  
  // Kateqoriya əməliyyatları
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Hesabatlar
  generateExcelReport,
  generatePdfReport,
  generateCategoryReport,
  generateDepartmentReport,
  getReports,
  
  // Statistikalar
  getAssetStatistics,
  getDepartmentValues,
  generateAndDownloadExcel,
  generateAndDownloadPdf,
  downloadCategoryExcel,
  downloadCategoryPdf,
  getPreviousReports,

  // Sənəd əməliyyatları
  uploadAssetDocument,
  deleteAssetDocument,
  downloadAssetDocument
} from "../controllers/assetController.js";

import { uploadDocuments, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Vəsait idarəetmə əməliyyatları
 *   name: Categories  
 *   description: Kateqoriya idarəetmə əməliyyatları
 *   name: Reports
 *   description: Hesabat və statistikalar
 *   name: Documents
 *   description: Sənəd idarəetmə əməliyyatları
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Asset:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - account
 *         - location
 *         - initialValue
 *         - currentValue
 *         - purchaseDate
 *       properties:
 *         _id:
 *           type: string
 *           description: Asset-in avtomatik yaranan ID-si
 *         inventoryNumber:
 *           type: string
 *           description: İnventar nömrəsi
 *           example: "INV-001"
 *         name:
 *           type: string
 *           description: Vəsaitin adı
 *           example: "Dizüstü Kompüter"
 *         category:
 *           type: string
 *           description: Kateqoriya
 *           example: "Texnika"
 *         account:
 *           type: string
 *           description: Hesab kodu
 *           example: "543"
 *         location:
 *           type: string
 *           description: Yerləşdiyi yer
 *           example: "Baş Ofis"
 *         initialValue:
 *           type: number
 *           description: İlkin dəyər
 *           example: 2500
 *         currentValue:
 *           type: number
 *           description: Cari dəyər
 *           example: 2000
 *         amortization:
 *           type: number
 *           description: Amortizasiya məbləği
 *           example: 500
 *         amortizationPercentage:
 *           type: number
 *           description: Amortizasiya faizi
 *           example: 20
 *         status:
 *           type: string
 *           enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb]
 *           description: Status
 *           default: "Aktiv"
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Alınma tarixi
 *           example: "2024-01-15"
 *         serviceLife:
 *           type: number
 *           description: Xidmət müddəti (il)
 *           example: 5
 *         notes:
 *           type: string
 *           description: Əlavə qeydlər
 *         document:
 *           type: object
 *           properties:
 *             originalName:
 *               type: string
 *             mimeType:
 *               type: string
 *             fileSize:
 *               type: number
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Texnika"
 *         description:
 *           type: string
 *           example: "Texniki avadanlıqlar"
 *         amortizationRate:
 *           type: number
 *           example: 15
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         message:
 *           type: string
 * 
 *   parameters:
 *     userIdParam:
 *       in: path
 *       name: userId
 *       required: true
 *       schema:
 *         type: string
 *       description: İstifadəçi ID-si
 *     assetIdParam:
 *       in: path
 *       name: assetId
 *       required: true
 *       schema:
 *         type: string
 *       description: Vəsait ID-si
 *     categoryIdParam:
 *       in: path
 *       name: categoryId
 *       required: true
 *       schema:
 *         type: string
 *       description: Kateqoriya ID-si
 * 
 *   responses:
 *     NotFound:
 *       description: Məlumat tapılmadı
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     ValidationError:
 *       description: Validasiya xətası
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *     ServerError:
 *       description: Server xətası
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 */

// 🏢 VƏSAİT ROUTES

/**
 * @swagger
 * /api/{userId}/assets:
 *   get:
 *     summary: İstifadəçinin bütün vəsaitlərini gətir
 *     tags: [Assets]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Kateqoriya üzrə filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Yer üzrə filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status üzrə filter
 *     responses:
 *       200:
 *         description: Vəsaitlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *                 count:
 *                   type: number
 *                   example: 5
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:userId/assets", getAllAssets);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   get:
 *     summary: ID ilə vəsaiti gətir
 *     tags: [Assets]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         description: Vəsait uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:userId/assets/:assetId", getAssetById);

/**
 * @swagger
 * /api/{userId}/assets:
 *   post:
 *     summary: Yeni vəsait yarat
 *     tags: [Assets]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               inventoryNumber:
 *                 type: string
 *                 example: "INV-001"
 *               name:
 *                 type: string
 *                 required: true
 *                 example: "Dizüstü Kompüter"
 *               category:
 *                 type: string
 *                 required: true
 *                 example: "Texnika"
 *               account:
 *                 type: string
 *                 required: true
 *                 example: "543"
 *               location:
 *                 type: string
 *                 required: true
 *                 example: "Baş Ofis"
 *               initialValue:
 *                 type: number
 *                 required: true
 *                 example: 2500
 *               currentValue:
 *                 type: number
 *                 required: true
 *                 example: 2000
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-01-15"
 *               serviceLife:
 *                 type: number
 *                 example: 5
 *               notes:
 *                 type: string
 *                 example: "Test üçün yaradılıb"
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Vəsait uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *                 message:
 *                   type: string
 *                   example: "Vəsait uğurla əlavə edildi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:userId/assets", uploadDocuments.single('document'), createAsset);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   put:
 *     summary: Vəsaiti yenilə
 *     tags: [Assets]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Yenilənmiş Dizüstü"
 *               category:
 *                 type: string
 *                 example: "Texnika"
 *               currentValue:
 *                 type: number
 *                 example: 1800
 *               notes:
 *                 type: string
 *                 example: "Yeniləndi"
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vəsait uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *                 message:
 *                   type: string
 *                   example: "Vəsait uğurla yeniləndi"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:userId/assets/:assetId", uploadDocuments.single('document'), updateAsset);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   delete:
 *     summary: Vəsaiti sil
 *     tags: [Assets]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         description: Vəsait uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vəsait uğurla silindi"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:userId/assets/:assetId", deleteAsset);

// 📄 SƏNƏD ƏMƏLİYYATLARI

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/upload-document:
 *   post:
 *     summary: Vəsaitə sənəd yüklə
 *     tags: [Documents]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: PDF, Excel, Şəkil, Word faylı
 *     responses:
 *       200:
 *         description: Sənəd uğurla yükləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sənəd uğurla yükləndi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       type: object
 *                       properties:
 *                         originalName:
 *                           type: string
 *                         mimeType:
 *                           type: string
 *                         fileSize:
 *                           type: number
 *                         uploadedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Fayl seçilməyib və ya etibarsız
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/:userId/assets/:assetId/upload-document", uploadDocuments.single('document'), uploadAssetDocument);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/download-document:
 *   get:
 *     summary: Vəsait sənədini yüklə
 *     tags: [Documents]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla yükləndi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:userId/assets/:assetId/download-document", downloadAssetDocument);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/documents:
 *   delete:
 *     summary: Vəsait sənədini sil
 *     tags: [Documents]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         description: Sənəd uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sənəd uğurla silindi"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:userId/assets/:assetId/documents", deleteAssetDocument);

// 📊 KATEQORİYA ROUTES

/**
 * @swagger
 * /api/{userId}/categories:
 *   get:
 *     summary: Bütün kateqoriyaları gətir
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Kateqoriyalar uğurla gətirildi
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
 *                     $ref: '#/components/schemas/Category'
 *                 count:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:userId/categories", getCategories);

/**
 * @swagger
 * /api/{userId}/categories:
 *   post:
 *     summary: Yeni kateqoriya yarat
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *                 example: "Yeni Kateqoriya"
 *               description:
 *                 type: string
 *                 example: "Kateqoriya təsviri"
 *               amortizationRate:
 *                 type: number
 *                 example: 15
 *     responses:
 *       201:
 *         description: Kateqoriya uğurla yaradıldı
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/:userId/categories", createCategory);

/**
 * @swagger
 * /api/{userId}/categories/{categoryId}:
 *   put:
 *     summary: Kateqoriyanı yenilə
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/categoryIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla yeniləndi
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:userId/categories/:categoryId", updateCategory);

/**
 * @swagger
 * /api/{userId}/categories/{categoryId}:
 *   delete:
 *     summary: Kateqoriyanı sil
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/categoryIdParam'
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla silindi
 *       400:
 *         description: Bu kateqoriyaya aid vəsaitlər var
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:userId/categories/:categoryId", deleteCategory);

// 📈 HESABAT ROUTES

/**
 * @swagger
 * /api/{userId}/reports:
 *   get:
 *     summary: Bütün hesabatları gətir
 *     tags: [Reports]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Hesabatlar uğurla gətirildi
 */
router.get("/:userId/reports", getReports);

/**
 * @swagger
 * /api/{userId}/reports/excel/download:
 *   get:
 *     summary: Excel hesabatını yüklə
 *     tags: [Reports]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Excel faylı uğurla yükləndi
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:userId/reports/excel/download', generateAndDownloadExcel);

/**
 * @swagger
 * /api/{userId}/reports/pdf/download:
 *   get:
 *     summary: PDF hesabatını yüklə
 *     tags: [Reports]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: PDF faylı uğurla yükləndi
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:userId/reports/pdf/download', generateAndDownloadPdf);

// 📊 STATİSTİKA ROUTES

/**
 * @swagger
 * /api/{userId}/statistics:
 *   get:
 *     summary: Vəsait statistikalarını gətir
 *     tags: [Reports]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Statistikalar uğurla gətirildi
 */
router.get("/:userId/statistics", getAssetStatistics);

// Upload error handling middleware
router.use(handleUploadError);

export default router;