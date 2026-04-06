import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 saniyə sonra timeout versin
    });

    console.log(`MongoDB qoşuldu: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB xətası: ${error.message}`);
    process.exit(1); // Serveri dayandırır əgər DB qoşulmasa
  }
};
