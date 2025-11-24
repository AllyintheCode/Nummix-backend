import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
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
import transactionRoutes from "./routes/transactionRoutes.js";
import cashAndBankRoutes from "./routes/cashAndBankRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import generalLedgerRoutes from "./routes/generalLedgerRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerOptions.js";
import paymentsRoute from "./routes/paymentsRoute.js";
import financialReportsRouter from "./routes/financalReportsRoutes.js";
import financeDashboardRoute from "./routes/financeDashboardRoute.js";
import payrollRoutes from './routes/payrollroute.js'; 
import assetsRoutes from "./routes/assets.js";
dotenv.config();
import { specs, swaggerUi } from './swagger.js';


const app = express();
// middlewares
app.use(cors());
app.use(express.json());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 10, // hər IP maksimum 10 sorğu
  message: "Çox sorğu göndərdiniz, bir az gözləyin",
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// test route
app.get("/", (req, res) => {
  res.send("Nummix backend işləyir 🚀");
});
// Rate limiter tətbiqi
app.use("/api/users/register", limiter);
// API routelar
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/cash-bank", cashAndBankRoutes);
app.use("/api/payments", paymentsRoute);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/general-ledger", generalLedgerRoutes);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/employees", employeeRoutes);
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
app.use("/api/financial-reports", financialReportsRouter);
app.use("/api/financial-dashboard", financeDashboardRoute);
app.use('/api/payroll', payrollRoutes); 
app.use('/api/assets',assetsRoutes); 
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-da işləyir`));
