import express from "express";

import protect from "../middlewares/authMiddleware.js";

import {
    changeProductStatus,
    createProduct,
    editProduct,
    getAllProducts,
    getSingleProduct,
} from "../controllers/productsController.js";

const router = express.Router();

router.get("/", protect, getAllProducts);
router.get("/:id", protect, getSingleProduct);
router.post("/", protect, createProduct);
router.patch("/:id", protect, editProduct);
router.patch("/:id/status", protect, changeProductStatus);

export default router;
