import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
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
  { timestamps: true }
);

// Status avtomatik günə görə dəyişəcək
paymentSchema.pre("save", function (next) {
  const today = new Date();
  if (this.status !== "completed") {
    if (this.dueDate < today) {
      this.status = "overdue";
    } else if (this.dueDate.toDateString() === today.toDateString()) {
      this.status = "pending";
    } else {
      this.status = "planned";
    }
  }
  next();
});

export default mongoose.model("Payment", paymentSchema);
