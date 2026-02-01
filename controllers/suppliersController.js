import Supplier from "../models/suppliersSchema.js";

export const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({
            userId: req.user?._id,
        }).sort({
            createdAt: -1,
        });

        if (!suppliers || !suppliers.length) {
            return res.status(404).json({ message: "No suppliers found." });
        }

        res.status(200).json({
            message: "Suppliers retrieved successfully",
            data: suppliers,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Supplier ID must be provided." });
        }
        const supplier = await Supplier.findOne({ _id: id, userId: req.user?._id });

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        res.status(200).json({
            message: "Supplier retrieved successfully",
            data: supplier,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const { companyName, taxId, contactPerson, phone, email, address } = req.body;

        if (!companyName || !taxId || !contactPerson || !phone || !email || !address) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newSupplier = new Supplier({
            userId: req.user?._id,
            companyName,
            taxId,
            contactPerson,
            phone,
            email,
            address,
        });

        const savedSupplier = await newSupplier.save();

        res.status(201).json({
            message: "Supplier created successfully",
            data: savedSupplier,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Supplier ID must be provided." });
        }
        const supplier = await Supplier.findOne({ _id: id, userId: req.user?._id });

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        supplier.companyName = req.body.companyName || supplier.companyName;
        supplier.taxId = req.body.taxId || supplier.taxId;
        supplier.contactPerson = req.body.contactPerson || supplier.contactPerson;
        supplier.phone = req.body.phone || supplier.phone;
        supplier.email = req.body.email || supplier.email;
        supplier.address = req.body.address || supplier.address;

        await supplier.save();

        res.status(200).json({
            message: "Supplier updated successfully",
            data: supplier,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeSupplierStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Supplier ID must be provided." });
        }
        const supplier = await Supplier.findOne({ _id: id, userId: req.user?._id });

        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        supplier.isActive = !supplier.isActive;
        await supplier.save();

        res.status(200).json({
            message: "Supplier status updated successfully",
            data: supplier,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
