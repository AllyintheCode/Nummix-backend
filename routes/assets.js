// routes/assets.js
import express from "express";
import {
  // Vəsait əməliyyatları
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetDocument,
  
  // Kateqoriya əməliyyatları
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Hesabatlar
  getReports,
  
  // Statistikalar
  getAssetStatistics,
  getDepartmentValues,
  getPreviousReports,

  // Sənəd əməliyyatları
  uploadAssetDocument,
  deleteAssetDocument,
  downloadAssetDocument,

  // Export əməliyyatları
  downloadAllAssetsExcel,
  downloadAmortizationReportPDF,
  downloadFormattedAmortizationPDF,
  getAssetsExportPage,
  testSimpleExcel,
  testSimplePDF
} from "../controllers/assetController.js";

import { uploadDocuments, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Assets
 *     description: Vəsait idarəetmə əməliyyatları
 *   - name: Categories
 *     description: Kateqoriya idarəetmə əməliyyatları
 *   - name: Reports
 *     description: Hesabat və statistikalar
 *   - name: Documents
 *     description: Sənəd idarəetmə əməliyyatları
 *   - name: Export
 *     description: Export və fayl yükləmə əməliyyatları
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   
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
 *           example: "507f1f77bcf86cd799439011"
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
 *           format: double
 *           description: İlkin dəyər
 *           example: 2500.00
 *         currentValue:
 *           type: number
 *           format: double
 *           description: Cari dəyər
 *           example: 2000.00
 *         amortization:
 *           type: number
 *           format: double
 *           description: Amortizasiya məbləği
 *           example: 500.00
 *         amortizationPercentage:
 *           type: number
 *           format: double
 *           description: Amortizasiya faizi
 *           example: 20.00
 *         status:
 *           type: string
 *           enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb]
 *           description: Status
 *           default: "Aktiv"
 *           example: "Aktiv"
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
 *           example: "Test üçün yaradılıb"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 * 
 *     AssetInput:
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
 *         inventoryNumber:
 *           type: string
 *           example: "INV-001"
 *         name:
 *           type: string
 *           example: "Dizüstü Kompüter"
 *         category:
 *           type: string
 *           example: "Texnika"
 *         account:
 *           type: string
 *           example: "543"
 *         location:
 *           type: string
 *           example: "Baş Ofis"
 *         initialValue:
 *           type: number
 *           format: double
 *           example: 2500.00
 *         currentValue:
 *           type: number
 *           format: double
 *           example: 2000.00
 *         purchaseDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         serviceLife:
 *           type: number
 *           example: 5
 *         notes:
 *           type: string
 *           example: "Test üçün yaradılıb"
 * 
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
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
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Texnika"
 *         description:
 *           type: string
 *           example: "Texniki avadanlıqlar"
 *         amortizationRate:
 *           type: number
 *           example: 15
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "ValidationError"
 *         message:
 *           type: string
 *           example: "Validation failed"
 * 
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 * 
 *   parameters:
 *     userIdParam:
 *       in: path
 *       name: userId
 *       required: true
 *       schema:
 *         type: string
 *       description: İstifadəçi ID-si
 *       example: "507f1f77bcf86cd799439011"
 *     
 *     assetIdParam:
 *       in: path
 *       name: assetId
 *       required: true
 *       schema:
 *         type: string
 *       description: Vəsait ID-si
 *       example: "507f1f77bcf86cd799439022"
 *     
 *     categoryIdParam:
 *       in: path
 *       name: categoryId
 *       required: true
 *       schema:
 *         type: string
 *       description: Kateqoriya ID-si
 *       example: "507f1f77bcf86cd799439033"
 *     
 *     categoryQueryParam:
 *       in: query
 *       name: category
 *       required: false
 *       schema:
 *         type: string
 *       description: Kateqoriya üzrə filter
 *     
 *     locationQueryParam:
 *       in: query
 *       name: location
 *       required: false
 *       schema:
 *         type: string
 *       description: Yer üzrə filter
 *     
 *     statusQueryParam:
 *       in: query
 *       name: status
 *       required: false
 *       schema:
 *         type: string
 *       description: Status üzrə filter
 * 
 *   responses:
 *     NotFound:
 *       description: Məlumat tapılmadı
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "NotFound"
 *               message: "Məlumat tapılmadı"
 *     
 *     ValidationError:
 *       description: Validasiya xətası
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "ValidationError"
 *               message: "Zorunlu alanlar doldurulmalıdır"
 *     
 *     ServerError:
 *       description: Server xətası
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "ServerError"
 *               message: "Server xətası baş verdi"
 *     
 *     Success:
 *       description: Əməliyyat uğurla tamamlandı
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuccessResponse'
 * 
 *     AssetListResponse:
 *       description: Vəsaitlər siyahısı
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Asset'
 *               count:
 *                 type: number
 *                 example: 5
 *     
 *     AssetResponse:
 *       description: Tək vəsait məlumatı
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               data:
 *                 $ref: '#/components/schemas/Asset'
 */

// ==================== VƏSAİT ƏMƏLİYYATLARI ====================

/**
 * @swagger
 * /api/{userId}/assets:
 *   get:
 *     summary: İstifadəçinin bütün vəsaitlərini gətir
 *     tags: [Assets]
 *     description: |
 *       İstifadəçinin bütün vəsaitlərini siyahı şəklində gətirir.
 *       Filtirləmə parametrləri:
 *       - category: Kateqoriya üzrə filtr
 *       - location: Yer üzrə filtr
 *       - status: Status üzrə filtr
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/categoryQueryParam'
 *       - $ref: '#/components/parameters/locationQueryParam'
 *       - $ref: '#/components/parameters/statusQueryParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AssetListResponse'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/assets", getAllAssets);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   get:
 *     summary: ID ilə vəsaiti gətir
 *     tags: [Assets]
 *     description: Müəyyən edilmiş ID-yə sahib vəsaiti gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AssetResponse'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/assets/:assetId", getAssetById);

/**
 * @swagger
 * /api/{userId}/assets:
 *   post:
 *     summary: Yeni vəsait yarat
 *     tags: [Assets]
 *     description: |
 *       Yeni vəsait yaradır. Əgər sənəd yükləmək istəyirsinizsə,
 *       form-data formatında göndərin və 'document' sahəsini istifadə edin.
 *     security:
 *       - bearerAuth: []
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
 *                 description: Fayl yükləmək üçün (PDF, Excel, Şəkil, Word)
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
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:userId/assets", uploadDocuments.single('document'), createAsset);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   put:
 *     summary: Vəsaiti yenilə
 *     tags: [Assets]
 *     description: Mövcud vəsaiti yeniləyir
 *     security:
 *       - bearerAuth: []
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
 *               account:
 *                 type: string
 *                 example: "543"
 *               location:
 *                 type: string
 *                 example: "Baş Ofis"
 *               initialValue:
 *                 type: number
 *                 example: 2500
 *               currentValue:
 *                 type: number
 *                 example: 1800
 *               status:
 *                 type: string
 *                 enum: [Aktiv, Passiv, Satılıb, Sıradan çıxıb]
 *                 example: "Aktiv"
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               notes:
 *                 type: string
 *                 example: "Yeniləndi"
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Yeni sənəd yükləmək üçün
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:userId/assets/:assetId", uploadDocuments.single('document'), updateAsset);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}:
 *   delete:
 *     summary: Vəsaiti sil
 *     tags: [Assets]
 *     description: Vəsaiti sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:userId/assets/:assetId", deleteAsset);

// ==================== SƏNƏD ƏMƏLİYYATLARI ====================

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/document:
 *   get:
 *     summary: Vəsait sənəd məlumatlarını gətir
 *     tags: [Documents]
 *     description: Upload olunmuş sənədin metadata məlumatlarını qaytarır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         description: Sənəd məlumatları uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     assetId:
 *                       type: string
 *                     assetName:
 *                       type: string
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
 *                         downloadUrl:
 *                           type: string
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Sənəd tapılmadı
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/assets/:assetId/document", getAssetDocument);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/upload-document:
 *   post:
 *     summary: Vəsaitə sənəd yüklə
 *     tags: [Documents]
 *     description: Vəsaitə yeni sənəd yükləyir
 *     security:
 *       - bearerAuth: []
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
 *                 description: PDF, Excel, Şəkil, Word faylı (max 10MB)
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
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:userId/assets/:assetId/upload-document", uploadDocuments.single('document'), uploadAssetDocument);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/download-document:
 *   get:
 *     summary: Vəsait sənədini yüklə
 *     tags: [Documents]
 *     description: Vəsaitin sənədini endirir
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/assets/:assetId/download-document", downloadAssetDocument);

/**
 * @swagger
 * /api/{userId}/assets/{assetId}/documents:
 *   delete:
 *     summary: Vəsait sənədini sil
 *     tags: [Documents]
 *     description: Vəsaitdən sənədi silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/assetIdParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:userId/assets/:assetId/documents", deleteAssetDocument);

// ==================== KATEQORİYA ƏMƏLİYYATLARI ====================

/**
 * @swagger
 * /api/{userId}/categories:
 *   get:
 *     summary: Bütün kateqoriyaları gətir
 *     tags: [Categories]
 *     description: İstifadəçinin bütün kateqoriyalarını gətirir
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/categories", getCategories);

/**
 * @swagger
 * /api/{userId}/categories:
 *   post:
 *     summary: Yeni kateqoriya yarat
 *     tags: [Categories]
 *     description: Yeni kateqoriya yaradır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Kateqoriya uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *                   example: "Kateqoriya uğurla əlavə edildi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:userId/categories", createCategory);

/**
 * @swagger
 * /api/{userId}/categories/{categoryId}:
 *   put:
 *     summary: Kateqoriyanı yenilə
 *     tags: [Categories]
 *     description: Mövcud kateqoriyanı yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/categoryIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Kateqoriya uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *                   example: "Kateqoriya uğurla yeniləndi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:userId/categories/:categoryId", updateCategory);

/**
 * @swagger
 * /api/{userId}/categories/{categoryId}:
 *   delete:
 *     summary: Kateqoriyanı sil
 *     tags: [Categories]
 *     description: Kateqoriyanı sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *       - $ref: '#/components/parameters/categoryIdParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         description: Bu kateqoriyaya aid vəsaitlər var
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:userId/categories/:categoryId", deleteCategory);

// ==================== HESABAT ƏMƏLİYYATLARI ====================

/**
 * @swagger
 * /api/{userId}/reports:
 *   get:
 *     summary: Bütün hesabatları gətir
 *     tags: [Reports]
 *     description: İstifadəçinin bütün hesabatlarını gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Hesabatlar uğurla gətirildi
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
 *                     excelReports:
 *                       type: array
 *                     pdfReports:
 *                       type: array
 *                     categoryReports:
 *                       type: array
 *                     departmentReports:
 *                       type: array
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/reports", getReports);

/**
 * @swagger
 * /api/{userId}/statistics:
 *   get:
 *     summary: Vəsait statistikalarını gətir
 *     tags: [Reports]
 *     description: Vəsaitlər üzrə statistik məlumatları gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Statistikalar uğurla gətirildi
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
 *                     totalAssets:
 *                       type: number
 *                     totalInitialValue:
 *                       type: number
 *                     totalCurrentValue:
 *                       type: number
 *                     totalAmortization:
 *                       type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/statistics", getAssetStatistics);

/**
 * @swagger
 * /api/{userId}/departments:
 *   get:
 *     summary: Şöbə dəyərlərini gətir
 *     tags: [Reports]
 *     description: Şöbələr üzrə vəsait dəyərlərini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Şöbə dəyərləri uğurla gətirildi
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
 *                       location:
 *                         type: string
 *                       assetCount:
 *                         type: number
 *                       initialValue:
 *                         type: number
 *                       currentValue:
 *                         type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/departments", getDepartmentValues);

/**
 * @swagger
 * /api/{userId}/previous-reports:
 *   get:
 *     summary: Əvvəlki hesabatları gətir
 *     tags: [Reports]
 *     description: Əvvəl yaradılmış hesabatları gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Əvvəlki hesabatlar uğurla gətirildi
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
 *                     excelReports:
 *                       type: array
 *                     pdfReports:
 *                       type: array
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:userId/previous-reports", getPreviousReports);

// ==================== EXPORT ƏMƏLİYYATLARI ====================

/**
 * @swagger
 * /api/{userId}/assets/export/excel:
 *   get:
 *     summary: Bütün vəsaitləri Excel formatında endir
 *     tags: [Export]
 *     description: Bütün vəsait məlumatlarını Excel faylı kimi endirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Excel faylı uğurla yaradıldı
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/export/excel', downloadAllAssetsExcel);

/**
 * @swagger
 * /api/{userId}/assets/export/pdf:
 *   get:
 *     summary: Amortizasiya hesabatını PDF formatında endir
 *     tags: [Export]
 *     description: Amortizasiya hesabatını PDF faylı kimi endirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: PDF faylı uğurla yaradıldı
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/export/pdf', downloadAmortizationReportPDF);

/**
 * @swagger
 * /api/{userId}/assets/export/pdf-formatted:
 *   get:
 *     summary: Formatlı amortizasiya hesabatını PDF formatında endir
 *     tags: [Export]
 *     description: Daha gözəl dizayna sahib amortizasiya hesabatını PDF faylı kimi endirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Formatlı PDF faylı uğurla yaradıldı
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/export/pdf-formatted', downloadFormattedAmortizationPDF);

/**
 * @swagger
 * /api/{userId}/assets/test-simple-excel:
 *   get:
 *     summary: Sadə test Excel faylı yarad
 *     tags: [Export]
 *     description: Test məqsədli sadə Excel faylı yaradır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Test Excel faylı uğurla yaradıldı
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/test-simple-excel', testSimpleExcel);

/**
 * @swagger
 * /api/{userId}/assets/test-pdf:
 *   get:
 *     summary: Sadə test PDF faylı yarad
 *     tags: [Export]
 *     description: Test məqsədli sadə PDF faylı yaradır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Test PDF faylı uğurla yaradıldı
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/test-pdf', testSimplePDF);

/**
 * @swagger
 * /api/{userId}/assets/export-page:
 *   get:
 *     summary: Export test səhifəsini gətir
 *     tags: [Export]
 *     description: Export test səhifəsini HTML formatında gətirir
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: Export test səhifəsi
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:userId/assets/export-page', getAssetsExportPage);

// Upload error handling middleware
router.use(handleUploadError);

export default router;