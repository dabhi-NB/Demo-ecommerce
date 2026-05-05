import mongoose from 'mongoose';
import config from '../config';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI as string);
    console.log(`MongoDB: Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB: connection error:', error);
    // Do not exit the process — allow the server to start even if DB is unavailable.
    // Upstream code should handle DB unavailability as needed.
    return;
  }
};

export default connectDB;
