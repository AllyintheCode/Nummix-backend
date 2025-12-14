import express from "express";

import {
    changeWarehouseStatus,
    createWarehouse,
    editWarehouse,
    getAllWarehouses,
    getSingleWarehouse,
} from "../controllers/warehousesController.js";

const router = express.Router();

router.get("/", getAllWarehouses);
router.get("/:id", getSingleWarehouse);
router.post("/", createWarehouse);
router.patch("/:id", editWarehouse);
router.patch("/:id/status", changeWarehouseStatus);

export default router;
