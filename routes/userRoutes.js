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

// Yeni user qeydiyyatı
router.post("/register", registerUser);

// Mövcud user ilə login

router.get("/profile", protect, getProfile);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtp);
router.post("/login", loginLimiter, loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
