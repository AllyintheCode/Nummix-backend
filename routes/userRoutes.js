import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Yeni user qeydiyyatı
router.post("/register", registerUser);

// Mövcud user ilə login
router.post("/login", loginUser);

router.get("/profile", protect, getProfile);
export default router;
