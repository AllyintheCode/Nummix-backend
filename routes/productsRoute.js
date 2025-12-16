import express from "express";

import {
    changeProductStatus,
    createProduct,
    editProduct,
    getAllProducts,
    getSingleProduct,
} from "../controllers/productsController.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.post("/", createProduct);
router.patch("/:id", editProduct);
router.patch("/:id/status", changeProductStatus);

export default router;
