import Order from "../models/ordersSchema.js";
import Supplier from "../models/suppliersSchema.js";

export const getAllOrders = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const orders = await Order.find({ userId: req.user?._id, $text: { $search: searchQuery } }).sort({
            createdAt: -1,
        });

        if (!orders || !orders.length) {
            return res.status(404).json({ message: "No orders found." });
        }

        res.status(200).json({
            message: "Orders retrieved successfully",
            data: orders,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findOne({ _id: id, userId: req.user?._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        res.status(200).json({
            message: "Order retrieved successfully",
            data: order,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { orderNumber, supplierId, date, deliveryDate, amount, status } = req.body;

        if (!orderNumber || !supplierId || !date || !deliveryDate || amount == null) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found." });
        }

        const newOrder = new Order({
            userId: req.user?._id,
            orderNumber,
            supplierId,
            date,
            deliveryDate,
            amount,
            status,
        });

        const savedOrder = await newOrder.save();

        res.status(201).json({
            message: "Order created successfully",
            data: savedOrder,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findOne({ _id: id, userId: req.user?._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.orderNumber = req.body.orderNumber || order.orderNumber;
        order.date = req.body.date || order.date;
        order.deliveryDate = req.body.deliveryDate || order.deliveryDate;
        order.amount = req.body.amount ?? order.amount;
        order.status = req.body.status || order.status;

        const supplier = await Supplier.findById(req.body.supplierId);
        order.supplierId = req.body.supplierId ? supplier._id : order.supplierId;

        await order.save();

        res.status(200).json({
            message: "Order updated successfully",
            data: order,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findOne({ _id: id, userId: req.user?._id });

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.isActive = !order.isActive;
        await order.save();

        res.status(200).json({
            message: "Order active status toggled successfully",
            data: order,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
