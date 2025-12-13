import express from "express";

import {
    changeSupplierPaymentStatus,
    createSupplierPayment,
    editSupplierPayment,
    getAllSupplierPayments,
    getSingleSupplierPayment,
} from "../controllers/supplierPaymentsController.js";

const router = express.Router();

router.get("/", getAllSupplierPayments);
router.get("/:id", getSingleSupplierPayment);
router.post("/", createSupplierPayment);
router.patch("/:id", editSupplierPayment);
router.patch("/:id/status", changeSupplierPaymentStatus);

export default router;
