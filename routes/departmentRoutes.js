import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStatistics
} from "../controllers/DepartmentController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Bütün department route-ları auth tələb edir
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Şöbə idarəetmə API-ları
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Avtomatik yaranan ID
 *         userId:
 *           type: string
 *           description: İstifadəçi ID-si
 *         name:
 *           type: string
 *           description: Şöbə adı
 *         description:
 *           type: string
 *           description: Şöbə təsviri
 *         managerName:
 *           type: string
 *           description: Rəhbərin adı
 *         location:
 *           type: string
 *           description: Yerləşdiyi yer
 *         budget:
 *           type: number
 *           description: Büdcə
 *         isActive:
 *           type: boolean
 *           description: Aktiv statusu
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         name: "IT Şöbəsi"
 *         description: "Texniki dəstək və inkişaf"
 *         managerName: "Əli Məmmədov"
 *         location: "Bakı, Nərimanov"
 *         budget: 50000
 *         isActive: true
 *         createdAt: "2024-03-13T08:30:00.000Z"
 *         updatedAt: "2024-03-13T08:30:00.000Z"
 *
 *     DepartmentStats:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Şöbə adı
 *         value:
 *           type: number
 *           description: Ümumi dəyər (məsələn, vəsaitlərin cəmi)
 *       example:
 *         name: "IT Şöbəsi"
 *         value: 125000.50
 */

/**
 * @swagger
 * /api/departments/{userId}/departments:
 *   get:
 *     summary: Bütün şöbələri gətir
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: İstifadəçi ID-si
 *     responses:
 *       200:
 *         description: Şöbələr uğurla gətirildi
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
 *                     $ref: '#/components/schemas/Department'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/departments', getDepartments);

/**
 * @swagger
 * /api/departments/{userId}/departments:
 *   post:
 *     summary: Yeni şöbə yarat
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: İstifadəçi ID-si
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
 *               description:
 *                 type: string
 *               managerName:
 *                 type: string
 *               location:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Şöbə uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bu adda şöbə artıq mövcuddur
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.post('/:userId/departments', createDepartment);

/**
 * @swagger
 * /api/departments/{userId}/departments/{departmentId}:
 *   put:
 *     summary: Şöbə məlumatlarını yenilə
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: İstifadəçi ID-si
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Şöbə ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               managerName:
 *                 type: string
 *               location:
 *                 type: string
 *               budget:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Şöbə uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bu adda şöbə artıq mövcuddur
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Şöbə tapılmadı
 *       500:
 *         description: Server xətası
 */
router.put('/:userId/departments/:departmentId', updateDepartment);

/**
 * @swagger
 * /api/departments/{userId}/departments/{departmentId}:
 *   delete:
 *     summary: Şöbəni sil (və ya deaktiv et)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: İstifadəçi ID-si
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Şöbə ID-si
 *     responses:
 *       200:
 *         description: Şöbə uğurla silindi/deaktiv edildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Şöbə tapılmadı
 *       500:
 *         description: Server xətası
 */
router.delete('/:userId/departments/:departmentId', deleteDepartment);

/**
 * @swagger
 * /api/departments/{userId}/departments/statistics:
 *   get:
 *     summary: Şöbələr üzrə statistika (məsələn, vəsaitlərin bölgüsü)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: İstifadəçi ID-si
 *     responses:
 *       200:
 *         description: Statistika uğurla gətirildi
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
 *                     $ref: '#/components/schemas/DepartmentStats'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get('/:userId/departments/statistics', getDepartmentStatistics);

export default router;