import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: Date, required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
        invoiceNumber: { type: String, required: true, trim: true, unique: true },
        amount: { type: Number, required: true },
        method: { type: String, enum: ["Cash", "Credit Card", "Bank Transfer"], required: true },
        status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payments", PaymentSchema);

export default Payment;
