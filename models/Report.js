import mongoose from "mongoose";

const baseReportSchema = {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  reportType: { type: String, required: true },
  fileName: { type: String, required: true },
  bufferData: { type: String },
  filePath: { type: String },
  fileSize: { type: Number, default: 0 },
  generatedAt: { type: Date, default: Date.now },
};

const excelReportSchema = new mongoose.Schema({
  ...baseReportSchema,
  reportType: {
    type: String,
    enum: ["assets", "category", "department"],
    default: "assets",
  },
  data: [{
    inventoryNumber: String,
    name: String,
    category: String,
    account: String,
    location: String,
    initialValue: Number,
    currentValue: Number,
    amortization: Number,
    status: String,
    amortizationPercentage: Number,
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number,
    totalAmortization: Number,
    averageAmortizationPercentage: Number,
  },
  filters: {
    dateFrom: Date,
    dateTo: Date,
    categories: [String],
    locations: [String],
    status: String,
  },
}, { timestamps: true });

const pdfReportSchema = new mongoose.Schema({
  ...baseReportSchema,
  reportType: {
    type: String,
    enum: ["amortization", "category", "department"],
    default: "amortization",
  },
}, { timestamps: true });

const categoryReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Kateqoriya üzrə" },
  description: { type: String, default: "Kateqoriyalar üzrə xülasə" },
  generatedAt: { type: Date, default: Date.now },
  data: [{
    category: String,
    assetCount: Number,
    initialValue: Number,
    currentValue: Number,
    amortization: Number,
    amortizationPercentage: Number,
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number,
    totalAmortization: Number,
    averageAmortizationPercentage: Number,
  },
}, { timestamps: true });

const departmentReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Şöbə/filial üzrə" },
  description: { type: String, default: "Şöbələr üzrə xülasə" },
  generatedAt: { type: Date, default: Date.now },
  data: [{
    location: String,
    assetCount: Number,
    initialValue: Number,
    currentValue: Number,
    percentage: Number,
  }],
  summary: {
    totalAssets: Number,
    totalInitialValue: Number,
    totalCurrentValue: Number,
  },
}, { timestamps: true });

export const ExcelReport = mongoose.model("ExcelReport", excelReportSchema);
export const PdfReport = mongoose.model("PdfReport", pdfReportSchema);
export const CategoryReport = mongoose.model("CategoryReport", categoryReportSchema);
export const DepartmentReport = mongoose.model("DepartmentReport", departmentReportSchema);