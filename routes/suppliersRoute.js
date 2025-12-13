import express from "express";

import {
    changeSupplierStatus,
    createSupplier,
    editSupplier,
    getAllSuppliers,
    getSingleSupplier,
} from "../controllers/suppliersController.js";

const router = express.Router();

router.get("/", getAllSuppliers);
router.get("/:id", getSingleSupplier);
router.post("/", createSupplier);
router.patch("/:id", editSupplier);
router.patch("/:id/status", changeSupplierStatus);

export default router;
