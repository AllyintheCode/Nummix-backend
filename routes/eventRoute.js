import express from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

// Middleware
import protect from "./../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: İstifadəçinin bütün event-lərini gətir
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event-lər uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.get("/", protect, getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: ID-ə əsasən event gətir
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event uğurla gətirildi
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Event tapılmadı
 *       500:
 *         description: Server xətası
 */
router.get("/:id", protect, getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Yeni event yarat
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               dayOfWeek:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Workday, Off day, Holiday]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event uğurla yaradıldı
 *       400:
 *         description: Yanlış məlumat
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         description: Server xətası
 */
router.post("/", protect, createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Event yenilə
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
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
 *     responses:
 *       200:
 *         description: Event uğurla yeniləndi
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Event tapılmadı və ya icazəniz yoxdur
 *       500:
 *         description: Server xətası
 */
router.put("/:id", protect, updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Event sil
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event uğurla silindi
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         description: Event tapılmadı və ya icazəniz yoxdur
 *       500:
 *         description: Server xətası
 */
router.delete("/:id", protect, deleteEvent);

export default router;