// models/companyFileModel.js
import mongoose from 'mongoose';
const companyFileSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['document', 'policy', 'report', 'training', 'template', 'other'],
    default: 'document'
  },
  
  // Fayl məlumatları
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  
  // Kim tərəfindən - String olaraq saxlayırıq
  uploadedBy: {
    type: String, // ObjectId əvəzinə String
    required: true,
    default: "system"
  },
  
  // Kimlər görə bilər
  visibleTo: {
    type: String,
    enum: ['all', 'departments', 'managers'], // Dəyərləri sadələşdiririk
    default: 'all'
  },
  departments: [{
    type: String
  }],
  
  // Statistikalar
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  
  // Metadata
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  }
}, { timestamps: true });

const CompanyFile = mongoose.model('CompanyFile', companyFileSchema);
export default CompanyFile;