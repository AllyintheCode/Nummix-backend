import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderNumber: { type: String, required: true, trim: true, unique: true },
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
        date: { type: Date, required: true },
        deliveryDate: { type: Date },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" },

        notes: { type: String, trim: true },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const Sale = mongoose.model("Sales", SaleSchema);

export default Sale;
