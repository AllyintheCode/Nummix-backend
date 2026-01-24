import mongoose from "mongoose";

const employeeFlowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  type: {
    type: String,
    enum: ["hired", "terminated", "resigned"],
    required: true,
  },
  date: { type: Date, required: true },
  department: { type: String },
  position: { type: String },
  reason: { type: String },
  notes: { type: String },
}, { timestamps: true });

const EmployeeFlow = mongoose.model("EmployeeFlow", employeeFlowSchema);
export default EmployeeFlow;