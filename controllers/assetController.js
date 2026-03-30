import mongoose from "mongoose";
import { Asset } from "../models/index.js";

// Frontend-dən gələn məlumatları modelə uyğunlaşdır
const mapFrontendFields = (body) => {
  const mapped = { ...body };
  if (body.warranty !== undefined) {
    mapped.usefulLifeMonths = body.warranty;
    delete mapped.warranty;
  }
  if (body.responsible !== undefined) {
    mapped.supplier = body.responsible;
    delete mapped.responsible;
  }
  return mapped;
};

// ─── GET /api/assets ──────────────────────────────────────────────────────────
export const getAssets = async (req, res) => {
  try {
    const { search, category, location, status } = req.query;
    
    const filter = { companyId: req.user._id };

    if (status)   filter.status   = status;
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (search) {
      filter.$or = [
        { name:     { $regex: search, $options: "i" } },
        { invNo:    { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/assets/stats ────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const assets = await Asset.find({
      companyId: req.user._id,
      status: "active",
    });

    const totalValue = assets.reduce((s, a) => s + a.initialValue, 0);
    const currentValue = assets.reduce((s, a) => s + (a.currentValue || a.initialValue), 0);
    const totalDepreciation = totalValue - currentValue;
    const assetCount = assets.length;

    const categoryMap = {};
    assets.forEach((a) => {
      if (!categoryMap[a.category]) {
        categoryMap[a.category] = { count: 0, totalValue: 0, currentValue: 0 };
      }
      categoryMap[a.category].count += 1;
      categoryMap[a.category].totalValue += a.initialValue;
      categoryMap[a.category].currentValue += (a.currentValue || a.initialValue);
    });

    const categories = Object.entries(categoryMap).map(([name, d]) => ({
      name,
      count: d.count,
      totalValue: d.totalValue,
      currentValue: d.currentValue,
      percentage: totalValue > 0 ? Math.round((d.totalValue / totalValue) * 100) : 0,
    }));

    const locationMap = {};
    assets.forEach((a) => {
      const key = a.branch || a.location;
      if (!locationMap[key]) locationMap[key] = { totalValue: 0, count: 0 };
      locationMap[key].totalValue += a.initialValue;
      locationMap[key].count += 1;
    });

    const byLocation = Object.entries(locationMap).map(([name, d]) => ({
      name,
      value: d.totalValue,
      count: d.count,
    }));

    res.json({
      success: true,
      data: { totalValue, currentValue, totalDepreciation, assetCount, categories, byLocation },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/assets/:id ──────────────────────────────────────────────────────
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      companyId: req.user._id,
    });
    if (!asset)
      return res.status(404).json({ success: false, message: "Aktiv tapılmadı" });
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/assets ─────────────────────────────────────────────────────────
export const createAsset = async (req, res) => {
  try {
    const mappedData = mapFrontendFields(req.body);
    
    // Əgər usefulLifeMonths yoxdursa, kateqoriyadan götür
    if (!mappedData.usefulLifeMonths && mappedData.category) {
      const Category = mongoose.model("Category");
      const category = await Category.findOne({ name: mappedData.category });
      if (category) {
        mappedData.usefulLifeMonths = category.getUsefulLifeMonths();
      }
    }
    
    const asset = await Asset.create({ ...mappedData, companyId: req.user._id });
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Bu inventar nömrəsi artıq mövcuddur" });
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/assets/:id ──────────────────────────────────────────────────────
export const updateAsset = async (req, res) => {
  try {
    const mappedData = mapFrontendFields(req.body);
    
    // Kateqoriya dəyişibsə, usefulLifeMonths-ı yenilə
    if (mappedData.category) {
      const existingAsset = await Asset.findById(req.params.id);
      if (existingAsset && existingAsset.category !== mappedData.category) {
        const Category = mongoose.model("Category");
        const category = await Category.findOne({ name: mappedData.category });
        if (category && !mappedData.usefulLifeMonths) {
          mappedData.usefulLifeMonths = category.getUsefulLifeMonths();
        }
      }
    }
    
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      mappedData,
      { new: true, runValidators: true }
    );
    if (!asset)
      return res.status(404).json({ success: false, message: "Aktiv tapılmadı" });
    res.json({ success: true, data: asset });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/assets/:id ───────────────────────────────────────────────────
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    let filter = { companyId: req.user._id };

    if (mongoose.Types.ObjectId.isValid(id)) {
      filter._id = id;
    } else {
      filter.invNo = id;
    }

    const asset = await Asset.findOneAndDelete(filter);
    if (!asset)
      return res.status(404).json({ success: false, message: "Aktiv tapılmadı" });
    res.json({ success: true, message: "Aktiv silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};