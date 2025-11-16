import CashAndBank from "../models/CashAndBank.js";

// Yeni əməliyyat əlavə et
const createTransaction = async (req, res) => {
  try {
    const {
      operationType,
      amount,
      currency,
      category,
      type,
      account,
      description,
      createdBy,
    } = req.body;

    const transaction = new CashAndBank({
      operationType,
      amount,
      currency,
      category,
      type,
      account: type === "bank" ? account : undefined,
      description,
      createdBy,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bütün əməliyyatları götür
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await CashAndBank.find().populate(
      "createdBy",
      "fullName"
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tək əməliyyatın detallarını götür
const getTransactionById = async (req, res) => {
  try {
    const transaction = await CashAndBank.findById(req.params.id).populate(
      "createdBy",
      "fullName"
    );
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Əməliyyatı update et
const updateTransaction = async (req, res) => {
  try {
    const transaction = await CashAndBank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Əməliyyatı sil
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await CashAndBank.findByIdAndDelete(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Default export
export default {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
