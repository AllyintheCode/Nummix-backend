import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invNo: {
      type: String,
      required: [true, "İnventar nömrəsi tələb olunur"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Aktivin adı tələb olunur"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Kateqoriya tələb olunur"],
      trim: true,
    },
    account: {
      type: String,
      required: true,
      enum: ["111", "112", "113"],
      default: "111",
    },
    purchaseDate: {
      type: Date,
      required: [true, "Alış tarixi tələb olunur"],
    },
    initialValue: {
      type: Number,
      required: [true, "İlkin dəyər tələb olunur"],
      min: [0, "Dəyər mənfi ola bilməz"],
    },
    residualValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    depreciationMethod: {
      type: String,
      enum: ["straightLine", "decliningBalance", "unitsOfProduction"],
      default: "straightLine",
    },
    // ✅ YENİ: Kateqoriyadan gələn dərəcələr (cached)
    categoryDepreciationRate: {
      type: Number,
      default: null,
    },
    categoryMonthlyRate: {
      type: Number,
      default: null,
    },
    usefulLifeMonths: {
      type: Number,
      required: [true, "Faydalı istifadə müddəti tələb olunur"],
      min: 1,
    },
    location: {
      type: String,
      required: [true, "Yerləşmə yeri tələb olunur"],
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    serialNo: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    warrantyMonths: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "disposed", "maintenance"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: cari dəyəri KATEQORİYA DƏRƏCƏSİ ilə hesabla ───────────────────
AssetSchema.virtual("currentValue").get(function () {
  if (!this.purchaseDate) return this.initialValue;

  const now = new Date();
  const purchaseDate = new Date(this.purchaseDate);
  const monthsPassed =
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (now.getMonth() - purchaseDate.getMonth());

  const depreciable = this.initialValue - this.residualValue;

  // ✅ 1. Əgər kateqoriya dərəcəsi varsa, ondan istifadə et
  if (this.categoryMonthlyRate && this.categoryMonthlyRate > 0) {
    const monthlyRatePercent = this.categoryMonthlyRate / 100;
    
    if (this.depreciationMethod === "straightLine") {
      const monthlyDep = depreciable * monthlyRatePercent;
      const totalDep = monthlyDep * Math.min(monthsPassed, this.usefulLifeMonths || 120);
      return Math.max(this.initialValue - totalDep, this.residualValue);
    }
    
    if (this.depreciationMethod === "decliningBalance") {
      const annualRate = (this.categoryDepreciationRate || 10) / 100;
      const yearsPassed = monthsPassed / 12;
      return Math.max(
        this.initialValue * Math.pow(1 - annualRate, yearsPassed),
        this.residualValue
      );
    }
  }

  // ✅ 2. Fallback: usefulLifeMonths ilə hesablama (köhnə aktivlər üçün)
  if (this.usefulLifeMonths) {
    if (this.depreciationMethod === "straightLine") {
      const monthlyDep = depreciable / this.usefulLifeMonths;
      const totalDep = monthlyDep * Math.min(monthsPassed, this.usefulLifeMonths);
      return Math.max(this.initialValue - totalDep, this.residualValue);
    }

    if (this.depreciationMethod === "decliningBalance") {
      const annualRate = 2 / (this.usefulLifeMonths / 12);
      const yearsPassed = monthsPassed / 12;
      return Math.max(
        this.initialValue * Math.pow(1 - annualRate, yearsPassed),
        this.residualValue
      );
    }
  }

  return this.initialValue;
});

// ─── Virtual: ümumi amortizasiya ─────────────────────────────────────────────
AssetSchema.virtual("depreciation").get(function () {
  return this.initialValue - this.currentValue;
});

// ─── Pre-save: Kateqoriya dərəcələrini avtomatik təyin et ────────────────────
AssetSchema.pre("save", async function(next) {
  // Yalnız yeni aktiv yaradılarkən və ya kateqoriya dəyişdikdə
  if (this.isNew || this.isModified('category')) {
    try {
      const Category = mongoose.model("Category");
      const category = await Category.findOne({ name: this.category });
      
      if (category) {
        this.categoryDepreciationRate = category.depreciationRate;
        this.categoryMonthlyRate = category.monthlyRate || (category.depreciationRate / 12);
        
        // Əgər usefulLifeMonths daxil edilməyibsə, avtomatik hesabla
        if (!this.usefulLifeMonths && category.depreciationRate > 0) {
          // 100% / illik dərəcə = il sayı, aya çevir
          this.usefulLifeMonths = Math.round(100 / category.depreciationRate) * 12;
        }
      }
    } catch (err) {
      console.error("Kateqoriya məlumatı alınmadı:", err);
    }
  }
  next();
});

// ─── Index-lər ────────────────────────────────────────────────────────────────
AssetSchema.index({ companyId: 1, invNo: 1 }, { unique: true });
AssetSchema.index({ companyId: 1, category: 1 });
AssetSchema.index({ companyId: 1, location: 1 });
AssetSchema.index({ companyId: 1, status: 1 });

const Asset = mongoose.model("Asset", AssetSchema);

export default Asset;