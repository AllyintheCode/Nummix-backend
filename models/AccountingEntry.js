import mongoose from "mongoose";

const accountingEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountCode: {
    type: String,
    required: true,
    enum: ["543", "531", "533", "535"],
  },
  accountName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
    enum: ["debit", "credit"],
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  documentNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "posted", "cancelled"],
    default: "draft",
  },
  relatedTransaction: {
    type: String,
  },
}, { timestamps: true });

const AccountingEntry = mongoose.model("AccountingEntry", accountingEntrySchema);
export default AccountingEntry;