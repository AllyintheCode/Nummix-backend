import Transaction from "../models/Transaction.js";

// Yeni transaction yaratmaq
export const createTransaction = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || entries.length < 2) {
      return res
        .status(400)
        .json({ message: "Ən azı 2 entry (debit və credit) olmalıdır." });
    }

    const totalDebit = entries
      .filter((e) => e.type === "debit")
      .reduce((s, e) => s + e.amount, 0);
    const totalCredit = entries
      .filter((e) => e.type === "credit")
      .reduce((s, e) => s + e.amount, 0);

    if (totalDebit !== totalCredit) {
      return res
        .status(400)
        .json({ message: "Debit və Credit bərabər olmalıdır." });
    }

    const transaction = new Transaction(req.body);
    await transaction.save();

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bütün transaction-ları gətir
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ID üzrə transaction
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction tapılmadı" });
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transaction update
export const updateTransaction = async (req, res) => {
  try {
    const { entries } = req.body;

    if (entries) {
      const totalDebit = entries
        .filter((e) => e.type === "debit")
        .reduce((s, e) => s + e.amount, 0);
      const totalCredit = entries
        .filter((e) => e.type === "credit")
        .reduce((s, e) => s + e.amount, 0);

      if (totalDebit !== totalCredit) {
        return res
          .status(400)
          .json({ message: "Debit və Credit bərabər olmalıdır." });
      }
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!transaction)
      return res.status(404).json({ message: "Transaction tapılmadı" });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transaction delete
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction tapılmadı" });
    res.status(200).json({ success: true, message: "Transaction silindi" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
