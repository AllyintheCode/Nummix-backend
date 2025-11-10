import Warehouse from "../models/warehousesSchema.js";

export const getAllWarehouses = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const warehouses = await Warehouse.find({
            userId: req.user?._id,
            $text: { $search: searchQuery },
        }).sort({
            createdAt: -1,
        });

        if (!warehouses || !warehouses.length) {
            return res.status(404).json({ message: "No warehouses found." });
        }

        res.status(200).json({
            message: "Warehouses retrieved successfully",
            data: warehouses,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findOne({ _id: id, userId: req.user?._id });

        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        res.status(200).json({
            message: "Warehouse retrieved successfully",
            data: warehouse,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createWarehouse = async (req, res) => {
    try {
        const { name, location, capacity, products, history } = req.body;

        if (!name || !location || capacity == null) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const newWarehouse = new Warehouse({
            userId: req.user?._id,
            name,
            location,
            capacity,
            products,
            history,
        });

        const savedWarehouse = await newWarehouse.save();

        res.status(201).json({
            message: "Warehouse created successfully",
            data: savedWarehouse,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findOne({ _id: id, userId: req.user?._id });

        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        warehouse.name = req.body.name || warehouse.name;
        warehouse.location = req.body.location || warehouse.location;
        warehouse.capacity = req.body.capacity ?? warehouse.capacity;
        warehouse.products = req.body.products || warehouse.products;
        warehouse.history = req.body.history || warehouse.history;

        await warehouse.save();

        res.status(200).json({
            message: "Warehouse updated successfully",
            data: warehouse,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeWarehouseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const warehouse = await Warehouse.findOne({ _id: id, userId: req.user?._id });

        if (!warehouse) {
            return res.status(404).json({ message: "Warehouse not found." });
        }

        warehouse.isActive = !warehouse.isActive;
        await warehouse.save();

        res.status(200).json({
            message: "Warehouse status updated successfully",
            data: warehouse,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
