import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
    createDelivery,
    createGRN,
    createTransfer,
    getWarehouseHistory,
} from "../controllers/warehouseOperationsController.js";

const router = express.Router();

router.post("/grn", protect, createGRN);
router.post("/delivery", protect, createDelivery);
router.post("/transfer", protect, createTransfer);
router.get("/history", protect, getWarehouseHistory);

export default router;
