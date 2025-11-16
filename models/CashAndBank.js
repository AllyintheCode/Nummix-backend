import mongoose from "mongoose";

const CashAndBankSchema = new mongoose.Schema({
  operationType: {
    type: String,
    enum: ["inflow", "outflow"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["sales", "salary", "other"],
    required: true,
  },
  type: {
    type: String,
    enum: ["cash", "bank"],
    required: true,
  },
  account: {
    type: String,
    enum: ["Pasha Bank", "Rabite", "Kapital", "ABB"],
    required: function () {
      return this.type === "bank";
    },
  },
  description: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CashAndBank = mongoose.model("CashAndBank", CashAndBankSchema);

// 🔹 Default export ESM üçün
export default CashAndBank;
