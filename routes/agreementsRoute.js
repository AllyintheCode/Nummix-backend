import express from "express";

import {
    changeAgreementStatus,
    createAgreement,
    editAgreement,
    getAllAgreements,
    getSingleAgreement,
} from "../controllers/agreementsController.js";

const router = express.Router();

router.get("/", getAllAgreements);
router.get("/:id", getSingleAgreement);
router.post("/", createAgreement);
router.patch("/:id", editAgreement);
router.patch("/:id/status", changeAgreementStatus);

export default router;
