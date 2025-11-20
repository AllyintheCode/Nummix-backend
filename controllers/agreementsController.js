import Agreement from "../models/agreementsSchema.js";
import Supplier from "../models/suppliersSchema.js";

export const getAllAgreements = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const agreements = await Agreement.find({
            userId: req.user?._id,
            $text: { $search: searchQuery },
        }).sort({
            createdAt: -1,
        });

        if (!agreements || !agreements.length) {
            return res.status(404).json({ message: "No agreements found." });
        }

        res.status(200).json({
            message: "Agreements retrieved successfully",
            data: agreements,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleAgreement = async (req, res) => {
    try {
        const { id } = req.params;
        const agreement = await Agreement.findOne({ _id: id, userId: req.user?._id });

        if (!agreement) {
            return res.status(404).json({ message: "Agreement not found." });
        }

        res.status(200).json({
            message: "Agreement retrieved successfully",
            data: agreement,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createAgreement = async (req, res) => {
    try {
        const { agreementNumber, supplierId, startDate, endDate, amount, currency, terms, notes } = req.body;

        if (!agreementNumber || !supplierId || !startDate || !endDate || !amount) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const supplier = await Supplier.findOne({ _id: supplierId, userId: req.user?._id });
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const newAgreement = new Agreement({
            userId: req.user?._id,
            agreementNumber,
            supplierId,
            startDate,
            endDate,
            amount,
            currency,
            terms,
            notes,
        });

        const savedAgreement = await newAgreement.save();

        res.status(201).json({
            message: "Agreement created successfully",
            data: savedAgreement,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editAgreement = async (req, res) => {
    try {
        const { id } = req.params;
        const agreement = await Agreement.findOne({ _id: id, userId: req.user?._id });

        if (!agreement) {
            return res.status(404).json({ message: "Agreement not found." });
        }

        agreement.agreementNumber = req.body.agreementNumber || agreement.agreementNumber;
        agreement.startDate = req.body.startDate || agreement.startDate;
        agreement.endDate = req.body.endDate || agreement.endDate;
        agreement.amount = req.body.amount || agreement.amount;
        agreement.currency = req.body.currency || agreement.currency;
        agreement.terms = req.body.terms || agreement.terms;
        agreement.notes = req.body.notes || agreement.notes;

        if (req.body.supplierId) {
            const supplier = await Supplier.findOne({ _id: req.body.supplierId, userId: req.user?._id });
            if (!supplier) {
                return res.status(404).json({ message: "Supplier not found." });
            }
            agreement.supplierId = supplier._id;
        }

        await agreement.save();

        res.status(200).json({
            message: "Agreement updated successfully",
            data: agreement,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeAgreementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const agreement = await Agreement.findOne({ _id: id, userId: req.user?._id });

        if (!agreement) {
            return res.status(404).json({ message: "Agreement not found." });
        }

        agreement.isActive = !agreement.isActive;
        await agreement.save();

        res.status(200).json({
            message: "Agreement status updated successfully",
            data: agreement,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
