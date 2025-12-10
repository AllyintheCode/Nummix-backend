import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import { loginLimiter, otpLimiter } from "../middlewares/rateLImit.js";

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Yeni user qeydiyyatı
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User qeydiyyatdan keçdi
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Mövcud user ilə login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login uğurlu oldu
 */
router.post("/login", loginLimiter, loginUser);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: User profilini gətirmək
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil məlumatları
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: OTP təsdiqi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP təsdiqləndi
 */
router.post("/verify-otp", otpLimiter, verifyOtp);

/**
 * @swagger
 * /users/resend-otp:
 *   post:
 *     summary: OTP-nu yenidən göndərmək
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP yenidən göndərildi
 */
router.post("/resend-otp", otpLimiter, resendOtp);

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Şifrəni unutduqda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Şifrə bərpası linki göndərildi
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Şifrəni reset etmək
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Şifrə uğurla dəyişdirildi
 */
router.post("/reset-password", resetPassword);

export default router;
