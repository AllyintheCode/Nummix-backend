// models/Asset.js - YENİLƏNMİŞ
import mongoose from "mongoose";

// Report sub-schema
const reportSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String 
  },
  fileSize: { 
    type: Number 
  },
  generatedAt: { 
    type: Date, 
    default: Date.now 
  },
  data: [{ 
    type: mongoose.Schema.Types.Mixed 
  }],
  type: {
    type: String,
    enum: ["excel", "pdf", "category_excel", "category_pdf"],
    default: "excel"
  }
}, { 
  _id: true,
  timestamps: false 
});

const assetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  inventoryNumber: {
    type: String,
    default: function () {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9).toUpperCase();
      return `INV_${timestamp}_${random}`;
    },
    trim: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, "Asset adı tələb olunur"],
    trim: true,
  },
category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category',
  required: [true, "Kateqoriya tələb olunur"],
  index: true
},
  account: {
    type: String,
    required: [true, "Hesab nömrəsi tələb olunur"],
    trim: true,
  },
  location: {
    type: String,
    required: [true, "Yer tələb olunur"],
    trim: true,
    index: true
  },
  initialValue: {
    type: Number,
    required: [true, "İlkin dəyər tələb olunur"],
    min: [0, "Dəyər mənfi ola bilməz"],
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  currentValue: {
    type: Number,
    required: [true, "Cari dəyər tələb olunur"],
    min: [0, "Dəyər mənfi ola bilməz"],
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  amortization: {
    type: Number,
    default: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  amortizationPercentage: {
    type: Number,
    default: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2)),
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: {
      values: ["Aktiv", "Passiv", "Satılıb", "Sıradan çıxıb", "Təmir üçün", "İcarədə"],
      message: "Status {VALUE} mövcud deyil"
    },
    default: "Aktiv",
    index: true
  },
  purchaseDate: {
    type: Date,
    required: [true, "Alış tarixi tələb olunur"],
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: "Alış tarixi gələcək ola bilməz"
    }
  },
  serviceLife: {
    type: Number,
    default: 1,
    min: [1, "Xidmət müddəti ən az 1 il olmalıdır"]
  },
  notes: {
    type: String,
    trim: true,
  },
  document: {
    originalName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    bufferData: { type: String, select: false },
    uploadedAt: { type: Date, default: Date.now }
  },
  
  // ✅ ƏLAVƏ SAHƏLƏR:
  depreciationMethod: {
    type: String,
    enum: ["Düz xətt", "Azalan qalıq", "İstehsal həcmi", "İkiqat azalan", "İllər cəmi"],
    default: "Düz xətt"
  },
  warrantyExpiryDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  lastMaintenanceDate: {
    type: Date
  },
  maintenanceCost: {
    type: Number,
    default: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  supplier: {
    type: String,
    trim: true
  },
  supplierContact: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true,
    index: true
  },
  barcode: {
    type: String,
    trim: true,
    index: true
  },
department: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Department',
  index: true
},

  responsiblePerson: {
    type: String,
    trim: true,
    index: true
  },
  responsiblePersonContact: {
    type: String,
    trim: true
  },
  isInsured: {
    type: Boolean,
    default: false
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  insurancePolicyNumber: {
    type: String,
    trim: true
  },
  insuranceExpiryDate: {
    type: Date
  },
  insuranceAmount: {
    type: Number,
    default: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // ✅ YENİ: REPORT SAHƏLƏRİ
  excelReports: [reportSchema],
  pdfReports: [reportSchema],
  
  // ✅ AUDIT FIELDS
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Sensitiv məlumatları gizlət
      delete ret.__v;
      delete ret.document?.bufferData;
      return ret;
    }
  },
  toObject: { 
    virtuals: true 
  }
});

// ⭐ VIRTUAL FIELDS
assetSchema.virtual('ageInMonths').get(function() {
  const now = new Date();
  const purchase = this.purchaseDate;
  const diffTime = Math.abs(now - purchase);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Daha dəqiq
});

assetSchema.virtual('ageInYears').get(function() {
  return Math.floor(this.ageInMonths / 12);
});

assetSchema.virtual('remainingLife').get(function() {
  return Math.max(0, this.serviceLife * 12 - this.ageInMonths);
});

assetSchema.virtual('remainingLifeYears').get(function() {
  return Math.floor(this.remainingLife / 12);
});

assetSchema.virtual('annualDepreciation').get(function() {
  return this.initialValue / this.serviceLife;
});

assetSchema.virtual('monthlyDepreciation').get(function() {
  return this.annualDepreciation / 12;
});

assetSchema.virtual('depreciationPerDay').get(function() {
  return this.annualDepreciation / 365;
});

assetSchema.virtual('isWarrantyActive').get(function() {
  if (!this.warrantyExpiryDate) return false;
  return new Date() <= this.warrantyExpiryDate;
});

assetSchema.virtual('isInsuranceActive').get(function() {
  if (!this.insuranceExpiryDate) return false;
  return new Date() <= this.insuranceExpiryDate;
});

assetSchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.nextMaintenanceDate <= thirtyDaysFromNow;
});

assetSchema.virtual('totalMaintenanceCost').get(function() {
  return this.maintenanceCost || 0;
});

// ⭐ STATIC METHODS
assetSchema.statics.findByUserId = function(userId, filters = {}) {
  const query = { userId, isDeleted: false, ...filters };
  return this.find(query).sort({ createdAt: -1 });
};

assetSchema.statics.findActiveByUserId = function(userId) {
  return this.find({ 
    userId, 
    status: "Aktiv",
    isDeleted: false 
  }).sort({ name: 1 });
};


assetSchema.statics.generateCategoryReport = async function(userId) {
  return this.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false 
      } 
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalInitialValue: { $sum: "$initialValue" },
        totalCurrentValue: { $sum: "$currentValue" },
        totalAmortization: { $sum: "$amortization" },
        totalMaintenanceCost: { $sum: "$maintenanceCost" },
        assets: { 
          $push: {
            _id: "$_id",
            name: "$name",
            inventoryNumber: "$inventoryNumber",
            status: "$status",
            initialValue: "$initialValue",
            currentValue: "$currentValue",
            amortization: "$amortization",
            purchaseDate: "$purchaseDate"
          }
        }
      }
    },
    { $sort: { totalCurrentValue: -1 } },
    {
      $project: {
        category: "$_id",
        count: 1,
        totalInitialValue: 1,
        totalCurrentValue: 1,
        totalAmortization: 1,
        totalMaintenanceCost: 1,
        avgCurrentValue: { $divide: ["$totalCurrentValue", "$count"] },
        depreciationRate: { 
          $multiply: [
            { $divide: ["$totalAmortization", "$totalInitialValue"] },
            100
          ]
        },
        assets: { $slice: ["$assets", 10] } // İlk 10 asset
      }
    }
  ]);
};

assetSchema.statics.findByFilters = function(userId, filters = {}) {
  const query = { userId, isDeleted: false };
  
  // Dinamik filter
  if (filters.category) query.category = filters.category;
  if (filters.location) query.location = filters.location;
  if (filters.status) query.status = filters.status;
  if (filters.department) query.department = filters.department;
  if (filters.responsiblePerson) query.responsiblePerson = filters.responsiblePerson;
  if (filters.isInsured !== undefined) query.isInsured = filters.isInsured;
  
  // Tarix filterləri
  if (filters.purchaseDateFrom || filters.purchaseDateTo) {
    query.purchaseDate = {};
    if (filters.purchaseDateFrom) query.purchaseDate.$gte = new Date(filters.purchaseDateFrom);
    if (filters.purchaseDateTo) query.purchaseDate.$lte = new Date(filters.purchaseDateTo);
  }
  
  // Dəyər filterləri
  if (filters.minValue || filters.maxValue) {
    query.currentValue = {};
    if (filters.minValue) query.currentValue.$gte = parseFloat(filters.minValue);
    if (filters.maxValue) query.currentValue.$lte = parseFloat(filters.maxValue);
  }
  
  return this.find(query);
};

// ⭐ INSTANCE METHODS
assetSchema.methods.calculateAmortization = function() {
  const now = new Date();
  const monthsPassed = this.ageInMonths;
  const totalMonths = this.serviceLife * 12;
  
  // YENİ: Yeni asset üçün göndərilən currentValue-nu saxla
  if (this.isNew && this.currentValue !== undefined) {
    // Yeni asset-də currentValue göndərilibsə, onu saxla
    this.amortization = this.initialValue - this.currentValue;
    this.amortizationPercentage = this.initialValue > 0 ? 
      (this.amortization / this.initialValue) * 100 : 0;
    
    // Status təyini
    if (this.currentValue <= 0) {
      this.status = "Sıradan çıxıb";
    }
    
    return this;
  }
  
  // Köhnə məntiq (mövcud asset-lər üçün)
  if (monthsPassed >= totalMonths) {
    this.amortization = this.initialValue;
    this.amortizationPercentage = 100;
    this.currentValue = 0;
    this.status = "Sıradan çıxıb";
  } else {
    let depreciation = 0;
    
    switch (this.depreciationMethod) {
      case "Düz xətt":
        depreciation = this.monthlyDepreciation * monthsPassed;
        break;
      case "Azalan qalıq":
        const rate = 2 / this.serviceLife;
        let remainingValue = this.initialValue;
        for (let i = 0; i < Math.min(monthsPassed, totalMonths); i++) {
          const annualDep = remainingValue * rate;
          const monthlyDep = annualDep / 12;
          depreciation += monthlyDep;
          remainingValue -= monthlyDep;
        }
        break;
      default:
        depreciation = this.monthlyDepreciation * monthsPassed;
    }
    
    this.amortization = Math.min(depreciation, this.initialValue);
    this.amortizationPercentage = (this.amortization / this.initialValue) * 100;
    this.currentValue = Math.max(0, this.initialValue - this.amortization);
  }
  
  return this;
};

assetSchema.methods.updateStatus = function(newStatus, updatedBy = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (updatedBy) {
    this.updatedBy = updatedBy;
  }
  
  if (newStatus === "Satılıb" || newStatus === "Sıradan çıxıb") {
    this.currentValue = 0;
    this.amortization = this.initialValue;
    this.amortizationPercentage = 100;
  }
  
  return {
    oldStatus,
    newStatus,
    asset: this
  };
};

assetSchema.methods.addMaintenanceRecord = function(cost, date = new Date(), notes = '') {
  this.lastMaintenanceDate = date;
  this.maintenanceCost = (this.maintenanceCost || 0) + cost;
  
  // Növbəti təmir tarixini 1 il sonraya təyin et
  const nextDate = new Date(date);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  this.nextMaintenanceDate = nextDate;
  
  if (notes) {
    this.notes = this.notes ? `${this.notes}\nTəmir: ${notes}` : `Təmir: ${notes}`;
  }
  
  return this;
};

assetSchema.methods.addExcelReport = async function(reportData) {
  if (!this.excelReports) {
    this.excelReports = [];
  }
  
  reportData.type = reportData.type || "excel";
  reportData.generatedAt = new Date();
  
  this.excelReports.push(reportData);
  
  // Yalnız son 20 reportu saxla
  if (this.excelReports.length > 20) {
    this.excelReports = this.excelReports.slice(-20);
  }
  
  return this.save();
};

assetSchema.methods.addPdfReport = async function(reportData) {
  if (!this.pdfReports) {
    this.pdfReports = [];
  }
  
  reportData.type = reportData.type || "pdf";
  reportData.generatedAt = new Date();
  
  this.pdfReports.push(reportData);
  
  // Yalnız son 20 reportu saxla
  if (this.pdfReports.length > 20) {
    this.pdfReports = this.pdfReports.slice(-20);
  }
  
  return this.save();
};

assetSchema.methods.softDelete = function(deletedBy = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

assetSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// ⭐ MIDDLEWARE
assetSchema.pre('save', function(next) {
  // Amortizasiyanı avtomatik hesabla
  if (this.isModified('purchaseDate') || 
      this.isModified('initialValue') || 
      this.isModified('serviceLife') || 
      this.isModified('status') ||
      this.isModified('depreciationMethod')) {
    
    this.calculateAmortization();
  }
  
  // Document varsa, bufferData-nı yoxla
  if (this.document && this.document.bufferData) {
    // Base64 formatını yoxla
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
    if (!base64Regex.test(this.document.bufferData)) {
      return next(new Error("Yanlış base64 fayl məlumatı"));
    }
  }
  
  // Tags-i təmizlə
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index); // Unikal et
  }
  
  next();
});

assetSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

assetSchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

assetSchema.pre('aggregate', function() {
  this.pipeline().unshift({ $match: { isDeleted: false } });
});
// Asset modelinə bu statik metodu əlavə et
assetSchema.statics.getUserAssetStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalAssets: { $sum: 1 },
        totalInitialValue: { $sum: "$initialValue" },
        totalCurrentValue: { $sum: "$currentValue" },
        totalAmortization: { $sum: "$amortization" },
        totalMaintenanceCost: { $sum: "$maintenanceCost" },
        activeAssets: { $sum: { $cond: [{ $eq: ["$status", "Aktiv"] }, 1, 0] } },
        passiveAssets: { $sum: { $cond: [{ $eq: ["$status", "Passiv"] }, 1, 0] } },
        soldAssets: { $sum: { $cond: [{ $eq: ["$status", "Satılıb"] }, 1, 0] } }
      }
    }
  ]);
  return stats[0] || {};
};

// ⭐ INDEXES (Performans üçün)
assetSchema.index({ userId: 1, category: 1 });
assetSchema.index({ userId: 1, location: 1 });
assetSchema.index({ userId: 1, status: 1 });
assetSchema.index({ userId: 1, purchaseDate: -1 });
assetSchema.index({ userId: 1, currentValue: -1 });
assetSchema.index({ userId: 1, department: 1 });
assetSchema.index({ userId: 1, responsiblePerson: 1 });
assetSchema.index({ userId: 1, inventoryNumber: 1 }, { unique: true });
assetSchema.index({ userId: 1, serialNumber: 1 });
assetSchema.index({ userId: 1, barcode: 1 });
assetSchema.index({ 
  userId: 1, 
  name: "text", 
  category: "text", 
  notes: "text",
  serialNumber: "text" 
});


const Asset = mongoose.model("Asset", assetSchema);
export default Asset;