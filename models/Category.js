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
    unique: true,
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
  assetsCount: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0,
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

// Static methods
categorySchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ name: 1 });
};

categorySchema.statics.getDefaultCategories = function() {
  return [
    { name: 'Kompüter avadanlığı', description: 'Kompüterlər, printerlər, serverlər', amortizationRate: 20, colorCode: '#3498db', icon: '💻' },
    { name: 'Ofis avadanlığı', description: 'Masalar, stullar, şkaflar', amortizationRate: 10, colorCode: '#2ecc71', icon: '🪑' },
    { name: 'Nəqliyyat vasitələri', description: 'Avtomobillər, yük maşınları', amortizationRate: 25, colorCode: '#e74c3c', icon: '🚗' },
    { name: 'Elektron avadanlıq', description: 'Televizorlar, kondisionerlər', amortizationRate: 15, colorCode: '#9b59b6', icon: '📺' },
    { name: 'Mebel', description: 'Divanlar, şkaflar, rəflər', amortizationRate: 8, colorCode: '#f1c40f', icon: '🛋️' }
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

// Instance methods
categorySchema.methods.updateStats = async function() {
  const assetCount = await mongoose.model('Asset').countDocuments({
    category: this._id,
    isDeleted: false
  });
  
  const assets = await mongoose.model('Asset').find({
    category: this._id,
    isDeleted: false
  });
  
  const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  
  this.assetsCount = assetCount;
  this.totalValue = totalValue;
  
  return this.save();
};

const Category = mongoose.model("Category", categorySchema);
export default Category;