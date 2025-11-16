import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimit from "express-rate-limit";
import transactionRoutes from "./routes/transactionRoutes.js";
import cashAndBankRoutes from "./routes/cashAndBankRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import generalLedgerRoutes from "./routes/generalLedgerRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerOptions.js";


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
app.use("/api/payments", paymentRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/general-ledger", generalLedgerRoutes);
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Routes
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use("/api/employees", employeeRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-da işləyir`));
