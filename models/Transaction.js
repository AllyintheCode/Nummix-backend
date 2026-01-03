import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now }, // Tarix
    reference: { type: String, required: true, trim: true }, // İstinad
    currency: {
      type: String,
      enum: ["AZN", "USD", "EUR", "TRY", "GBP"],
      default: "AZN",
    },
    description: { type: String, trim: true },
    entries: [
      {
        account: {
          type: String,
          enum: [
            "Cash",
            "Bank",
            "Sales",
            "Expense",
            "Inventory",
            "Payables",
            "Receivables",
          ],
          required: true,
        },
        debit: { type: Number, default: 0, min: 0 },
        credit: { type: Number, default: 0, min: 0 },
        liquidityValue: { type: Number, min: 0 },
      },
    ],
    createdBy: {
      fullName: { type: String, required: true, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
