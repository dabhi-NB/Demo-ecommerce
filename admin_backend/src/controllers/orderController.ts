import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/orderModel';
import Product from '../models/productModel';
import User from '../models/userModel';
import Setting from '../models/settingModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { logStockChange } from '../models/stockHistoryModel';
import { sendSMS, SMS_TEMPLATES } from '../utils/smsService';

// Get all orders (Admin) with pagination, filters, and search
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, any> = {};

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by paymentMethod
  if (req.query.paymentMethod) {
    query.paymentMethod = req.query.paymentMethod;
  }

  // Filter by paymentStatus
  if (req.query.paymentStatus) {
    query.paymentStatus = req.query.paymentStatus;
  }

  // Filter by productId (orders containing a specific product)
  if (req.query.productId) {
    query.items = {
      $elemMatch: {
        product: req.query.productId
      }
    };
  }

  // Filter by date range
  if (req.query.dateFrom || req.query.dateTo) {
    query.createdAt = {};
    if (req.query.dateFrom) {
      query.createdAt.$gte = new Date(req.query.dateFrom as string);
    }
    if (req.query.dateTo) {
      query.createdAt.$lte = new Date(req.query.dateTo as string);
    }
  }

  // Search by orderNumber or user email
  if (req.query.q) {
    const searchRegex = { $regex: req.query.q, $options: 'i' };
    // Find user IDs matching email
    const users = await User.find({ email: searchRegex }).select('_id').lean();
    const userIds = users.map((u) => u._id);

    query.$or = [
      { orderNumber: searchRegex },
      { user: { $in: userIds } },
    ];
  }

  // Get total count
  const total = await Order.countDocuments(query);

  // Get orders with pagination, sorting, and populate user
  const orders = await Order.find(query)
    .populate('user', 'first_name last_name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get stats
  const stats = {
    total: await Order.countDocuments(),
    placed: await Order.countDocuments({ status: 'placed' }),
    confirmed: await Order.countDocuments({ status: 'confirmed' }),
    processing: await Order.countDocuments({ status: 'processing' }),
    shipped: await Order.countDocuments({ status: 'shipped' }),
    delivered: await Order.countDocuments({ status: 'delivered' }),
    cancelled: await Order.countDocuments({ status: 'cancelled' }),
    returned: await Order.countDocuments({ status: 'returned' }),
    revenue: await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  };

  return res.status(200).json({
    status: 1,
    message: 'Orders fetched successfully',
    data: orders,
    total,
    page,
    limit,
    stats: {
      total: stats.total,
      placed: stats.placed,
      confirmed: stats.confirmed,
      shipped: stats.shipped,
      delivered: stats.delivered,
      cancelled: stats.cancelled,
      returned: stats.returned,
      revenue: stats.revenue[0]?.total || 0,
    },
  });
});

// Get order by ID
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Order ID is required' });
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 0, message: 'Invalid Order ID format' });
  }

  const order = await Order.findById(id)
    .populate('user', 'first_name last_name email phone image')
    .populate('items.product', 'name images slug')
    .lean();

  if (!order) {
    return res.status(404).json({ status: 0, message: 'Order not found' });
  }

  return res.status(200).json({
    status: 1,
    data: order,
  });
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'Order ID is required' });
  }

  // Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 0, message: 'Invalid Order ID format' });
  }

  if (!status) {
    return res.status(400).json({ status: 0, message: 'Status is required' });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ status: 0, message: 'Order not found' });
  }

  // Valid status transitions
  const validTransitions: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled', 'returned'],
    delivered: ['returned', 'cancelled'],
    cancelled: [],
    returned: [],
  };

  // Check if transition is valid
  if (!validTransitions[order.status]?.includes(status)) {
    return res.status(400).json({
      status: 0,
      message: `Cannot change status from '${order.status}' to '${status}'`,
    });
  }

  // Update status
  order.status = status;

  // Add to timeline
  order.timeline = order.timeline || [];
  order.timeline.push({
    status,
    time: new Date(),
    note: note || '',
  });

  // If status = 'confirmed' and paymentMethod = 'cod': set paymentStatus = 'paid'
  if (status === 'confirmed' && order.paymentMethod === 'cod') {
    order.paymentStatus = 'paid';
  }

  // If status = 'cancelled' and paymentStatus = 'paid': set paymentStatus = 'refunded'
  if (status === 'cancelled' && order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';

    // Restore stock on cancel - log each item stock change
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product) {
          // Get current product to know previous stock
          const product = await Product.findById(item.product);
          if (product) {
            const previousStock = product.stock || 0;
            const newStock = previousStock + item.quantity;

            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });

            // Log stock history for cancellation
            await logStockChange({
              product: product._id,
              variantId: item.variantId || null,
              variantName: item.variantName || '',
              previousStock: previousStock,
              newStock: newStock,
              reason: 'order_cancelled',
              orderId: order._id,
            });
          }
        }
      }
    }
  }

  // If status = 'returned': process return - refund payment and restore stock
  if (status === 'returned') {
    // Only refund if payment was paid
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    // Restore stock on return - log each item stock change
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            const previousStock = product.stock || 0;
            const newStock = previousStock + item.quantity;

            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });

            // Log stock history for return
            await logStockChange({
              product: product._id,
              variantId: item.variantId || null,
              variantName: item.variantName || '',
              previousStock: previousStock,
              newStock: newStock,
              reason: 'order_returned',
              orderId: order._id,
            });
          }
        }
      }
    }
  }

  await order.save();

  // Send SMS notification for order status change
  const smsTemplate = SMS_TEMPLATES[status];
  if (smsTemplate) {
    try {
      // Get SMS settings
      const [smsEnabled, smsKey, smsProvider] = await Promise.all([
        Setting.findOne({ key: 'sms_order_notifications' }),
        Setting.findOne({ key: 'sms_api_key' }),
        Setting.findOne({ key: 'sms_provider' }),
      ]);

      if (smsEnabled?.value === 'true' && smsKey?.value) {
        // Get user info - either from populated user or shipping address
        const userPhone = (order.user as any)?.phone || order.shippingAddress?.phone;
        const userName = (order.user as any)?.first_name || order.shippingAddress?.fullName || 'Customer';

        if (userPhone) {
          const message = smsTemplate
            .replace('{name}', userName)
            .replace('{orderNum}', order.orderNumber);

          // Send SMS - non-blocking, don't fail the order update
          sendSMS({
            phone: userPhone,
            message,
            apiKey: smsKey.value,
            provider: (smsProvider?.value as any) || 'fast2sms',
          }).catch((e: any) => console.error('[SMS Error]', e.message));
        }
      }
    } catch (e: any) {
      // Non-blocking — never fail order update due to SMS error
      console.error('[SMS setup error]', e.message);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Order status updated successfully',
    data: order,
  });
});

// Get order stats for dashboard
export const getOrderStats = asyncHandler(async (_req: Request, res: Response) => {
  // Total orders
  const totalOrders = await Order.countDocuments();

  // Today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

  // Pending orders (placed or confirmed)
  const pendingOrders = await Order.countDocuments({
    status: { $in: ['placed', 'confirmed'] },
  });

  // Total revenue (paid orders)
  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  // Orders by status
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusBreakdown: Record<string, number> = {};
  statusCounts.forEach((item) => {
    statusBreakdown[item._id] = item.count;
  });

  return res.status(200).json({
    status: 1,
    data: {
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      statusBreakdown,
    },
  });
});

// Get orders by user ID (for admin user detail page)
export const getOrdersByUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ status: 0, message: 'User ID is required' });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { user: userId };

  // Get total count
  const total = await Order.countDocuments(query);

  // Get orders for this user
  const orders = await Order.find(query)
    .populate('user', 'first_name last_name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return res.status(200).json({
    status: 1,
    message: 'User orders fetched successfully',
    data: orders,
    total,
    page,
    limit,
  });
});
