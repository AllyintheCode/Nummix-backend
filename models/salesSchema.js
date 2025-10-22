import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, required: true, trim: true, unique: true },
        date: { type: Date, required: true },
        // customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Sale = mongoose.model("Sales", SaleSchema);

export default Sale;
