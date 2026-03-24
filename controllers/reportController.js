import { Asset } from "../models/index.js";

// ─── GET /api/reports/by-category ─────────────────────────────────────────────
export const getReportByCategory = async (req, res) => {
  try {
    const assets = await Asset.find({ companyId: req.user._id, status: "active" });

    const categoryMap = {};
    assets.forEach((asset) => {
      const cat = asset.category || "Digər";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, count: 0, totalValue: 0, currentValue: 0, depreciation: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].totalValue += asset.initialValue;
      categoryMap[cat].currentValue += asset.currentValue;
      categoryMap[cat].depreciation += asset.depreciation;
    });

    const grandTotal = { count: 0, totalValue: 0, currentValue: 0, depreciation: 0 };

    const rows = Object.values(categoryMap).map((row) => {
      grandTotal.count += row.count;
      grandTotal.totalValue += row.totalValue;
      grandTotal.currentValue += row.currentValue;
      grandTotal.depreciation += row.depreciation;
      return {
        ...row,
        depreciationPercent: row.totalValue > 0
          ? ((row.depreciation / row.totalValue) * 100).toFixed(2)
          : "0.00",
      };
    });

    grandTotal.depreciationPercent = grandTotal.totalValue > 0
      ? ((grandTotal.depreciation / grandTotal.totalValue) * 100).toFixed(2)
      : "0.00";

    res.json({ success: true, data: { rows, grandTotal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/reports/by-location ─────────────────────────────────────────────
export const getReportByLocation = async (req, res) => {
  try {
    const assets = await Asset.find({ companyId: req.user._id, status: "active" });

    const locationMap = {};
    assets.forEach((asset) => {
      const loc = asset.location || "Naməlum";
      if (!locationMap[loc]) {
        locationMap[loc] = { name: loc, count: 0, totalValue: 0, currentValue: 0 };
      }
      locationMap[loc].count += 1;
      locationMap[loc].totalValue += asset.initialValue;
      locationMap[loc].currentValue += asset.currentValue;
    });

    const grandTotalValue = Object.values(locationMap).reduce((s, l) => s + l.totalValue, 0);

    const rows = Object.values(locationMap).map((row) => ({
      ...row,
      share: grandTotalValue > 0
        ? ((row.totalValue / grandTotalValue) * 100).toFixed(2)
        : "0.00",
    }));

    const grandTotal = {
      count: rows.reduce((s, r) => s + r.count, 0),
      totalValue: grandTotalValue,
      currentValue: rows.reduce((s, r) => s + r.currentValue, 0),
      share: "100.00",
    };

    res.json({ success: true, data: { rows, grandTotal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/reports/depreciation-summary ────────────────────────────────────
export const getDepreciationSummary = async (req, res) => {
  try {
    const assets = await Asset.find({
      companyId: req.user._id,
      status: "active",
    }).sort({ category: 1, name: 1 });

    const data = assets.map((a) => ({
      invNo: a.invNo,
      name: a.name,
      category: a.category,
      initialValue: a.initialValue,
      currentValue: a.currentValue,
      depreciation: a.depreciation,
      depreciationRate: a.initialValue > 0
        ? ((a.depreciation / a.initialValue) * 100).toFixed(2)
        : "0.00",
      depreciationMethod: a.depreciationMethod,
      purchaseDate: a.purchaseDate,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};