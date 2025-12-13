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

import { loginLimiter, otpLimiter } from "../middlewares/rateLImit.js";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User authentication and profile
 */
/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 */
// Yeni user qeydiyyatı
router.post("/register", registerUser);

// Mövcud user ilə login
/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags: [Users]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 */

router.get("/profile", protect, getProfile);
/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.post("/verify-otp", otpLimiter, verifyOtp);
/**
 * @openapi
 * /api/users/verify-otp:
 *   post:
 *     tags: [Users]
 *     summary: Verify OTP code
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
 *         description: OTP verified
 *       400:
 *         description: Invalid OTP
 */
router.post("/resend-otp", otpLimiter, resendOtp);
/**
 * @openapi
 * /api/users/resend-otp:
 *   post:
 *     tags: [Users]
 *     summary: Resend OTP code
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
 *         description: OTP resent
 */
router.post("/login", loginLimiter, loginUser);
router.post("/forgot-password", forgotPassword);
/**
 * @openapi
 * /api/users/forgot-password:
 *   post:
 *     tags: [Users]
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email sent if user exists
 */
router.post("/reset-password", resetPassword);
/**
 * @openapi
 * /api/users/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */

export default router;
