import express from "express";

import protect from "../middlewares/authMiddleware.js";

import { changeSaleActiveStatus, changeSaleStatus, createSale, getAllSales, getSingleSale } from "../controllers/salesController.js";

const router = express.Router();

router.get("/", protect, getAllSales);
router.get("/:id", protect, getSingleSale);
router.post("/", protect, createSale);
router.patch("/:id/status", protect, changeSaleStatus);
router.patch("/:id/active", protect, changeSaleActiveStatus);

export default router;
