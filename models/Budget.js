import mongoose from "mongoose";

// 🔹 Alt schema: Kateqoriyalar
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  plannedAmount: { type: Number, required: true },
  actualAmount: { type: Number, default: 0 },
  difference: { type: Number, default: 0 },
  usageRate: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["within_budget", "over_budget"],
    default: "within_budget",
  },
});

// 🔹 Aylıq büdcə planı
const monthlyBudgetSchema = new mongoose.Schema({
  month: { type: String, required: true },
  plannedTotal: { type: Number, default: 0 },
  actualTotal: { type: Number, default: 0 },
  difference: { type: Number, default: 0 },
  usageRate: { type: Number, default: 0 },

  // ✅ default əlavə edildi
  categories: { type: [categorySchema], default: [] },
});

// 🔹 Əsas schema
const budgetSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    year: { type: Number, required: true },

    // ✅ default əlavə edildi
    monthlyBudgets: { type: [monthlyBudgetSchema], default: [] },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// ✅ duplicate qarşısını alır (çox vacib)
budgetSchema.index({ department: 1, year: 1 }, { unique: true });

// ✅ Safe pre-save hook
budgetSchema.pre("save", function (next) {
  const months = Array.isArray(this.monthlyBudgets) ? this.monthlyBudgets : [];

  months.forEach((month) => {
    const cats = Array.isArray(month.categories) ? month.categories : [];

    // Kateqoriya hesablamaları
    cats.forEach((cat) => {
      const planned = Number(cat.plannedAmount) || 0;
      const actual = Number(cat.actualAmount) || 0;

      cat.plannedAmount = planned;
      cat.actualAmount = actual;

      cat.difference = planned - actual;

      cat.usageRate = planned > 0 ? (actual / planned) * 100 : 0;

      cat.status = actual > planned ? "over_budget" : "within_budget";
    });

    // Ay üzrə cəmlər
    const totalPlanned = cats.reduce(
      (sum, c) => sum + (Number(c.plannedAmount) || 0),
      0,
    );

    const totalActual = cats.reduce(
      (sum, c) => sum + (Number(c.actualAmount) || 0),
      0,
    );

    month.plannedTotal = totalPlanned;
    month.actualTotal = totalActual;

    month.difference = totalPlanned - totalActual;

    month.usageRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  });

  next();
});

export default mongoose.model("Budget", budgetSchema);
