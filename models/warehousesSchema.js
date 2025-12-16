import mongoose from "mongoose";

const StockItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
        lotSerial: { type: String, trim: true },
        quantity: { type: Number, required: true, default: 0 },
        quality: { type: String, enum: ["Accept", "Reject", "Hold"], default: "Accept" },
    },
    { _id: false }
);

const HistoryEntrySchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["GRN", "DELIVERY", "TRANSFER"], required: true },
        date: { type: Date, default: Date.now },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
        lotSerial: { type: String, trim: true },
        quantity: { type: Number },
        fromWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouses" },
        toWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouses" },
        purchaseOrder: { type: String, trim: true },
        notes: { type: String, trim: true },
    },
    { _id: false }
);

const WarehouseSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true, trim: true, unique: true },
        location: { type: String, required: true, trim: true },
        capacity: { type: Number, required: true },
        stock: [StockItemSchema],
        history: [HistoryEntrySchema],

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Warehouse = mongoose.model("Warehouses", WarehouseSchema);

export default Warehouse;
