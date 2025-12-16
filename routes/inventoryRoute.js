import express from "express";

import {
    changeInventoryStatus,
    createInventory,
    editInventory,
    getAllInventory,
    getSingleInventory,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.get("/", getAllInventory);
router.get("/:id", getSingleInventory);
router.post("/", createInventory);
router.patch("/:id", editInventory);
router.patch("/:id/status", changeInventoryStatus);

export default router;
