import mongoose from "mongoose";

const WarehouseTransactionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["GRN", "DELIVERY", "TRANSFER"], required: true },
        date: { type: Date, default: Date.now },
        warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouses" },
        fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouses" },
        toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouses" },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
        lotSerial: { type: String, trim: true },
        quantity: { type: Number, required: true },
        quality: { type: String, enum: ["Accept", "Reject", "Hold"], default: "Accept" },
        purchaseOrder: { type: String, trim: true },
        notes: { type: String, trim: true },
    },
    { timestamps: true }
);

const WarehouseTransaction = mongoose.model("WarehouseTransactions", WarehouseTransactionSchema);

export default WarehouseTransaction;
