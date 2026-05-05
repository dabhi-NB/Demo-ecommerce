import app from './app';
import connectDB from './lib/db';
import config from './config';

const PORT = config.PORT;
const HOST = config.HOST;

const startServer = async () => {
  console.log('server: connecting to DB');
  await connectDB();
  console.log('server: DB connected');
  app.listen(PORT, HOST, () => {
    console.log(`Server: running at http://${HOST}:${PORT}`);
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
