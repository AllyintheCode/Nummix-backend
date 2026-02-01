import Customer from "../models/customersSchema.js";
import Payment from "../models/paymentsSchema.js";

export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user?._id })
            .sort({
                createdAt: -1,
            })
            .populate("customerId");

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
        if (!id) {
            return res.status(400).json({ message: "Payment ID must be provided." });
        }
        const payment = await Payment.findOne({ _id: id, userId: req.user?._id }).populate("customerId");

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
        const { date, customerId, invoiceNumber, amount, method, status, notes } = req.body;

        if (!date || !customerId || !invoiceNumber || !amount || !method || !status) {
            console.log({
                date: date,
                customerId: customerId,
                invoiceNumber: invoiceNumber,
                amount: amount,
                method: method,
                status: status,
            });

            return res.status(400).json({ message: "All fields are required." });
        }

        const customer = await Customer.findOne({ _id: customerId, userId: req.user?._id });
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
            notes,
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
        if (!id) {
            return res.status(400).json({ message: "Payment ID must be provided." });
        }
        const payment = await Payment.findOne({ _id: id, userId: req.user?._id }).populate("customerId");

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found." });
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
            }).populate("customerId");

            if (!customer) {
                return res.status(404).json({ message: "Customer not found." });
            }
            payment.customerId = customer._id;
        }

        await payment.save();

        res.status(200).json({
            message: "Payment record updated successfully",
            data: payment,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({ message: "Internal server error." });
    }
};

export const changePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Payment ID must be provided." });
        }
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
