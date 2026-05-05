import mongoose from 'mongoose';

// Schema definition
const StockHistorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: String, default: null },
    variantName: { type: String, default: '' },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    change: { type: Number, required: true }, // newStock - previousStock (can be negative)
    reason: {
      type: String,
      enum: ['admin_update', 'order_placed', 'order_cancelled', 'order_returned', 'bulk_update'],
      required: true
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  {
    collection: 'stock_history',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// Index for efficient queries
StockHistorySchema.index({ product: 1, createdAt: -1 });
StockHistorySchema.index({ orderId: 1 });

const StockHistoryModel =
  mongoose.models.StockHistory || mongoose.model('StockHistory', StockHistorySchema);

export default StockHistoryModel;

// Function to log stock change
export async function logStockChange(params: {
  product: mongoose.Types.ObjectId;
  variantId?: string | null;
  variantName?: string;
  previousStock: number;
  newStock: number;
  reason: 'admin_update' | 'order_placed' | 'order_cancelled' | 'order_returned' | 'bulk_update';
  adminId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
}) {
  const { product, variantId = null, variantName = '', previousStock, newStock, reason, adminId = null, orderId = null } = params;

  const change = newStock - previousStock;

  await StockHistoryModel.create({
    product,
    variantId,
    variantName,
    previousStock,
    newStock,
    change,
    reason,
    adminId,
    orderId,
  });
}

