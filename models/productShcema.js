import { Schema, model } from "mongoose";

const productSchema = new Schema({
    sku: { type: String, required: true },
    name: { type: String, required: true },
    barcode: { type: Number, required: true },
    category: { type: String, required: true },
    unitofmeasure: { type: String, required: true },
    quantity: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    location: { type: String, required: true },
    cost: { type: Number, required: true },
});

export const productModel = model("Product", productSchema);
