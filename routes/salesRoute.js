import express from "express";

import {
    changeSaleStatus,
    createSale,
    editSale,
    getAllSales,
    getSingleSale,
} from "../controllers/salesController.js";

const router = express.Router();

router.get("/", getAllSales);
router.get("/:id", getSingleSale);
router.post("/", createSale);
router.patch("/:id", editSale);
router.patch("/:id/status", changeSaleStatus);

export default router;
