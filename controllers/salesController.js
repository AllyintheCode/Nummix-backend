import Customer from "../models/customersSchema.js";
import Sale from "../models/salesSchema.js";

export const getAllSales = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const sales = await Sale.find({ userId: req.user?._id, $text: { $search: searchQuery } }).sort({
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
        const sale = await Sale.findOne({ _id: id, userId: req.user?._id });

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
        const { invoiceNumber, date, customerId, amount, status } = req.body;

        if (!invoiceNumber || !date || !customerId || !amount) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const newSale = new Sale({
            userId: req.user?._id,
            invoiceNumber,
            date,
            customerId,
            amount,
            status,
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
        const sale = await Sale.findOne({ _id: id, userId: req.user?._id });

        if (!sale) {
            return res.status(404).json({ message: "Sale record not found." });
        }

        sale.invoiceNumber = req.body.invoiceNumber || sale.invoiceNumber;
        sale.date = req.body.date || sale.date;
        sale.amount = req.body.amount || sale.amount;
        sale.status = req.body.status || sale.status;

        const customer = await Customer.findById(req.body.customerId);

        sale.customerId = req.body.customerId ? customer._id : sale.customerId;

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
