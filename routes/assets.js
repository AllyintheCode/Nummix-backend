import { Router } from "express";
import { 
  getAssets, 
  getStats, 
  getAssetById, 
  createAsset, 
  updateAsset, 
  deleteAsset 
} from "../controllers/assetController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Aktivlərin idarə edilməsi
 */

/**
 * @swagger
 * /api/assets/stats:
 *   get:
 *     summary: Aktiv statistikalarını əldə et
 *     tags: [Assets]
 *     description: Fəal aktivlər üzrə ümumi dəyər, cari dəyər, amortizasiya, kateqoriya və lokasiya bölgülərini qaytarır.
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalValue:
 *                       type: number
 *                     currentValue:
 *                       type: number
 *                     totalDepreciation:
 *                       type: number
 *                     assetCount:
 *                       type: number
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                     byLocation:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server xətası
 */
router.get("/stats", protect, getStats);

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Bütün aktivləri əldə et
 *     tags: [Assets]
 *     description: Filtrlərlə aktivlərin siyahısını qaytarır.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ad, inventar nömrəsi və ya kateqoriyaya görə axtarış
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Kateqoriyaya görə filtr
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Lokasiyaya görə filtr
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, disposed, maintenance]
 *         description: Statusa görə filtr
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
 *                     $ref: '#/components/schemas/Asset'
 *       500:
 *         description: Server xətası
 */
router.route("/")
  .get(protect, getAssets)
  /**
   * @swagger
   * post:
   *   summary: Yeni aktiv yarat
   *   tags: [Assets]
   *   description: Yeni aktiv məlumatlarını əlavə edir.
   *   security:
   *     - bearerAuth: []
   *   requestBody:
   *     required: true
   *     content:
   *       application/json:
   *         schema:
   *           type: object
   *           required:
   *             - name
   *             - invNo
   *             - category
   *             - purchaseDate
   *             - initialValue
   *             - location
   *           properties:
   *             name:
   *               type: string
   *               example: "Dell XPS 15"
   *             invNo:
   *               type: string
   *               example: "INV-001"
   *             category:
   *               type: string
   *               example: "Maşın və avadanlıqlar"
   *             account:
   *               type: string
   *               enum: ["111","112","113"]
   *               default: "111"
   *             purchaseDate:
   *               type: string
   *               format: date
   *               example: "2024-01-01"
   *             initialValue:
   *               type: number
   *               example: 2500
   *             residualValue:
   *               type: number
   *               default: 0
   *             depreciationMethod:
   *               type: string
   *               enum: [straightLine, decliningBalance, unitsOfProduction]
   *               default: straightLine
   *             location:
   *               type: string
   *               example: "Bakı Ofisi"
   *             branch:
   *               type: string
   *               example: "IT Şöbəsi"
   *             supplier:
   *               type: string
   *               example: "AzData MMC"
   *             serialNo:
   *               type: string
   *             assignedTo:
   *               type: string
   *             warrantyMonths:
   *               type: number
   *             notes:
   *               type: string
   *   responses:
   *     201:
   *       description: Aktiv uğurla yaradıldı
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               success:
   *                 type: boolean
   *               data:
   *                 $ref: '#/components/schemas/Asset'
   *     400:
   *       description: Yanlış məlumat (unikal invNo, validation xətası)
   *     500:
   *       description: Server xətası
   */
  .post(protect, createAsset);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Tək bir aktivin məlumatlarını əldə et
 *     tags: [Assets]
 *     description: ID-ə əsasən aktivin detallarını qaytarır.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aktivin ID-si (ObjectId və ya invNo)
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
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Aktiv tapılmadı
 *       500:
 *         description: Server xətası
 *   put:
 *     summary: Aktiv məlumatlarını yenilə
 *     tags: [Assets]
 *     description: ID-ə əsasən aktivin məlumatlarını yeniləyir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aktivin ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               initialValue:
 *                 type: number
 *               # ... digər sahələr (istənilən sahə yenilənə bilər)
 *     responses:
 *       200:
 *         description: Aktiv uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Aktiv tapılmadı
 *       400:
 *         description: Validation xətası
 *       500:
 *         description: Server xətası
 *   delete:
 *     summary: Aktiv sil
 *     tags: [Assets]
 *     description: ID-ə əsasən aktiv silinir (ID həm _id, həm də invNo ola bilər).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Aktivin ID-si və ya inventar nömrəsi
 *     responses:
 *       200:
 *         description: Aktiv silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Aktiv tapılmadı
 *       500:
 *         description: Server xətası
 */
router.route("/:id")
  .get(protect, getAssetById)
  .put(protect, updateAsset)
  .delete(protect, deleteAsset);

export default router;