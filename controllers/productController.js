import { productModel } from "../models/productShcema.js";
import mongoose from "mongoose";


// 🔹 Məhsulların siyahısını gətir
export const getProducts = async (req, res) => {
    try {
        const products = await productModel.find();
        res.status(200).send(products);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Məhsullar alınarkən xəta baş verdi ❌",
            error: err.message,
        });
    }
};
// id ilə məhsulu gətir
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productModel.findById(id);
        res.status(200).send(product);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Məhsul alınarkən xəta baş verdi ❌",
            error: err.message,
        });
    }
};
// 🔹 Yeni məhsul əlavə et
export const postProduct = async (req, res) => {
    try {
        const data = req.body;
        const newProduct = await productModel.create(data);
        res.status(201).json({
            success: true,
            message: "Məhsul uğurla əlavə edildi ✅",
            data: newProduct,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Məhsul əlavə edilərkən xəta baş verdi ❌",
            error: err.message,
        });
    }
};
// 🔹 Mövcud məhsulu sil
export const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await productModel.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Məhsul tapılmadı ❌",
            });
        }

        res.status(200).json({
            success: true,
            message: "Məhsul uğurla silindi ✅",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Məhsul silinərkən xəta baş verdi ❌",
            error: err.message,
        });
    }
};

// export const putProduct = (req, res) => {
//     const data = req.body;
//     const id = req.params.id;
//     if (data.name.trim()) {
//         genreModel.create(data);
//         res.status(201).send(data);
//     } else { res.status(400).send({ message: "Please fill all fields" }) }
// }

export const putProduct = async (req, res) => {



    try {
        const id = req.params.id;
        const data = req.body;

        // ID formatını yoxla
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Yanlış ID formatı ❌",
            });
        }

        // Məhsulu yenilə
        const updatedProduct = await productModel.findByIdAndUpdate(id, data, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Məhsul tapılmadı ❌",
            });
        }

        res.status(200).json({
            success: true,
            message: "Məhsul uğurla yeniləndi ✅",
            data: updatedProduct,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Məhsul yenilənərkən xəta baş verdi ❌",
            error: err.message,
        });
    }
};