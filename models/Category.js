// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, "Kateqoriya adı tələb olunur"],
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  amortizationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  colorCode: {
    type: String,
    default: "#3498db"
  },
  icon: {
    type: String,
    default: "📁"
  },
  // 📊 STATİSTİKA SAHƏLƏRİ
  assetsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInitialValue: {  // 🔴 YENİ: Ümumi ilkin dəyər
    type: Number,
    default: 0,
    min: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  totalCurrentValue: {  // 🔴 YENİ: Ümumi cari dəyər (köhnə totalValue əvəzinə)
    type: Number,
    default: 0,
    min: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  totalDepreciation: {  // 🔴 YENİ: Ümumi amortizasiya məbləği
    type: Number,
    default: 0,
    min: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  depreciationPercentage: {  // 🔴 YENİ: Ümumi amortizasiya faizi
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
categorySchema.virtual('assets', {
  ref: 'Asset',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// 🔴 YENİ: User və Name birlikdə unikal olsun
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Static methods
categorySchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ name: 1 });
};

categorySchema.statics.getDefaultCategories = function() {
  return [
    { 
      name: 'Kompüter avadanlığı', 
      description: 'Kompüterlər, printerlər, serverlər', 
      amortizationRate: 20, 
      colorCode: '#3498db', 
      icon: '💻' 
    },
    { 
      name: 'Ofis avadanlığı', 
      description: 'Masalar, stullar, şkaflar', 
      amortizationRate: 10, 
      colorCode: '#2ecc71', 
      icon: '🪑' 
    },
    { 
      name: 'Nəqliyyat vasitələri', 
      description: 'Avtomobillər, yük maşınları', 
      amortizationRate: 25, 
      colorCode: '#e74c3c', 
      icon: '🚗' 
    },
    { 
      name: 'Elektron avadanlıq', 
      description: 'Televizorlar, kondisionerlər', 
      amortizationRate: 15, 
      colorCode: '#9b59b6', 
      icon: '📺' 
    },
    { 
      name: 'Mebel', 
      description: 'Divanlar, şkaflar, rəflər', 
      amortizationRate: 8, 
      colorCode: '#f1c40f', 
      icon: '🛋️' 
    }
  ];
};

categorySchema.statics.initializeUserCategories = async function(userId) {
  const defaultCategories = this.getDefaultCategories();
  const categories = defaultCategories.map(cat => ({
    ...cat,
    userId,
    isDefault: true
  }));
  
  return this.insertMany(categories);
};

// 🔴 YENİLƏNMİŞ: Instance methods - updateStats
categorySchema.methods.updateStats = async function() {
  const assets = await mongoose.model('Asset').find({
    category: this._id,
    isDeleted: false
  });
  
  // Bütün statistikaları hesabla
  const assetCount = assets.length;
  
  const totalInitialValue = assets.reduce((sum, asset) => 
    sum + (asset.initialValue || 0), 0
  );
  
  const totalCurrentValue = assets.reduce((sum, asset) => 
    sum + (asset.currentValue || 0), 0
  );
  
  const totalDepreciation = totalInitialValue - totalCurrentValue;
  
  const depreciationPercentage = totalInitialValue > 0 
    ? (totalDepreciation / totalInitialValue) * 100 
    : 0;
  
  // Sahələri yenilə
  this.assetsCount = assetCount;
  this.totalInitialValue = totalInitialValue;
  this.totalCurrentValue = totalCurrentValue;
  this.totalDepreciation = totalDepreciation;
  this.depreciationPercentage = parseFloat(depreciationPercentage.toFixed(2));
  
  return this.save();
};

// 🔴 YENİ: Statik metod - getCategoryReport
categorySchema.statics.getCategoryReport = async function(userId) {
  const categories = await this.find({ userId, isActive: true })
    .populate({
      path: 'assets',
      match: { isDeleted: false },
      select: 'initialValue currentValue name'
    })
    .lean();
  
  return categories.map(category => {
    const assets = category.assets || [];
    
    // Kateqoriya üçün statistikalar
    const totalInitial = assets.reduce((sum, a) => sum + (a.initialValue || 0), 0);
    const totalCurrent = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const depreciation = totalInitial - totalCurrent;
    const percentage = totalInitial > 0 ? (depreciation / totalInitial) * 100 : 0;
    
    return {
      id: category._id,
      name: category.name,
      description: category.description,
      amortizationRate: category.amortizationRate,
      colorCode: category.colorCode,
      icon: category.icon,
      isDefault: category.isDefault,
      stats: {
        count: assets.length,
        totalInitialValue: parseFloat(totalInitial.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrent.toFixed(2)),
        totalDepreciation: parseFloat(depreciation.toFixed(2)),
        depreciationPercentage: parseFloat(percentage.toFixed(2))
      }
    };
  });
};

// 🔴 YENİ: Statik metod - getDashboardStats
categorySchema.statics.getDashboardStats = async function(userId) {
  const Asset = mongoose.model('Asset');
  
  // Bütün aktiv vəsaitləri get
  const assets = await Asset.find({ userId, isDeleted: false });
  const categories = await this.find({ userId, isActive: true });
  
  // Ümumi statistikalar
  const totalAssets = assets.length;
  const totalInitialValue = assets.reduce((sum, a) => sum + (a.initialValue || 0), 0);
  const totalCurrentValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalDepreciation = totalInitialValue - totalCurrentValue;
  const overallDepreciationRate = totalInitialValue > 0 
    ? (totalDepreciation / totalInitialValue) * 100 
    : 0;
  
  // Kateqoriya paylanması (pie chart üçün)
  const categoryDistribution = await Promise.all(categories.map(async cat => {
    const catAssets = assets.filter(a => 
      a.category && a.category.toString() === cat._id.toString()
    );
    
    const catValue = catAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const percentage = totalCurrentValue > 0 
      ? (catValue / totalCurrentValue) * 100 
      : 0;
    
    return {
      id: cat._id,
      name: cat.name,
      count: catAssets.length,
      value: catValue,
      percentage: parseFloat(percentage.toFixed(2)),
      color: cat.colorCode,
      icon: cat.icon
    };
  }));
  
  // Filial/Lokasiya statistikaları (əgər Asset modelində varsa)
  let branchStats = [];
  try {
    // Əgər Asset modelində branch və ya location varsa
    const branchMap = new Map();
    assets.forEach(asset => {
      const branch = asset.branch || asset.location || 'Digər';
      if (!branchMap.has(branch)) {
        branchMap.set(branch, {
          name: branch,
          count: 0,
          totalValue: 0,
          currentValue: 0
        });
      }
      const data = branchMap.get(branch);
      data.count++;
      data.totalValue += asset.initialValue || 0;
      data.currentValue += asset.currentValue || 0;
    });
    
    branchStats = Array.from(branchMap.values()).map(b => ({
      ...b,
      share: totalCurrentValue > 0 
        ? parseFloat(((b.currentValue / totalCurrentValue) * 100).toFixed(2))
        : 0
    }));
  } catch (error) {
    console.log('Branch stats not available');
  }
  
  return {
    summary: {
      totalAssets,
      totalInitialValue: parseFloat(totalInitialValue.toFixed(2)),
      totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
      totalDepreciation: parseFloat(totalDepreciation.toFixed(2)),
      overallDepreciationRate: parseFloat(overallDepreciationRate.toFixed(2)),
      totalCategories: categories.length
    },
    categoryDistribution: categoryDistribution.sort((a, b) => b.value - a.value),
    branchStats,
    // Ən yüksək dəyərli vəsaitlər
    topAssets: assets
      .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
      .slice(0, 5)
      .map(a => ({
        id: a._id,
        name: a.name,
        value: a.currentValue,
        category: a.category
      }))
  };
};

const Category = mongoose.model("Category", categorySchema);
export default Category;