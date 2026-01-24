import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paymentType: {
    type: String,
    enum: ["salary", "social_insurance", "income_tax", "its", "ish", "gv"],
    required: true,
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "completed",
  },
  forMonth: { type: Date, required: true },
  description: { type: String },
  paymentFor: {
    type: String,
    enum: ["employee", "employer"],
    required: true
  }
}, { timestamps: true });
 
const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;