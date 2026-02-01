import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  inventoryNumber: {
    type: String,
    default: function () {
      return `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  account: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  initialValue: {
    type: Number,
    required: true,
    min: 0,
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0,
  },
  amortization: {
    type: Number,
    default: 0,
  },
  amortizationPercentage: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Aktiv", "Passiv", "Satılıb", "Sıradan çıxıb"],
    default: "Aktiv",
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  serviceLife: {
    type: Number,
    default: 1,
  },
  notes: {
    type: String,
    trim: true,
  },
  document: {
    originalName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    bufferData: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
}, { timestamps: true });

const Asset = mongoose.model("Asset", assetSchema);
export default Asset;