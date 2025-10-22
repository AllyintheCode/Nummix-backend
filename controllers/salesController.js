import Sale from "../models/salesSchema.js";

export const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find();

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
        const sale = await Sale.findById(id);

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

        const newSale = new Sale({
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

export const changeSaleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id);

        if (!sale) {
            return res.status(404).json({ message: "Sale record not found." });
        }

        sale.status = req.body.status || sale.status;
        await sale.save();

        res.status(200).json({
            message: "Sale record updated successfully",
            data: sale,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeSaleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.findById(id);

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
