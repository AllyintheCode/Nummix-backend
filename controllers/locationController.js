import { Location, Asset } from "../models/index.js";

// ─── GET /api/locations ───────────────────────────────────────────────────────
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find({
      companyId: req.user._id,
      isActive: true,
    }).sort({ name: 1 });

    const assetData = await Asset.aggregate([
      { $match: { companyId: req.user._id, status: "active" } },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          totalValue: { $sum: "$initialValue" },
        },
      },
    ]);

    const dataMap = {};
    assetData.forEach((item) => {
      dataMap[item._id] = { count: item.count, totalValue: item.totalValue };
    });

    const result = locations.map((loc) => ({
      ...loc.toObject(),
      assetCount: dataMap[loc.name]?.count || 0,
      totalValue: dataMap[loc.name]?.totalValue || 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/locations ──────────────────────────────────────────────────────
export const createLocation = async (req, res) => {
  try {
    const location = await Location.create({ ...req.body, companyId: req.user._id });
    res.status(201).json({ success: true, data: location });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Bu lokasiya artıq mövcuddur" });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/locations/:id ───────────────────────────────────────────────────
export const updateLocation = async (req, res) => {
  try {
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!location)
      return res.status(404).json({ success: false, message: "Lokasiya tapılmadı" });
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/locations/:id ────────────────────────────────────────────────
export const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findOne({ _id: req.params.id, companyId: req.user._id });
    if (!location)
      return res.status(404).json({ success: false, message: "Lokasiya tapılmadı" });

    const assetCount = await Asset.countDocuments({
      companyId: req.user._id,
      location: location.name,
    });
    if (assetCount > 0)
      return res.status(400).json({
        success: false,
        message: `Bu lokasiyada ${assetCount} aktiv var. Əvvəlcə aktivləri köçürün.`,
      });

    await location.deleteOne();
    res.json({ success: true, message: "Lokasiya silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};