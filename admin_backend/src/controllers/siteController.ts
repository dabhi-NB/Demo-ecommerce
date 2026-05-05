import { Request, Response } from 'express';
import User from '../models/userModel';
import Order from '../models/orderModel';
import Product from '../models/productModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { ChartService } from '../utils/chartService';


// Admin Dashboard API
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  // Fetch all users that are not deleted
  const users = await User.find({ deleted_at: null }).select("status").lean();

  let totalUsers = users.length;
  let activeUsers = 0;
  let inactiveUsers = 0;
  let unknownStatus = 0; // for any weird/missing status

  users.forEach(user => {
    const status = typeof user.status === "string" ? parseInt(user.status) : user.status;

    if (status === 1) activeUsers++;
    else if (status === 0) inactiveUsers++;
    else unknownStatus++;
  });

  // Get start of today for todayOrders calculation
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Add ecommerce stats to existing dashboard query (use Promise.allSettled so it doesn't break if models don't exist yet)
  const [orderStatsResult, productCountResult, lowStockResult] = await Promise.allSettled([
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
          pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['placed', 'confirmed']] }, 1, 0] } },
          todayOrders: { $sum: 1 },
        }
      }
    ]),
    Product.countDocuments({ isActive: true }),
    Product.find({ stock: { $lte: 5, $gt: 0 }, isActive: true })
      .select('name stock sku')
      .limit(5)
      .lean(),
  ]);

  const orderStats = orderStatsResult.status === 'fulfilled' ? orderStatsResult.value[0] : null;
  const productCount = productCountResult.status === 'fulfilled' ? productCountResult.value : 0;
  const lowStockProducts = lowStockResult.status === 'fulfilled' ? lowStockResult.value : [];

  // Also get all-time stats
  const [allTimeStatsResult] = await Promise.allSettled([
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
          pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['placed', 'confirmed']] }, 1, 0] } },
        }
      }
    ]),
  ]);

  const allTimeStats = allTimeStatsResult.status === 'fulfilled' ? allTimeStatsResult.value[0] : null;

  return res.status(200).json({
    totalUsers,
    activeUsers,
    inactiveUsers,
    ecommerce: {
      totalOrders: allTimeStats?.totalOrders || 0,
      totalRevenue: allTimeStats?.totalRevenue || 0,
      pendingOrders: allTimeStats?.pendingOrders || 0,
      todayOrders: orderStats?.todayOrders || 0,
      totalProducts: productCount,
      lowStockProducts,
    },
  });
});


export const getChartUser = asyncHandler(async (req: Request, res: Response) => {
  const type = req.body.type || 'year';
  let result;

  switch (type) {
    case 'day':
      result = await ChartService.getUserLast7DaysChartData();
      break;
    case 'month':
      result = await ChartService.getUserLast6MonthsChartData();
      break;
    default:
      result = await ChartService.getUserMonthlyChartData();
      break;
  }

  res.json(result);
});

export const getOrderStatusChart = asyncHandler(async (req: Request, res: Response) => {
  const result = await ChartService.getOrderStatusChartData();
  res.json(result);
});

export const getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
  const result = await ChartService.getRevenueChartData();
  res.json(result);
});
