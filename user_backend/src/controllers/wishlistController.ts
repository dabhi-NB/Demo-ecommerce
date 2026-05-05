import { Response } from 'express'
import { asyncHandler } from '../middlewares/asyncHandler'
import Wishlist from '../models/wishlistModel'
import Product from '../models/productModel'

// GET /wishlist
export const getWishlist = asyncHandler(async (req: any, res: Response) => {
    let wishlist = await Wishlist.findOne({ user: req.user_id })
        .populate('products', 'name slug price salePrice images brand ratings stock isActive')

    if (!wishlist) {
        wishlist = await Wishlist.create({ user: req.user_id, products: [] })
    }

    // Filter out inactive/deleted products
    const activeProducts = (wishlist.products as any[]).filter((p: any) => p && p.isActive !== false)

    return res.status(200).json({ success: true, data: activeProducts })
})

// POST /wishlist/toggle — add or remove (no duplicates)
export const toggleWishlist = asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.body

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' })

    const product = await Product.findById(productId).select('_id isActive')
    if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: 'Product not found' })
    }

    let wishlist = await Wishlist.findOne({ user: req.user_id })
    if (!wishlist) wishlist = new Wishlist({ user: req.user_id, products: [] })

    const alreadyIn = wishlist.products.some(
        (id: any) => id.toString() === productId
    )

    if (alreadyIn) {
        // Remove
        wishlist.products = wishlist.products.filter(
            (id: any) => id.toString() !== productId
        ) as any
    } else {
        // Add — $addToSet equivalent (no duplicates)
        wishlist.products.push(productId as any)
    }

    await wishlist.save()

    return res.status(200).json({
        success: true,
        data: {
            inWishlist: !alreadyIn,
            productId,
            message: alreadyIn ? 'Removed from wishlist' : 'Added to wishlist',
        },
    })
})

// DELETE /wishlist — clear all
export const clearWishlist = asyncHandler(async (req: any, res: Response) => {
    await Wishlist.findOneAndUpdate(
        { user: req.user_id },
        { products: [] },
        { upsert: true }
    )
    return res.status(200).json({ success: true, message: 'Wishlist cleared' })
})
