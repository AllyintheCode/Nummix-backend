import mongoose from "mongoose";

const SupplierPaymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        paymentNumber: { type: String, required: true, trim: true, unique: true },
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
        amount: { type: Number, required: true },
        paid: { type: Boolean, default: false },
        balance: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: { type: String, enum: ["Paid", "Partially Paid", "Overdue", "Pending"], default: "Pending" },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const SupplierPayment = mongoose.model("SupplierPayment", SupplierPaymentSchema);

export default SupplierPayment;
