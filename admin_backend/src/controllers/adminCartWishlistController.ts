import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import Cart from '../models/cartModel';
import Wishlist from '../models/wishlistModel';

// GET /admin/users/:userId/cart
export const getUserCart = asyncHandler(async (req: any, res: Response) => {
  const cart = await Cart.findOne({ user: req.params.userId })
    .populate('items.product', 'name images price salePrice slug stock isActive');

  return res.status(200).json({ 
    success: true, 
    data: cart || { items: [] } 
  });
});

// GET /admin/users/:userId/wishlist
export const getUserWishlist = asyncHandler(async (req: any, res: Response) => {
  const wishlist = await Wishlist.findOne({ user: req.params.userId })
    .populate('products', 'name images price salePrice slug stock isActive');

  return res.status(200).json({ 
    success: true, 
    data: wishlist?.products || [] 
  });
});

// DELETE /admin/users/:userId/cart/items/:productId — admin can remove item from cart
export const removeFromUserCart = asyncHandler(async (req: any, res: Response) => {
  const cart = await Cart.findOne({ user: req.params.userId });
  
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  cart.items = cart.items.filter((i: any) => i.product.toString() !== req.params.productId) as any;
  await cart.save();

  return res.status(200).json({ success: true, message: 'Item removed' });
});

// DELETE /admin/users/:userId/wishlist/:productId — admin can remove from wishlist
export const removeFromUserWishlist = asyncHandler(async (req: any, res: Response) => {
  await Wishlist.findOneAndUpdate(
    { user: req.params.userId },
    { $pull: { products: req.params.productId } }
  );

  return res.status(200).json({ success: true, message: 'Removed from wishlist' });
});
