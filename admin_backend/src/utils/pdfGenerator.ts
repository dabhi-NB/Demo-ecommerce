import { IOrder } from '../models/orderModel';

/**
 * Generates a professional HTML invoice for an order
 * Can be rendered as HTML or converted to PDF
 */
export function generateInvoiceHTML(order: any, settings: Record<string, string>): string {
  const appName = settings['setting.app_name'] || 'Demo Store';
  const appEmail = settings['setting.admin_email'] || '';
  const currency = settings['payment.payment_currency'] || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${Number(amount).toFixed(2)}`;

  const itemsHTML = (order.items || [])
    .map(
      (item: any, index: number) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-size: 14px;">${index + 1}</td>
      <td style="padding: 12px 8px; font-size: 14px;">
        ${item.name || 'Product'}
        ${item.variantName ? `<br><small style="color:#888;">${item.variantName}</small>` : ''}
      </td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: right; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `
    )
    .join('');

  const shipping = order.shippingAddress;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; background: #f8f9fa; }
    .invoice-container { max-width: 800px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .invoice-header { background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .company-name { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .company-email { font-size: 13px; opacity: 0.7; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 32px; font-weight: 800; opacity: 0.9; letter-spacing: 2px; }
    .invoice-number { font-size: 14px; opacity: 0.7; margin-top: 4px; }
    .invoice-body { padding: 40px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
    .info-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 12px; }
    .info-section p { font-size: 14px; line-height: 1.6; color: #444; }
    .info-section strong { color: #222; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-refunded { background: #fee2e2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8f9fa; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #e5e7eb; }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(3), td:nth-child(3) { text-align: center; }
    .totals-section { border-top: 2px solid #e5e7eb; padding-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #1a1a2e; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 16px; }
    .discount { color: #059669; }
    .footer { background: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #888; line-height: 1.8; }
    .footer strong { color: #444; }
  </style>
</head>
<body>
  <div class="invoice-container">

    <!-- Header -->
    <div class="invoice-header">
      <div>
        <div class="company-name">${appName}</div>
        ${appEmail ? `<div class="company-email">${appEmail}</div>` : ''}
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <div class="invoice-number">#${order.orderNumber}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-section">
          <h4>Bill To</h4>
          <p>
            <strong>${shipping?.fullName || 'Customer'}</strong><br>
            ${shipping?.addressLine1 || ''}<br>
            ${shipping?.addressLine2 ? shipping.addressLine2 + '<br>' : ''}
            ${shipping?.city || ''}, ${shipping?.state || ''} ${shipping?.pincode || ''}<br>
            ${shipping?.country || 'India'}<br>
            📱 ${shipping?.phone || ''}
          </p>
        </div>
        <div class="info-section">
          <h4>Invoice Details</h4>
          <p>
            <strong>Invoice Date:</strong> ${formatDate(order.createdAt)}<br>
            <strong>Order Number:</strong> ${order.orderNumber}<br>
            <strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}<br>
            <strong>Payment Status:</strong>
            <span class="status-badge ${order.paymentStatus === 'paid' ? 'status-paid' : order.paymentStatus === 'refunded' ? 'status-refunded' : 'status-pending'}">
              ${order.paymentStatus?.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead>
          <tr>
            <th style="width: 40px">#</th>
            <th>Item Description</th>
            <th style="width: 80px">Qty</th>
            <th style="width: 100px">Unit Price</th>
            <th style="width: 110px">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${(order.deliveryCharge > 0) ? `
        <div class="total-row">
          <span>Delivery Charge</span>
          <span>${formatCurrency(order.deliveryCharge)}</span>
        </div>` : ''}
        ${(order.couponDiscount > 0) ? `
        <div class="total-row discount">
          <span>Coupon Discount ${order.couponCode ? `(${order.couponCode})` : ''}</span>
          <span>- ${formatCurrency(order.couponDiscount)}</span>
        </div>` : ''}
        <div class="total-row final">
          <span>Total Amount</span>
          <span>${formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>Thank you for your order!</strong><br>
        If you have any questions about this invoice, please contact us at <strong>${appEmail}</strong><br>
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
