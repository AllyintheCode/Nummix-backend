import mongoose from "mongoose";

// 🔹 Alt schema: Kateqoriyalar (məs. avadanlıq, cloud xidməti və s.)
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Kateqoriya adı
  plannedAmount: { type: Number, required: true }, // Planlanmış büdcə
  actualAmount: { type: Number, default: 0 }, // Faktiki xərclənən
  difference: { type: Number, default: 0 }, // Fərq (planned - actual)
  usageRate: { type: Number, default: 0 }, // % istifadə dərəcəsi
  status: {
    // Limit keçilib-keçilməyib
    type: String,
    enum: ["within_budget", "over_budget"],
    default: "within_budget",
  },
});

//Aylıq büdcə planı (hər ay üçün)
const monthlyBudgetSchema = new mongoose.Schema({
  month: { type: String, required: true }, // Məs: "Yanvar"
  plannedTotal: { type: Number }, // Ay üçün planlanmış ümumi məbləğ
  actualTotal: { type: Number, default: 0 }, // Faktiki xərclənən ümumi məbləğ
  difference: { type: Number, default: 0 }, // Fərq
  usageRate: { type: Number, default: 0 }, // Faizlə istifadə səviyyəsi
  categories: [categorySchema], // Alt kateqoriyalar
});

//Əsas schema (departament üzrə)
const budgetSchema = new mongoose.Schema(
  {
    department: { type: String, required: true }, // Məs: "IT və Texnologiya"
    year: { type: Number, required: true }, // 2025 və s.
    monthlyBudgets: [monthlyBudgetSchema], // Aylıq siyahı
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Büdcəni yaradan şəxs
  },
  { timestamps: true }
);

//Məlumat yaddaşa yazılmadan əvvəl avtomatik hesablamalar
budgetSchema.pre("save", function (next) {
  this.monthlyBudgets.forEach((month) => {
    // Hər kateqoriya üçün fərq və faiz hesabla
    month.categories.forEach((cat) => {
      cat.difference = cat.plannedAmount - cat.actualAmount;
      cat.usageRate =
        cat.plannedAmount > 0
          ? (cat.actualAmount / cat.plannedAmount) * 100
          : 0;
      cat.status =
        cat.actualAmount > cat.plannedAmount ? "over_budget" : "within_budget";
    });

    // Ay üzrə ümumi dəyərləri topla
    const totalPlanned = month.categories.reduce(
      (sum, c) => sum + c.plannedAmount,
      0
    );
    const totalActual = month.categories.reduce(
      (sum, c) => sum + c.actualAmount,
      0
    );

    month.plannedTotal = totalPlanned;
    month.actualTotal = totalActual;
    month.difference = totalPlanned - totalActual;
    month.usageRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  });

  next();
});

export default mongoose.model("Budget", budgetSchema);
