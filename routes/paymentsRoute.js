import express from "express";

import {
    changePaymentStatus,
    createPayment,
    editPayment,
    getALLPayments,
    getSinglePayment,
} from "../controllers/paymentsController.js";

const router = express.Router();

router.get("/", getALLPayments);
router.get("/:id", getSinglePayment);
router.post("/", createPayment);
router.patch("/:id", editPayment);
router.patch("/:id/status", changePaymentStatus);

export default router;
