import { Router } from "express";
import { deleteProduct, getProductById, getProducts, postProduct, putProduct } from "../controllers/productController.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", postProduct);
router.delete("/:id", deleteProduct)
router.put("/:id", putProduct)


export default router;
