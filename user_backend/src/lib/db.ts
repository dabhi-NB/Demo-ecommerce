import mongoose from 'mongoose';
import config from '../config';

const connectDB = async () => {
  try {
    // Set mongoose global options before connecting
    mongoose.set('bufferCommands', false); // Disable mongoose buffering

    const conn = await mongoose.connect(config.MONGODB_URI as string, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      bufferCommands: false, // Disable buffering on connection
    });
    console.log(`MongoDB: Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB: connection error:', error);
    // Exit process if DB connection fails during startup
    process.exit(1);
  }
};

export default connectDB;
