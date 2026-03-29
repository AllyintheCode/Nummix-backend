import mongoose from 'mongoose';
import Employee, { MonthlySalary } from '../models/Employee.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Bütün MonthlySalary qeydlərini sil
    const monthlyResult = await MonthlySalary.deleteMany({});
    console.log(`🗑️ Deleted ${monthlyResult.deletedCount} MonthlySalary records`);

    // 2. Bütün Employee qeydlərini sil
    const employeeResult = await Employee.deleteMany({});
    console.log(`🗑️ Deleted ${employeeResult.deletedCount} Employee records`);

    // 3. Təsdiqləmə – hələ də qalan varmı?
    const remainingEmployees = await Employee.countDocuments();
    const remainingMonthly = await MonthlySalary.countDocuments();
    
    console.log('\n📊 Verification:');
    console.log(`   Remaining Employees: ${remainingEmployees}`);
    console.log(`   Remaining MonthlySalary: ${remainingMonthly}`);

    if (remainingEmployees === 0 && remainingMonthly === 0) {
      console.log('\n✨ Database is completely clean!');
    } else {
      console.log('\n⚠️ Warning: Some records still exist!');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanAllData();