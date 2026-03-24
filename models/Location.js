import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Yer adı tələb olunur"],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

LocationSchema.index({ companyId: 1, name: 1 }, { unique: true });

const Location = mongoose.model("Location", LocationSchema);

export default Location;