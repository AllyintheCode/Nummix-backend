import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import cashAndBankRoutes from "./routes/cashAndBankRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import generalLedgerRoutes from "./routes/generalLedgerRoutes.js";
import payrollRoutes from "./routes/payrollroute.js";
import assetsRoutes from "./routes/assets.js";
import customerRoutes from "./routes/customersRoute.js";
import salesRoute from "./routes/salesRoute.js";
import suppliersRoute from "./routes/suppliersRoute.js";
import agreementsRoute from "./routes/agreementsRoute.js";
import supplierPaymentsRoute from "./routes/supplierPaymentsRoute.js";
import ordersRoute from "./routes/ordersRoute.js";
import productsRoute from "./routes/productsRoute.js";
import warehousesRoute from "./routes/warehousesRoute.js";
import warehouseOperationsRoute from "./routes/warehouseOperationsRoute.js";
import inventoryRoute from "./routes/inventoryRoute.js";
import { connectDB } from "./config/db.js";
import rateLimit from "express-rate-limit";
import { specs, swaggerUi } from "./swagger.js";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// --- TRUST PROXY (Render üçün) ---
app.set("trust proxy", 1); // bu X-Forwarded-For header üçün mütləqdir

// --- Middlewares ---
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Rate limiter (app initialization) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 10, // hər IP maksimum 10 sorğu
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Çox sorğu göndərdiniz, bir az gözləyin" },
});

// --- Test route ---
app.get("/", (req, res) => {
  res.send("Nummix backend işləyir 🚀");
});

// --- Swagger ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: { title: "My API", version: "1.0.0" },
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, "routes/*.js"), path.join(__dirname, "index.js")],
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Routes ---
// PUBLIC route üçün rate limiter tətbiq edirik
app.use("/api/users/register", authLimiter);

app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/cash-bank", cashAndBankRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/general-ledger", generalLedgerRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", salesRoute);
app.use("/api/suppliers", suppliersRoute);
app.use("/api/agreements", agreementsRoute);
app.use("/api/supplier-payments", supplierPaymentsRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/products", productsRoute);
app.use("/api/warehouses", warehousesRoute);
app.use("/api/warehouse-operations", warehouseOperationsRoute);
app.use("/api/inventory", inventoryRoute);

// --- DB connect ---
connectDB();

// --- Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-da işləyir 🚀`));
