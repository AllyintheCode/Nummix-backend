import express from "express";

import {
    changeOrderStatus,
    createOrder,
    editOrder,
    getAllOrders,
    getSingleOrder,
} from "../controllers/ordersController.js";

const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", getSingleOrder);
router.post("/", createOrder);
router.patch("/:id", editOrder);
router.patch("/:id/status", changeOrderStatus);

export default router;
