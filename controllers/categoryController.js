import { Category, Asset } from "../models/index.js";

// ─── GET /api/categories ──────────────────────────────────────────────────────
// GET — bütün şirkətlər üçün eyni siyahı
export const getCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });

    // DB boşdursa seed et (bir dəfəlik)
    if (categories.length === 0) {
      categories = await Category.insertMany(DEFAULT_CATEGORIES);
    }

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST — artıq companyId yoxdur
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!VALID_NAMES.has(name)) {
      return res.status(400).json({
        success: false,
        message: "Yalnız qanunla müəyyən edilmiş kateqoriyalar əlavə edilə bilər",
        allowedCategories: DEFAULT_CATEGORIES.map((c) => c.name),
      });
    }
    const defaults = DEFAULT_CATEGORIES.find((c) => c.name === name);
    const category = await Category.create({
      ...defaults,
      ...req.body,
      depreciationRate: defaults.depreciationRate,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Bu kateqoriya artıq mövcuddur" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT — companyId filtr yoxdur, admin səviyyəli dəyişiklik
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Kateqoriya tapılmadı" });

    const isIntangible = category.name === "Qeyri-maddi aktivlər";
    const { name, depreciationRate, ...rest } = req.body;

    const updates = isIntangible
      ? { ...rest, depreciationRate, monthlyRate: depreciationRate / 12 }
      : rest;

    const updated = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE — asset yoxlaması qlobal olur
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Kateqoriya tapılmadı" });

    const assetCount = await Asset.countDocuments({ category: category.name });
    if (assetCount > 0)
      return res.status(400).json({
        success: false,
        message: `Bu kateqoriyada ${assetCount} aktiv var. Əvvəlcə aktivləri köçürün.`,
      });

    await category.deleteOne();
    res.json({ success: true, message: "Kateqoriya silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};