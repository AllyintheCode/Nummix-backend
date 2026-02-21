import Product from "../models/productsSchema.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ userId: req.user?._id, isActive: true }).sort({
            createdAt: -1,
        });

        if (!products || !products.length) {
            return res.status(404).json({ message: "No products found." });
        }

        res.status(200).json({
            message: "Products retrieved successfully",
            data: products,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Product ID must be provided." });
        }
        const product = await Product.findOne({ _id: id, userId: req.user?._id, isActive: true });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json({
            message: "Product retrieved successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createProduct = async (req, res) => {
    try {
        const {
            SKU,
            barcode,
            productName,
            category,
            unitOfMeasure,
            minStock,
            maxStock,
            cost,
            initialQuantity,
            storageLocation,
            status,
        } = req.body;

        if (
            !SKU ||
            !barcode ||
            !productName ||
            !category ||
            !unitOfMeasure ||
            minStock == null ||
            maxStock == null ||
            cost == null ||
            initialQuantity == null ||
            !storageLocation
        ) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const image = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

        const newProduct = new Product({
            userId: req.user?._id,
            SKU,
            barcode,
            productName,
            category,
            unitOfMeasure,
            minStock,
            maxStock,
            cost,
            initialQuantity,
            storageLocation,
            status,
            ...(image ? { image } : {}),
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: "Product created successfully",
            data: savedProduct,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Product ID must be provided." });
        }
        const product = await Product.findOne({ _id: id, userId: req.user?._id, isActive: true });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        product.SKU = req.body.SKU || product.SKU;
        product.barcode = req.body.barcode || product.barcode;
        product.productName = req.body.productName || product.productName;
        product.category = req.body.category || product.category;
        product.unitOfMeasure = req.body.unitOfMeasure || product.unitOfMeasure;
        product.minStock = req.body.minStock ?? product.minStock;
        product.maxStock = req.body.maxStock ?? product.maxStock;
        product.cost = req.body.cost ?? product.cost;
        product.initialQuantity = req.body.initialQuantity ?? product.initialQuantity;
        product.storageLocation = req.body.storageLocation || product.storageLocation;
        product.status = req.body.status || product.status;

        if (req.file) {
            product.image = req.file.path.replace(/\\/g, "/");
        }

        await product.save();

        res.status(200).json({
            message: "Product updated successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Product ID must be provided." });
        }
        const product = await Product.findOne({ _id: id, userId: req.user?._id, isActive: true });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        product.isActive = !product.isActive;
        await product.save();

        res.status(200).json({
            message: "Product active status toggled successfully",
            data: product,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
