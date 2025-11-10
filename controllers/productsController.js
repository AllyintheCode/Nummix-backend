import Product from "../models/productsSchema.js";

export const getAllProducts = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const products = await Product.find({ userId: req.user?._id, $text: { $search: searchQuery } }).sort({
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
        const product = await Product.findOne({ _id: id, userId: req.user?._id });

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
            name,
            category,
            unitOfMeasure,
            minStock,
            maxStock,
            price,
            storageLocation,
            status,
        } = req.body;

        if (
            !SKU ||
            !barcode ||
            !name ||
            !category ||
            !unitOfMeasure ||
            minStock == null ||
            maxStock == null ||
            price == null ||
            !storageLocation
        ) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const newProduct = new Product({
            userId: req.user?._id,
            SKU,
            barcode,
            name,
            category,
            unitOfMeasure,
            minStock,
            maxStock,
            price,
            storageLocation,
            status,
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: "Product created successfully",
            data: savedProduct,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, userId: req.user?._id });

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        product.SKU = req.body.SKU || product.SKU;
        product.barcode = req.body.barcode || product.barcode;
        product.name = req.body.name || product.name;
        product.category = req.body.category || product.category;
        product.unitOfMeasure = req.body.unitOfMeasure || product.unitOfMeasure;
        product.minStock = req.body.minStock ?? product.minStock;
        product.maxStock = req.body.maxStock ?? product.maxStock;
        product.price = req.body.price ?? product.price;
        product.storageLocation = req.body.storageLocation || product.storageLocation;
        product.status = req.body.status || product.status;

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
        const product = await Product.findOne({ _id: id, userId: req.user?._id });

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
