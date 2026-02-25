import mongoose from "mongoose";

const productCatergories = ["Raw Materials", "Finished Goods", "Spare Parts", "Packaging"];

const ProductsSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        SKU: { type: String, required: true, trim: true, unique: true },
        barcode: { type: String, required: true, trim: true, unique: true },
        productName: { type: String, required: true, trim: true },
        category: { type: String, enum: productCatergories, required: true, trim: true },
        unitOfMeasure: {
            type: String,
            enum: ["kg", "g", "cm", "m", "lb", "oz", "l", "ml", "pieces", "units"],
            required: true,
            trim: true,
        },
        minStock: { type: Number, required: true },
        maxStock: { type: Number, required: true },
        cost: { type: Number, required: true },
        initialQuantity: { type: Number, required: true },
        storageLocation: { type: String, required: true, trim: true },
        status: { type: String, enum: ["Down", "Good"], default: "Good" },
        image: { type: String },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const Products = mongoose.model("Products", ProductsSchema);

export default Products;
