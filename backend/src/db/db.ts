import mongoose from "mongoose";

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nagarikcredits";
    await mongoose.connect(mongoUri, { dbName: "NagarikCredits" });
    console.log("🍃 Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
