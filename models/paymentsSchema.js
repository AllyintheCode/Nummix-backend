import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplierName: {
      type: String,
      required: function () {
        return !this.customerId;
      },
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: function () {
        return !this.supplierName;
      },
    },
    invoiceNumber: { type: String, trim: true, unique: true, sparse: true },
    type: { type: String, enum: ["outflow", "receipt"], required: true },
    category: { type: String, required: false },
    date: { type: Date, required: true },
    dueDate: { type: Date, required: false },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      enum: ["AZN", "USD", "RUB", "EUR"],
      default: "AZN",
    },
    method: {
      type: String,
      enum: ["Cash", "Credit Card", "Bank Transfer"],
      required: false,
    },
    status: {
      type: String,
      enum: [
        "planned",
        "pending",
        "overdue",
        "completed",
        "Pending",
        "Completed",
        "Cancelled",
      ],
      default: "planned",
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Status avtomatik günə görə dəyişəcək
PaymentSchema.pre("save", function (next) {
  const today = new Date();
  if (!["completed", "Completed", "Cancelled"].includes(this.status)) {
    if (this.dueDate && this.dueDate < today) this.status = "overdue";
    else if (
      this.dueDate &&
      this.dueDate.toDateString() === today.toDateString()
    )
      this.status = "pending";
    else this.status = "planned";
  }
  next();
});

// Burada text index yaradılır
PaymentSchema.index({ invoiceNumber: "text", supplierName: "text" });

export default mongoose.model("Payment", PaymentSchema);
