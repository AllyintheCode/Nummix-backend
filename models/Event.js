import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String },
  date: { type: Date, required: true },
  dayOfWeek: { type: String },
  status: {
    type: String,
    enum: ["Workday", "Off day", "Holiday"],
    default: "Workday",
  },
  note: { type: String },
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;