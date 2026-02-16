import Customer from "../models/customersSchema.js";
import TransactionPayment from "../models/transactionPaymentSchema.js";

export const getAllTransactionPayments = async (req, res) => {
    try {
        const payments = await TransactionPayment.find({ userId: req.user?._id, isActive: true })
            .sort({
                createdAt: -1,
            })
            .populate("customerId");

        if (!payments || !payments.length) {
            return res.status(404).json({ message: "No payments found." });
        }

        res.status(200).json({
            message: "TransactionPayments retrieved successfully",
            data: payments,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleTransactionPayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "TransactionPayment ID must be provided." });
        }
        const payment = await TransactionPayment.findOne({
            _id: id,
            userId: req.user?._id,
            isActive: true,
        }).populate("customerId");

        if (!payment) {
            return res.status(404).json({ message: "TransactionPayment not found." });
        }

        res.status(200).json({
            message: "TransactionPayment retrieved successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createTransactionPayment = async (req, res) => {
    try {
        const { date, customerId, invoiceNumber, amount, method, status, notes } = req.body;

        if (!date || !customerId || !invoiceNumber || !amount || !method || !status) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const customer = await Customer.findOne({ _id: customerId, userId: req.user?._id });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const newTransactionPayment = new TransactionPayment({
            userId: req.user?._id,
            date,
            customerId,
            invoiceNumber,
            amount,
            method,
            status,
            notes,
        });

        const savedTransactionPayment = await newTransactionPayment.save();

        res.status(201).json({
            message: "TransactionPayment record created successfully",
            data: savedTransactionPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editTransactionPayment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "TransactionPayment ID must be provided." });
        }
        const payment = await TransactionPayment.findOne({ _id: id, userId: req.user?._id }).populate(
            "customerId",
        );

        if (!payment) {
            return res.status(404).json({ message: "TransactionPayment record not found." });
        }

        payment.date = req.body.date || payment.date;
        payment.invoiceNumber = req.body.invoiceNumber || payment.invoiceNumber;
        payment.amount = req.body.amount || payment.amount;
        payment.method = req.body.method || payment.method;
        payment.status = req.body.status || payment.status;
        payment.notes = req.body.notes || payment.notes;

        if (req.body.customerId) {
            const customer = await Customer.findOne({
                _id: req.body.customerId,
                userId: req.user?._id,
            });

            if (!customer) {
                return res.status(404).json({ message: "Customer not found." });
            }
            payment.customerId = customer._id;
        }

        await payment.save();

        const newPayment = await TransactionPayment.findOne({ _id: id, userId: req.user?._id }).populate(
            "customerId",
        );

        res.status(200).json({
            message: "TransactionPayment record updated successfully",
            data: newPayment,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeTransactionPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "TransactionPayment ID must be provided." });
        }
        const payment = await TransactionPayment.findOne({ _id: id, userId: req.user?._id });

        if (!payment) {
            return res.status(404).json({ message: "TransactionPayment record not found." });
        }

        payment.isActive = !payment.isActive;
        await payment.save();

        res.status(200).json({
            message: "TransactionPayment record updated successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
