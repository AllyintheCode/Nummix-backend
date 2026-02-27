import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["outflow", "receipt"],
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["AZN", "USD", "RUB", "EUR"],
      default: "AZN",
    },
    status: {
      type: String,
      enum: ["planned", "pending", "overdue", "completed"],
      default: "planned",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Status avtomatik günə görə dəyişəcək (düzgün versiya)
paymentSchema.pre("save", function (next) {
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const due = new Date(this.dueDate);

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (this.status !== "completed") {
    if (dueDay < today) {
      this.status = "overdue";
    } else if (dueDay.getTime() === today.getTime()) {
      this.status = "pending";
    } else {
      this.status = "planned";
    }
  }

  next();
});

export default mongoose.model("Payment", paymentSchema);
