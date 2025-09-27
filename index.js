import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
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
app.use("/api/users/login", limiter);
app.use("/api/users/register", limiter);

// test route
app.get("/", (req, res) => {
  res.send("Nummix backend işləyir 🚀");
});

connectDB();
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}-da işləyir`));
