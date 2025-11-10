import Customer from "../models/customersSchema.js";
import Payment from "../models/paymentsSchema.js";

export const getALLPayments = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const payments = await Payment.find({ userId: req.user?._id, $text: { $search: searchQuery } }).sort({
            createdAt: -1,
        });

        if (!payments || !payments.length) {
            return res.status(404).json({ message: "No payments found." });
        }

        res.status(200).json({
            message: "Payments retrieved successfully",
            data: payments,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSinglePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ _id: id, userId: req.user?._id });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found." });
        }

        res.status(200).json({
            message: "Payment retrieved successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createPayment = async (req, res) => {
    try {
        const { date, customerId, invoiceNumber, amount, method, status } = req.body;

        if (!date || !customerId || !invoiceNumber || !amount || !method || !status) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const newPayment = new Payment({
            userId: req.user?._id,
            date,
            customerId,
            invoiceNumber,
            amount,
            method,
            status,
        });

        const savedPayment = await newPayment.save();

        res.status(201).json({
            message: "Payment record created successfully",
            data: savedPayment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ _id: id, userId: req.user?._id });

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found." });
        }

        payment.date = req.body.date || payment.date;
        payment.invoiceNumber = req.body.invoiceNumber || payment.invoiceNumber;
        payment.amount = req.body.amount || payment.amount;
        payment.method = req.body.method || payment.method;
        payment.status = req.body.status || payment.status;

        const customer = await Customer.findById(req.body.customerId);

        payment.customerId = req.body.customerId ? customer._id : payment.customerId;

        await payment.save();

        res.status(200).json({
            message: "Payment record updated successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findOne({ _id: id, userId: req.user?._id });

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found." });
        }

        payment.isActive = !payment.isActive;
        await payment.save();

        res.status(200).json({
            message: "Payment record updated successfully",
            data: payment,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
