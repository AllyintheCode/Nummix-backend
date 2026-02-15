import Invoice from "../models/invoiceSchema.js";
import Customer from "../models/customersSchema.js";

export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({
            userId: req.user?._id,
        })
            .sort({
                createdAt: -1,
            })
            .populate("customerId");

        if (!invoices || !invoices.length) {
            return res.status(404).json({ message: "No invoices found." });
        }

        res.status(200).json({
            message: "Invoices retrieved successfully",
            data: invoices,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Invoice ID must be provided." });
        }

        const invoice = await Invoice.findOne({ _id: id, userId: req.user?._id }).populate("customerId");
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found." });
        }

        res.status(200).json({
            message: "Invoice retrieved successfully",
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createInvoice = async (req, res) => {
    try {
        const { invoiceNumber, customerId, date, currency, paymentTerm, products } = req.body;

        if (!invoiceNumber || !customerId || !date || !currency || !paymentTerm || !products) {
            console.log("Missing fields:", {
                invoiceNumber,
                customerId,
                date,
                currency,
                paymentTerm,
                products,
            });

            return res.status(400).json({ message: "All required fields must be provided." });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products must be provided." });
        }

        const customer = await Customer.findOne({ _id: customerId, userId: req.user?._id });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        const newInvoice = new Invoice({
            userId: req.user?._id,
            invoiceNumber,
            customerId: customer._id,
            date,
            currency,
            paymentTerm,
            products,
        });

        const savedInvoice = await newInvoice.save();
        const populatedInvoice = await savedInvoice.populate("customerId");

        res.status(201).json({
            message: "Invoice created successfully",
            data: populatedInvoice,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Invoice ID must be provided." });
        }

        const invoice = await Invoice.findOne({ _id: id, userId: req.user?._id });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found." });
        }

        if (req.body.products) {
            if (!Array.isArray(req.body.products) || req.body.products.length === 0) {
                return res.status(400).json({ message: "Products must be provided." });
            }
            invoice.products = req.body.products;
        }

        invoice.invoiceNumber = req.body.invoiceNumber || invoice.invoiceNumber;
        invoice.date = req.body.date || invoice.date;
        invoice.currency = req.body.currency || invoice.currency;
        invoice.paymentTerm = req.body.paymentTerm || invoice.paymentTerm;

        if (req.body.customerId) {
            const customer = await Customer.findOne({ _id: req.body.customerId, userId: req.user?._id });
            if (!customer) {
                return res.status(404).json({ message: "Customer not found." });
            }
            invoice.customerId = customer._id;
        }

        await invoice.save();

        const populatedInvoice = await invoice.populate("customerId");

        res.status(200).json({
            message: "Invoice updated successfully",
            data: populatedInvoice,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Invoice ID must be provided." });
        }

        const invoice = await Invoice.findOne({ _id: id, userId: req.user?._id });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found." });
        }

        invoice.isActive = !invoice.isActive;
        await invoice.save();

        res.status(200).json({
            message: "Invoice status updated successfully",
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
