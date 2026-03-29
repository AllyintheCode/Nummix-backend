// scripts/delete-employees-with-cleanup.js
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
// Əgər ayrıca maaş/vergi kolleksiyaları varsa, onları da import edin
// import SalaryPayment from '../models/SalaryPayment.js';
// import TaxRecord from '../models/TaxRecord.js';
import dotenv from 'dotenv';

dotenv.config();

// Silinəcək işçi ID-ləri (MongoDB ObjectId)
const employeeIdsToDelete = [
  '507f1f77bcf86cd799439011', // nümunə ID, real ID ilə dəyişin
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014',
  '507f1f77bcf86cd799439015'
];

// Alternativ olaraq şərtlə işçi seçmək istəyirsinizsə:
// const filter = { status: 'terminated' }; // məsələn, işdən çıxarılmış 5 işçi
// const employeesToDelete = await Employee.find(filter).limit(5);
// const employeeIdsToDelete = employeesToDelete.map(emp => emp._id);

const deleteEmployeesWithCleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB qoşuldu');

    // 1. Silinəcək işçiləri tapaq (yoxlama üçün)
    const employees = await Employee.find({ _id: { $in: employeeIdsToDelete } });
    if (employees.length === 0) {
      console.log('Heç bir işçi tapılmadı, proses dayandırıldı.');
      process.exit(0);
    }

    console.log(`Silinəcək işçilər (${employees.length}):`);
    employees.forEach(emp => {
      console.log(`- ${emp.firstName} ${emp.lastName} (${emp._id})`);
    });

    // 2. Əgər ayrıca maaş/vergi kolleksiyalarınız varsa, onları silin
    // Aşağıdakı hissəni öz modellərinizə uyğun dəyişin
    /*
    const salaryResult = await SalaryPayment.deleteMany({ employeeId: { $in: employeeIdsToDelete } });
    console.log(`${salaryResult.deletedCount} maaş qeydi silindi`);

    const taxResult = await TaxRecord.deleteMany({ employeeId: { $in: employeeIdsToDelete } });
    console.log(`${taxResult.deletedCount} vergi qeydi silindi`);
    */

    // 3. İşçi sənədlərini sil
    const deleteResult = await Employee.deleteMany({ _id: { $in: employeeIdsToDelete } });
    console.log(`${deleteResult.deletedCount} işçi silindi`);

    // 4. (İstəyə bağlı) Əgər işçi statusunu 'deleted' etmək istəsəniz, silməkdənsə:
    // await Employee.updateMany(
    //   { _id: { $in: employeeIdsToDelete } },
    //   { $set: { status: 'deleted', terminationDate: new Date() } }
    // );
    // console.log(`${employeeIdsToDelete.length} işçinin statusu "deleted" edildi`);

    console.log('Əməliyyat tamamlandı.');
    process.exit(0);
  } catch (err) {
    console.error('Xəta:', err);
    process.exit(1);
  }
};

deleteEmployeesWithCleanup();