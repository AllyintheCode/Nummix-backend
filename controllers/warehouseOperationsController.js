import Warehouse from "../models/warehousesSchema.js";
import Product from "../models/productsSchema.js";
import WarehouseTransaction from "../models/warehouseTransactionsSchema.js";

// Helper to ensure capacity and update stock
async function adjustStock({ warehouse, productId, lotSerial, quantity, quality, type }) {
    // Find existing stock item (by product + lot if provided)
    const existingIndex = warehouse.stock.findIndex(
        (s) =>
            s.productId.toString() === productId.toString() && (lotSerial ? s.lotSerial === lotSerial : true)
    );

    if (type === "GRN") {
        // Capacity check (simple: sum quantities + incoming <= capacity)
        const currentTotal = warehouse.stock.reduce((sum, s) => sum + s.quantity, 0);
        if (currentTotal + quantity > warehouse.capacity) {
            throw new Error("Capacity exceeded for warehouse");
        }

        if (existingIndex >= 0) {
            warehouse.stock[existingIndex].quantity += quantity;
            if (quality) warehouse.stock[existingIndex].quality = quality;
        } else {
            warehouse.stock.push({ productId, lotSerial, quantity, quality });
        }
    } else if (type === "DELIVERY") {
        if (existingIndex < 0 || warehouse.stock[existingIndex].quantity < quantity) {
            throw new Error("Insufficient stock for delivery");
        }
        warehouse.stock[existingIndex].quantity -= quantity;
        if (warehouse.stock[existingIndex].quantity === 0) {
            warehouse.stock.splice(existingIndex, 1);
        }
    } else if (type === "TRANSFER") {
        // handled externally (source vs destination operations)
    }
}

export const createGRN = async (req, res) => {
    try {
        const { warehouseId, productId, quantity, lotSerial, quality, purchaseOrder, notes, date } = req.body;
        if (!warehouseId || !productId || quantity == null) {
            return res.status(400).json({ message: "warehouseId, productId and quantity are required" });
        }

        const warehouse = await Warehouse.findOne({ _id: warehouseId, userId: req.user?._id });
        if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

        const product = await Product.findOne({ _id: productId, userId: req.user?._id });
        if (!product) return res.status(404).json({ message: "Product not found" });

        try {
            await adjustStock({ warehouse, productId, lotSerial, quantity, quality, type: "GRN" });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }

        warehouse.history.push({
            type: "GRN",
            productId,
            lotSerial,
            quantity,
            date: date || new Date(),
            purchaseOrder,
            notes,
        });

        const tx = new WarehouseTransaction({
            userId: req.user?._id,
            type: "GRN",
            warehouseId,
            productId,
            quantity,
            lotSerial,
            quality,
            purchaseOrder,
            notes,
            date: date || new Date(),
        });

        await Promise.all([warehouse.save(), tx.save()]);

        res.status(201).json({ message: "Goods receipt recorded", data: { warehouse, transaction: tx } });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createDelivery = async (req, res) => {
    try {
        const { warehouseId, productId, quantity, lotSerial, notes, date } = req.body;
        if (!warehouseId || !productId || quantity == null) {
            return res.status(400).json({ message: "warehouseId, productId and quantity are required" });
        }

        const warehouse = await Warehouse.findOne({ _id: warehouseId, userId: req.user?._id });
        if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

        const product = await Product.findOne({ _id: productId, userId: req.user?._id });
        if (!product) return res.status(404).json({ message: "Product not found" });

        try {
            await adjustStock({ warehouse, productId, lotSerial, quantity, type: "DELIVERY" });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }

        warehouse.history.push({
            type: "DELIVERY",
            productId,
            lotSerial,
            quantity,
            date: date || new Date(),
            notes,
        });

        const tx = new WarehouseTransaction({
            userId: req.user?._id,
            type: "DELIVERY",
            warehouseId,
            productId,
            quantity,
            lotSerial,
            notes,
            date: date || new Date(),
        });

        await Promise.all([warehouse.save(), tx.save()]);

        res.status(201).json({ message: "Delivery recorded", data: { warehouse, transaction: tx } });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createTransfer = async (req, res) => {
    try {
        const { fromWarehouseId, toWarehouseId, productId, quantity, lotSerial, notes, date } = req.body;
        if (!fromWarehouseId || !toWarehouseId || !productId || quantity == null) {
            return res
                .status(400)
                .json({ message: "fromWarehouseId, toWarehouseId, productId, quantity are required" });
        }
        if (fromWarehouseId === toWarehouseId) {
            return res.status(400).json({ message: "Source and destination warehouses must differ" });
        }

        const fromWh = await Warehouse.findOne({ _id: fromWarehouseId, userId: req.user?._id });
        const toWh = await Warehouse.findOne({ _id: toWarehouseId, userId: req.user?._id });
        if (!fromWh || !toWh) return res.status(404).json({ message: "One or both warehouses not found" });

        const product = await Product.findOne({ _id: productId, userId: req.user?._id });
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Remove from source
        try {
            await adjustStock({ warehouse: fromWh, productId, lotSerial, quantity, type: "DELIVERY" });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }
        // Add to destination
        try {
            await adjustStock({
                warehouse: toWh,
                productId,
                lotSerial,
                quantity,
                quality: "Accept",
                type: "GRN",
            });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }

        const tx = new WarehouseTransaction({
            userId: req.user?._id,
            type: "TRANSFER",
            fromWarehouseId,
            toWarehouseId,
            productId,
            quantity,
            lotSerial,
            notes,
            date: date || new Date(),
        });

        fromWh.history.push({
            type: "TRANSFER",
            productId,
            lotSerial,
            quantity: -quantity,
            fromWarehouseId,
            toWarehouseId,
            date: date || new Date(),
            notes,
        });
        toWh.history.push({
            type: "TRANSFER",
            productId,
            lotSerial,
            quantity,
            fromWarehouseId,
            toWarehouseId,
            date: date || new Date(),
            notes,
        });

        await Promise.all([fromWh.save(), toWh.save(), tx.save()]);

        res.status(201).json({
            message: "Transfer completed",
            data: { fromWarehouse: fromWh, toWarehouse: toWh, transaction: tx },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getWarehouseHistory = async (req, res) => {
    try {
        const { warehouseId } = req.query;
        if (!warehouseId) return res.status(400).json({ message: "warehouseId is required" });
        const warehouse = await Warehouse.findOne({ _id: warehouseId, userId: req.user?._id }).populate(
            "history.productId",
            "name SKU"
        );
        
        if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
        
        res.status(200).json({ message: "History retrieved", data: warehouse.history });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
