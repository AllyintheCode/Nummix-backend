import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import customerRoutes from "./routes/customersRoute.js";
import salesRoute from "./routes/salesRoute.js";
import suppliersRoute from "./routes/suppliersRoute.js";
import agreementsRoute from "./routes/agreementsRoute.js";
import supplierPaymentsRoute from "./routes/supplierPaymentsRoute.js";
import ordersRoute from "./routes/ordersRoute.js";
import productsRoute from "./routes/productsRoute.js";
import warehousesRoute from "./routes/warehousesRoute.js";
import warehouseOperationsRoute from "./routes/warehouseOperationsRoute.js";
import { connectDB } from "./config/db.js";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dəqiqə
    max: 10, // hər IP maksimum 10 sorğu
    message: "Çox sorğu göndərdiniz, bir az gözləyin",
});

// login və register routelara tətbiq et

app.use("/api/users/register", limiter);

// test route
app.get("/", (req, res) => {
    res.send("Nummix backend işləyir 🚀");
});

connectDB();
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoute);
app.use("/api/suppliers", suppliersRoute);
app.use("/api/agreements", agreementsRoute);
app.use("/api/supplier-payments", supplierPaymentsRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/products", productsRoute);
app.use("/api/warehouses", warehousesRoute);
app.use("/api/warehouse-operations", warehouseOperationsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-da işləyir`));
