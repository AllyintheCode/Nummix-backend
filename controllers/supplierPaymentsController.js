import SupplierPayment from "../models/supplierPaymentsSchema.js";
import Supplier from "../models/suppliersSchema.js";

export const getAllSupplierPayments = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const supplierPayments = await SupplierPayment.find({
            userId: req.user?._id,
            $text: { $search: searchQuery },
        }).sort({
            createdAt: -1,
        });

        if (!supplierPayments || !supplierPayments.length) {
            return res.status(404).json({ message: "No supplier payments found." });
        }

        res.status(200).json({
            message: "Supplier payments retrieved successfully",
            data: supplierPayments,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleSupplierPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierPayment = await SupplierPayment.findOne({ _id: id, userId: req.user?._id });

        if (!supplierPayment) {
            return res.status(404).json({ message: "Supplier payment not found." });
        }

        res.status(200).json({
            message: "Supplier payment retrieved successfully",
            data: supplierPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createSupplierPayment = async (req, res) => {
    try {
        const { paymentNumber, supplierId, amount, balance, dueDate, paid, status } = req.body;

        if (!paymentNumber || !supplierId || amount == null || balance == null || !dueDate) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const supplier = await Supplier.findOne({ _id: supplierId, userId: req.user?._id });
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const newSupplierPayment = new SupplierPayment({
            userId: req.user?._id,
            paymentNumber,
            supplierId,
            amount,
            balance,
            dueDate,
            paid,
            status,
        });

        const savedSupplierPayment = await newSupplierPayment.save();

        res.status(201).json({
            message: "Supplier payment created successfully",
            data: savedSupplierPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editSupplierPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierPayment = await SupplierPayment.findOne({ _id: id, userId: req.user?._id });

        if (!supplierPayment) {
            return res.status(404).json({ message: "Supplier payment not found." });
        }

        supplierPayment.paymentNumber = req.body.paymentNumber || supplierPayment.paymentNumber;
        supplierPayment.amount = req.body.amount ?? supplierPayment.amount;
        supplierPayment.balance = req.body.balance ?? supplierPayment.balance;
        supplierPayment.dueDate = req.body.dueDate || supplierPayment.dueDate;
        supplierPayment.paid = req.body.paid ?? supplierPayment.paid;
        supplierPayment.status = req.body.status || supplierPayment.status;

        if (req.body.supplierId) {
            const supplier = await Supplier.findOne({ _id: req.body.supplierId, userId: req.user?._id });
            if (!supplier) {
                return res.status(404).json({ message: "Supplier not found." });
            }
            supplierPayment.supplierId = supplier._id;
        }

        await supplierPayment.save();

        res.status(200).json({
            message: "Supplier payment updated successfully",
            data: supplierPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeSupplierPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const supplierPayment = await SupplierPayment.findOne({ _id: id, userId: req.user?._id });

        if (!supplierPayment) {
            return res.status(404).json({ message: "Supplier payment not found." });
        }

        supplierPayment.isActive = !supplierPayment.isActive;
        await supplierPayment.save();

        res.status(200).json({
            message: "Supplier payment status updated successfully",
            data: supplierPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
