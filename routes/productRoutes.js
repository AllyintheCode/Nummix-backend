import { Router } from "express";
import { deleteProduct, getProductById, getProducts, postProduct } from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", postProduct);
router.delete("/:id", deleteProduct)


export default router;
