import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB qoşuldu: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB xətası: ${error.message}`);
    process.exit(1); // Serveri dayandırır əgər DB qoşulmasa
  }
};
