import Customer from "../models/customersSchema.js";
import Sale from "../models/salesSchema.js";

export const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find({ userId: req.user?._id, isActive: true }).sort({
            createdAt: -1,
        });

        if (!sales || !sales.length) {
            return res.status(404).json({ message: "No sales records found." });
        }

        res.status(200).json({
            message: "Sales records retrieved successfully",
            data: sales,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleSale = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Sale ID must be provided." });
        }
        const sale = await Sale.findOne({ _id: id, userId: req.user?._id, isActive: true });

        if (!sale) {
            return res.status(404).json({ message: "Sale record not found." });
        }

        res.status(200).json({
            message: "Sale record retrieved successfully",
            data: sale,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createSale = async (req, res) => {
    try {
        const { orderNumber, date, deliveryDate, supplierId, amount, status, notes } = req.body;

        if (!orderNumber || !date || !deliveryDate || !supplierId || !amount) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const supplier = await Supplier.findOne({ _id: supplierId, userId: req.user?._id });
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const newSale = new Sale({
            userId: req.user?._id,
            orderNumber,
            date,
            deliveryDate,
            supplierId,
            amount,
            status,
            notes,
        });

        const savedSale = await newSale.save();

        res.status(201).json({
            message: "Sale record created successfully",
            data: savedSale,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editSale = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Sale ID must be provided." });
        }
        const sale = await Sale.findOne({ _id: id, userId: req.user?._id });

        if (!sale) {
            return res.status(404).json({ message: "Sale record not found." });
        }

        sale.orderNumber = req.body.orderNumber || sale.orderNumber;
        sale.supplierId = req.body.supplierId || sale.supplierId;
        sale.date = req.body.date || sale.date;
        sale.deliveryDate = req.body.deliveryDate || sale.deliveryDate;
        sale.amount = req.body.amount || sale.amount;
        sale.status = req.body.status || sale.status;
        sale.notes = req.body.notes || sale.notes;

        if (req.body.supplierId) {
            const supplier = await Supplier.findOne({ _id: req.body.supplierId, userId: req.user?._id });
            if (!supplier) {
                return res.status(404).json({ message: "Supplier not found." });
            }
            sale.supplierId = supplier._id;
        }

        await sale.save();

        res.status(200).json({
            message: "Sale record updated successfully",
            data: sale,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeSaleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Sale ID must be provided." });
        }
        const sale = await Sale.findOne({ _id: id, userId: req.user?._id });

        if (!sale) {
            return res.status(404).json({ message: "Sale record not found." });
        }

        sale.isActive = !sale.isActive;
        await sale.save();

        res.status(200).json({
            message: "Sale record updated successfully",
            data: sale,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
