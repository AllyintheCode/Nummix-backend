import { Router } from "express";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from "../controllers/categoryController.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Kateqoriyaların idarə edilməsi (qeyd: kateqoriyalar bütün şirkətlər üçün ortaqdır)
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Bütün kateqoriyaları əldə et
 *     tags: [Categories]
 *     description: Sistemdəki bütün kateqoriyaları qaytarır. Əgər boşdursa, default 8 kateqoriya seed edilir.
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
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server xətası
 */
router.route("/")
  .get(protect, getCategories)
  /**
   * @swagger
   * post:
   *   summary: Yeni kateqoriya yarat
   *   tags: [Categories]
   *   description: Yalnız qanunla müəyyən edilmiş adlarla kateqoriya yaradıla bilər.
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
   *               example: "Maşın və avadanlıqlar"
   *             color:
   *               type: string
   *               example: "#66BB6A"
   *             depreciationRate:
   *               type: number
   *               example: 13
   *             description:
   *               type: string
   *   responses:
   *     201:
   *       description: Kateqoriya yaradıldı
   *     400:
   *       description: Ad icazəli deyil və ya artıq mövcuddur
   *     500:
   *       description: Server xətası
   */
  .post(protect, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Kateqoriya məlumatlarını yenilə
 *     tags: [Categories]
 *     description: Kateqoriyanın dərəcəsini, rəngini və s. yeniləyir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kateqoriya ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               depreciationRate:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yeniləndi
 *       404:
 *         description: Kateqoriya tapılmadı
 *       500:
 *         description: Server xətası
 *   delete:
 *     summary: Kateqoriya sil
 *     tags: [Categories]
 *     description: Kateqoriya silinir. Əgər həmin kateqoriyada aktiv varsa, silinmə əməliyyatı qadağandır.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Kateqoriya ID-si
 *     responses:
 *       200:
 *         description: Silindi
 *       400:
 *         description: Kateqoriyada aktiv var, əvvəlcə aktivləri köçürün
 *       404:
 *         description: Kateqoriya tapılmadı
 *       500:
 *         description: Server xətası
 */
router.route("/:id")
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

export default router;