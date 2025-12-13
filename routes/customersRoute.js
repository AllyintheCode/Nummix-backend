import express from "express";

import {
    changeCustomerStatus,
    createCustomer,
    getAllCustomers,
    getSingleCustomer,
} from "../controllers/customersController.js";

const router = express.Router();

router.get("/", getAllCustomers);
router.get("/:id", getSingleCustomer);
router.post("/", createCustomer);
router.patch("/:id/status", changeCustomerStatus);

export default router;
