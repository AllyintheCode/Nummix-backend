import { Router } from "express";
import { 
  getLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation 
} from "../controllers/locationController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Lokasiyaların (filialların) idarə edilməsi
 */

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Şirkətə aid lokasiyaları əldə et
 *     tags: [Locations]
 *     description: Aktiv lokasiyalar siyahısını, hər lokasiyada olan aktiv sayı və ümumi dəyərlə birlikdə qaytarır.
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
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       city:
 *                         type: string
 *                       branch:
 *                         type: string
 *                       address:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       assetCount:
 *                         type: number
 *                       totalValue:
 *                         type: number
 *       500:
 *         description: Server xətası
 */
router.route("/")
  .get(protect, getLocations)
  /**
   * @swagger
   * post:
   *   summary: Yeni lokasiya yarat
   *   tags: [Locations]
   *   description: Şirkət üçün yeni lokasiya əlavə edir.
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
   *           properties:
   *             name:
   *               type: string
   *               example: "Bakı Ofisi"
   *             city:
   *               type: string
   *               example: "Bakı"
   *             branch:
   *               type: string
   *               example: "Baş ofis"
   *             address:
   *               type: string
   *               example: "Nizami küç. 25"
   *             isActive:
   *               type: boolean
   *               default: true
   *   responses:
   *     201:
   *       description: Lokasiya yaradıldı
   *     400:
   *       description: Ad artıq mövcuddur (şirkət daxilində)
   *     500:
   *       description: Server xətası
   */
  .post(protect, createLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Lokasiya məlumatlarını yenilə
 *     tags: [Locations]
 *     description: Lokasiya adı, ünvan və s. yeniləyir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lokasiya ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               branch:
 *                 type: string
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Yeniləndi
 *       404:
 *         description: Lokasiya tapılmadı
 *       500:
 *         description: Server xətası
 *   delete:
 *     summary: Lokasiya sil
 *     tags: [Locations]
 *     description: Lokasiya silinir. Əgər həmin lokasiyada aktiv varsa, silinmə əməliyyatı qadağandır.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lokasiya ID-si
 *     responses:
 *       200:
 *         description: Silindi
 *       400:
 *         description: Lokasiyada aktiv var, əvvəlcə aktivləri köçürün
 *       404:
 *         description: Lokasiya tapılmadı
 *       500:
 *         description: Server xətası
 */
router.route("/:id")
  .put(protect, updateLocation)
  .delete(protect, deleteLocation);

export default router;