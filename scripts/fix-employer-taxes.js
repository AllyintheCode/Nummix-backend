// scripts/fix-employer-taxes.js
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import dotenv from 'dotenv';

dotenv.config();

const fixEmployerTaxes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB qoşuldu');

    // 1. Sahəsi olmayan və ya null olan işçiləri tap
    const result = await Employee.updateMany(
      {
        $or: [
          { employer_taxes: { $exists: false } },
          { employer_taxes: null }
        ]
      },
      {
        $set: {
          employer_taxes: {
            dsmf: 0,
            its: 0,
            ish: 0,
            total: 0
          }
        }
      }
    );

    console.log(`${result.modifiedCount} işçi yeniləndi`);
    process.exit(0);
  } catch (err) {
    console.error('Xəta:', err);
    process.exit(1);
  }
};

fixEmployerTaxes();