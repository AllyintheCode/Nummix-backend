import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    entries: [
      {
        account: {
          type: String,
          enum: ["Cash", "Bank", "Sales", "Expense"], // yalnız bu 4 variantdan biri ola bilər
          required: true,
        },
        type: {
          type: String,
          enum: ["debit", "credit"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    createdBy: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // istəsən silə bilərsən, sadəcə gələcəkdə lazım ola bilər
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
