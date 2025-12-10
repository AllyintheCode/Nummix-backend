const CashAndBank = require("../models/CashAndBank");

// Yeni əməliyyat əlavə et
exports.createTransaction = async (req, res) => {
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
exports.getAllTransactions = async (req, res) => {
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
exports.getTransactionById = async (req, res) => {
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
exports.updateTransaction = async (req, res) => {
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
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await CashAndBank.findByIdAndDelete(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
