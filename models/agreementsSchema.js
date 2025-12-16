import mongoose from "mongoose";

const AgreementSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        agreementNumber: { type: String, required: true, trim: true, unique: true },
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, enum: ["USD", "EUR", "AZN"], default: "AZN", trim: true },
        terms: { type: String, enum: ["30 days", "60 days", "90 days"], default: "30 days", trim: true },
        notes: { type: String, trim: true },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Agreement = mongoose.model("Agreement", AgreementSchema);

export default Agreement;
