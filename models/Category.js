import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      unique: true 
    },
    color: { 
      type: String, 
      default: "#64B5F6" 
    },
    depreciationRate: { 
      type: Number, 
      default: 10, 
      min: 0, 
      max: 100 
    },
    monthlyRate: { 
      type: Number,
      default: function() {
        return this.depreciationRate / 12;
      }
    },
    description: { 
      type: String 
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ YENİ: Virtual field - aylıq dərəcə (faizlə)
CategorySchema.virtual("monthlyRatePercent").get(function() {
  return this.monthlyRate || (this.depreciationRate / 12);
});

// ✅ YENİ: Metod - aylıq amortizasiya məbləğini hesabla
CategorySchema.methods.getMonthlyDepreciation = function(initialValue, residualValue = 0) {
  const depreciable = initialValue - residualValue;
  return depreciable * (this.monthlyRatePercent / 100);
};

// ✅ YENİ: Metod - illik amortizasiya məbləğini hesabla
CategorySchema.methods.getAnnualDepreciation = function(initialValue, residualValue = 0) {
  const depreciable = initialValue - residualValue;
  return depreciable * (this.depreciationRate / 100);
};

// ✅ YENİ: Metod - faydalı istifadə müddətini (ay) hesabla
CategorySchema.methods.getUsefulLifeMonths = function() {
  if (this.depreciationRate > 0) {
    return Math.round(100 / this.depreciationRate) * 12;
  }
  return 120; // default 10 il
};

// Indexlər
CategorySchema.index({ name: 1 }, { unique: true });

const Category = mongoose.model("Category", CategorySchema);

export default Category;