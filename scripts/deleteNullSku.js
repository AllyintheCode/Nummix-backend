import "dotenv/config";
import mongoose from "mongoose";

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await mongoose.connection.collection("warehouses").deleteMany();

        console.log(`Deleted ${result.deletedCount} warehouses with null sku`);
    } catch (error) {
        console.error("Delete failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
