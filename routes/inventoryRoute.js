import express from "express";

import protect from "../middlewares/authMiddleware.js";

import {
    changeInventoryStatus,
    createInventory,
    editInventory,
    getAllInventory,
    getSingleInventory,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", protect, getAllInventory);
router.get("/:id", protect, getSingleInventory);
router.post("/", protect, createInventory);
router.patch("/:id", protect, editInventory);
router.patch("/:id/status", protect, changeInventoryStatus);

export default router;
