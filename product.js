import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Route-lar
app.use("/api/v1/products", productRoutes);


// PORT-u .env-dən oxu, yoxdursa 8080 istifadə et
const PORT = process.env.PRODUCT_PORT || 8080;

// Test route
app.get("/", (req, res) => {
    res.send("Product Xidmətinə xoş gəlmisiniz ✅");
});

// MongoDB-yə qoşul və serveri işə sal
mongoose
    .connect(process.env.MONGO_URI_PRODUCT)
    .then(() => {
        console.log("MongoDB qoşuldu ✅");
        app.listen(PORT, () => {
            console.log(`Product server aktivdir: http://localhost:${PORT}`);
        });
    })
    .catch((err) => console.log("DB qoşulma xətası ❌:", err));
