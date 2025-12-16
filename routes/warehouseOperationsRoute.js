import express from "express";

import {
    createDelivery,
    createGRN,
    createTransfer,
    getWarehouseHistory,
} from "../controllers/warehouseOperationsController.js";

const router = express.Router();

router.post("/grn", createGRN);
router.post("/delivery", createDelivery);
router.post("/transfer", createTransfer);
router.get("/history", getWarehouseHistory);

export default router;
