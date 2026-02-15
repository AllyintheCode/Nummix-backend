import mongoose from "mongoose";

const InvoiceProductSchema = new mongoose.Schema(
    {
        productName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        discount: { type: Number, min: 0, max: 100, default: 0 },
    },
    { _id: false },
);

const InvoiceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        invoiceNumber: { type: String, required: true, trim: true, unique: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        date: { type: Date, required: true },
        currency: { type: String, enum: ["USD", "EUR", "AZN"], default: "AZN", trim: true },
        paymentTerm: { type: String, enum: ["15 days", "30 days", "60 days"], default: "30 days" },
        products: {
            type: [InvoiceProductSchema],
            required: true,
            validate: {
                validator: (value) => Array.isArray(value) && value.length > 0,
                message: "Products must be provided.",
            },
        },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const Invoice = mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
