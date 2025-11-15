import Inventory from "../models/inventorySchema.js";

export const getAllInventory = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const inventory = await Inventory.find({
            userId: req.user?._id,
            $text: { $search: searchQuery },
        }).sort({
            createdAt: -1,
        });

        if (!inventory || !inventory.length) {
            return res.status(404).json({ message: "No inventory records found." });
        }

        res.status(200).json({
            message: "Inventory records retrieved successfully",
            data: inventory,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Inventory.findOne({ _id: id, userId: req.user?._id });

        if (!record) {
            return res.status(404).json({ message: "Inventory record not found." });
        }

        res.status(200).json({
            message: "Inventory record retrieved successfully",
            data: record,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createInventory = async (req, res) => {
    try {
        const { SKU, product, warehouseId, localtion, quantity, cost, totalValue } = req.body;

        if (!SKU || !product || !warehouseId || localtion == null || quantity == null || cost == null) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const newInventory = new Inventory({
            userId: req.user?._id,
            SKU,
            product,
            warehouseId,
            localtion,
            quantity,
            cost,
            totalValue: totalValue != null ? totalValue : Number(quantity) * Number(cost),
        });

        const saved = await newInventory.save();

        res.status(201).json({
            message: "Inventory record created successfully",
            data: saved,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Inventory.findOne({ _id: id, userId: req.user?._id });

        if (!record) {
            return res.status(404).json({ message: "Inventory record not found." });
        }

        record.SKU = req.body.SKU || record.SKU;
        record.product = req.body.product || record.product;
        record.warehouseId = req.body.warehouseId || record.warehouseId;
        record.localtion = req.body.localtion ?? record.localtion;
        record.quantity = req.body.quantity ?? record.quantity;
        record.cost = req.body.cost ?? record.cost;

        if (req.body.totalValue != null) {
            record.totalValue = req.body.totalValue;
        } else if (req.body.quantity != null || req.body.cost != null) {
            record.totalValue = Number(record.quantity) * Number(record.cost);
        }

        await record.save();

        res.status(200).json({
            message: "Inventory record updated successfully",
            data: record,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeInventoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Inventory.findOne({ _id: id, userId: req.user?._id });

        if (!record) {
            return res.status(404).json({ message: "Inventory record not found." });
        }

        record.isActive = !record.isActive;
        await record.save();

        res.status(200).json({
            message: "Inventory record status updated successfully",
            data: record,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
