import app from './app';
import connectDB from './lib/db';
import config from './config';
// import { CleanupService } from './utils/cleanupService';

const PORT = config.PORT;
const HOST = config.HOST;

const startServer = async () => {
  console.log('server: connecting to DB');
  await connectDB();
  console.log('server: DB connected');

  // Start the TFA device cleanup service
  // CleanupService.startCleanupService();

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
    console.log(`📡 Health: http://${HOST}:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

};

// Global error handlers: surface unexpected errors and rejections
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
