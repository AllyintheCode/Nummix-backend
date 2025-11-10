import express from "express";

import protect from "../middlewares/authMiddleware.js";

import {
    changeWarehouseStatus,
    createWarehouse,
    editWarehouse,
    getAllWarehouses,
    getSingleWarehouse,
} from "../controllers/warehousesController.js";

const router = express.Router();

router.get("/", protect, getAllWarehouses);
router.get("/:id", protect, getSingleWarehouse);
router.post("/", protect, createWarehouse);
router.patch("/:id", protect, editWarehouse);
router.patch("/:id/status", protect, changeWarehouseStatus);

export default router;
