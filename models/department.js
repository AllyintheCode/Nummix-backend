import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, "Şöbə adı tələb olunur"],
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  managerName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    default: 0,
    min: 0,
    set: v => parseFloat(parseFloat(v).toFixed(2))
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

departmentSchema.virtual('assets', {
  ref: 'Asset',
  localField: '_id',
  foreignField: 'department',
  justOne: false
});

departmentSchema.index({ userId: 1, name: 1 }, { unique: true });

departmentSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ name: 1 });
};

const Department = mongoose.model("Department", departmentSchema);
export default Department;