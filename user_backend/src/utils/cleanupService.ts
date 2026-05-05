// import User from '../models/userModel';
// import logger from './logger';

// export class CleanupService {
//   private static intervalId: NodeJS.Timeout | null = null;
//   private static readonly CLEANUP_INTERVAL = 60 * 1000; // Run every 1 minute
//   private static readonly DEVICE_EXPIRY = 90 * 24 * 60 * 60 * 1000; // 90 days
//   // private static readonly DEVICE_EXPIRY = 5 * 60 * 1000; // 5 minutes

//   static startCleanupService(): void {
//     if (this.intervalId) {
//       logger.info('Cleanup service already running');
//       return;
//     }

//     logger.info('Starting TFA device cleanup service (runs every 1 minute)');

//     this.intervalId = setInterval(async () => {
//       try {
//         await this.cleanupExpiredDevices();
//       } catch (error) {
//         logger.error('Error in cleanup service:', error);
//       }
//     }, this.CLEANUP_INTERVAL);
//   }


//   static stopCleanupService(): void {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//       logger.info('Cleanup service stopped');
//     }
//   }

//   private static async cleanupExpiredDevices(): Promise<void> {
//     try {
//       const currentTime = Date.now();
//       const users = await User.find({ ignore_tfa_device: { $ne: "" } });

//       let totalCleaned = 0;

//       for (const user of users) {
//         if (!user.ignore_tfa_device) continue;

//         const deviceEntries = user.ignore_tfa_device.split(',');
//         const activeDevices = deviceEntries.filter(entry => {
//           const timestamp = parseInt(entry.split('_')[1]);
//           return (timestamp + this.DEVICE_EXPIRY) > currentTime;
//         });

//         if (activeDevices.length !== deviceEntries.length) {
//           const cleanedCount = deviceEntries.length - activeDevices.length;
//           user.ignore_tfa_device = activeDevices.length > 0 ? activeDevices.join(',') : '';
//           await user.save();
//           totalCleaned += cleanedCount;

//           if (cleanedCount > 0) {
//             logger.info(`Cleaned ${cleanedCount} expired TFA devices for user ${user._id}`);
//           }
//         }
//       }

//       if (totalCleaned > 0) {
//         logger.info(`Cleanup completed: Removed ${totalCleaned} expired TFA devices total`);
//       }
//     } catch (error) {
//       logger.error('Error in cleanupExpiredDevices:', error);
//     }
//   }

//   static async manualCleanup(): Promise<{ devicesRemoved: number }> {
//     logger.info('Manual cleanup triggered');
//     let totalCleaned = 0;

//     try {
//       const currentTime = Date.now();
//       const users = await User.find({ ignore_tfa_device: { $ne: "" } });

//       for (const user of users) {
//         if (!user.ignore_tfa_device) continue;

//         const deviceEntries = user.ignore_tfa_device.split(',');
//         const activeDevices = deviceEntries.filter(entry => {
//           const timestamp = parseInt(entry.split('_')[1]);
//           return (timestamp + this.DEVICE_EXPIRY) > currentTime;
//         });

//         if (activeDevices.length !== deviceEntries.length) {
//           const cleanedCount = deviceEntries.length - activeDevices.length;
//           user.ignore_tfa_device = activeDevices.length > 0 ? activeDevices.join(',') : '';
//           await user.save();
//           totalCleaned += cleanedCount;

//           if (cleanedCount > 0) {
//             logger.info(`Cleaned ${cleanedCount} expired TFA devices for user ${user._id}`);
//           }
//         }
//       }

//       if (totalCleaned > 0) {
//         logger.info(`Manual cleanup completed: Removed ${totalCleaned} expired TFA devices total`);
//       }
//     } catch (error) {
//       logger.error('Error in manual cleanup:', error);
//     }

//     return { devicesRemoved: totalCleaned };
//   }
// }
