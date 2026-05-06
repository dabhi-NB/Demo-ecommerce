import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import Order from '../models/orderModel';
import { getAllSettings } from '../utils/settings';
import { generateInvoiceHTML } from '../utils/pdfGenerator';

// ── GET ORDER INVOICE (HTML) ──
export const getOrderInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'first_name last_name email phone')
    .populate('items.product', 'name slug images')
    .lean();

  if (!order) {
    return res.status(404).json({ status: 0, message: 'Order not found' });
  }

  const settings = await getAllSettings();
  const html = generateInvoiceHTML(order, settings);

  const format = (req.query.format as string) || 'json';

  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }

  return res.status(200).json({
    status: 1,
    data: {
      orderNumber: (order as any).orderNumber,
      html,
    },
  });
});

// ── SEND INVOICE EMAIL ──
export const sendInvoiceEmail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'first_name last_name email phone')
    .populate('items.product', 'name slug images')
    .lean();

  if (!order) {
    return res.status(404).json({ status: 0, message: 'Order not found' });
  }

  const user = (order as any).user as any;
  if (!user?.email) {
    return res.status(400).json({ status: 0, message: 'User email not found' });
  }

  const settings = await getAllSettings();
  const html = generateInvoiceHTML(order, settings);

  const { GeneralHelper } = await import('../utils/general');
  const result = await GeneralHelper.sendEmailSMTP(
    user.email,
    `Invoice for Order #${(order as any).orderNumber}`,
    html
  );

  if (result.status === 0) {
    return res.status(500).json({ status: 0, message: result.message });
  }

  return res.status(200).json({
    status: 1,
    message: 'Invoice sent successfully',
  });
});
