import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderNumber: { type: String, required: true, trim: true, unique: true },
        supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
        date: { type: Date, required: true },
        deliveryDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Delayed"],
            default: "Pending",
        },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);

export default Order;
