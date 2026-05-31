import mongoose from "mongoose";

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://admin:KernelOrigin%4012@144.24.119.208:25565/?directConnection=true&serverSelectionTimeoutMS=2000";
    await mongoose.connect(mongoUri, { dbName: "nagarikcredits" });
    console.log("🍃 Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
