import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { asyncHandler } from '../middlewares/asyncHandler'
import Cart from '../models/cartModel'
import Product from '../models/productModel'

// GET /cart
export const getCart = asyncHandler(async (req: any, res: Response) => {
    let cart = await Cart.findOne({ user: req.user_id })
    if (!cart) {
        cart = await Cart.create({ user: req.user_id, items: [] })
    }
    return res.status(200).json({ success: true, data: cart })
})

// POST /cart/sync
// Called on login — merges localStorage cart with DB cart
export const syncCart = asyncHandler(async (req: any, res: Response) => {
    const { items } = req.body  // items from localStorage
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Items array required' })
    }

    let cart = await Cart.findOne({ user: req.user_id })
    if (!cart) cart = new Cart({ user: req.user_id, items: [] })

    for (const item of items) {
        if (!item.productId || !item.quantity) continue

        // FIX 1: Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(item.productId)) continue

        // Verify product still exists and is active
        const product: any = await Product.findById(item.productId).select('name price salePrice images stock slug isActive variants')
        if (!product || !product.isActive) continue

        // Determine price and stock (variant or base product)
        let price = product.salePrice ?? product.price
        let maxStock = product.stock
        let variantCombination: any[] = []
        let variantSku = product.sku
        let variantId = null
        let image = product.images?.[0] || ''

        if (item.variantId) {
            const variant = product.variants?.id ? product.variants.id(item.variantId) : product.variants?.find((v: any) => v._id?.toString() === item.variantId)
            if (variant && variant.isActive && variant.stock > 0) {
                price = variant.salePrice ?? variant.price ?? price
                maxStock = variant.stock
                variantCombination = variant.combination || []
                variantSku = variant.sku || product.sku
                variantId = variant._id
                image = variant.images?.[0] || image
            } else {
                continue // variant not available
            }
        } else if (product.stock === 0) {
            continue // product out of stock
        }

        // Find existing item (same product AND same variant)
        const existingIndex = cart.items.findIndex(
            (ci: any) => {
                if (ci.product.toString() !== item.productId) return false
                if (!item.variantId && !ci.variantId) return true
                if (item.variantId && ci.variantId && ci.variantId.toString() === item.variantId) return true
                return false
            }
        )

        if (existingIndex >= 0) {
            // Merge: take higher quantity, cap at stock
            const merged = Math.min(cart.items[existingIndex].quantity + item.quantity, maxStock)
            cart.items[existingIndex].quantity = merged
            cart.items[existingIndex].maxStock = maxStock
            cart.items[existingIndex].price = price
        } else {
            // FIX 6: Max 50 items limit
            if (cart.items.length >= 50) continue

            cart.items.push({
                product: item.productId,
                variantId: variantId,
                variantCombination: variantCombination,
                quantity: Math.min(item.quantity, maxStock),
                price: price,
                name: product.name,
                image: image,
                slug: product.slug,
                maxStock: maxStock,
                variantSku: variantSku,
            } as any)
        }
    }

    await cart.save()
    return res.status(200).json({ success: true, data: cart })
})

// POST /cart/items — add item
export const addToCart = asyncHandler(async (req: any, res: Response) => {
    const { productId, quantity = 1, variantId } = req.body

    if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' })

    // FIX 1: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID format' })
    }

    const product: any = await Product.findById(productId).select('name price salePrice images stock slug isActive variants sku')
    if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: 'Product not available' })
    }

    let price = product.salePrice ?? product.price
    let maxStock = product.stock
    let variantCombination: any[] = []
    let variantSku = product.sku
    let variantImage = product.images?.[0] || ''

    // Handle variant if provided
    if (variantId) {
        const variant = product.variants?.id ? product.variants.id(variantId) : product.variants?.find((v: any) => v._id?.toString() === variantId)

        if (!variant || !variant.isActive) {
            return res.status(400).json({ success: false, message: 'Variant not available' })
        }
        if (variant.stock === 0) {
            return res.status(400).json({ success: false, message: 'This variant is out of stock' })
        }

        price = variant.salePrice ?? variant.price ?? price
        maxStock = variant.stock
        variantCombination = variant.combination || []
        variantSku = variant.sku || product.sku
        variantImage = variant.images?.[0] || variantImage
    } else {
        if (product.stock === 0) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' })
        }
    }

    let cart = await Cart.findOne({ user: req.user_id })
    if (!cart) cart = new Cart({ user: req.user_id, items: [] })

    // Find existing item (same product AND same variant)
    const existingIndex = cart.items.findIndex((ci: any) => {
        if (ci.product.toString() !== productId) return false
        if (!variantId && !ci.variantId) return true
        if (variantId && ci.variantId && ci.variantId.toString() === variantId.toString()) return true
        return false
    })

    if (existingIndex >= 0) {
        const newQty = cart.items[existingIndex].quantity + quantity
        cart.items[existingIndex].quantity = Math.min(newQty, maxStock)
        cart.items[existingIndex].maxStock = maxStock
        cart.items[existingIndex].price = price
    } else {
        // FIX 6: Max 50 items limit
        if (cart.items.length >= 50) {
            return res.status(400).json({ success: false, message: 'Cart is full (max 50 items)' })
        }

        cart.items.push({
            product: productId,
            variantId: variantId || null,
            variantCombination: variantCombination || [],
            quantity: Math.min(quantity, maxStock),
            price: price,
            name: product.name,
            image: variantImage,
            slug: product.slug,
            maxStock: maxStock,
            variantSku: variantSku,
        } as any)
    }

    await cart.save()
    return res.status(200).json({ success: true, message: 'Added to cart', data: cart })
})

// PUT /cart/items/:productId — update quantity
export const updateCartItem = asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.params
const { quantity, variantId: bodyVariantId } = req.body
  const variantId = bodyVariantId || (req.query as any).variantId

    // FIX 1: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID format' })
    }

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Valid quantity required' })
    }

    const cart = await Cart.findOne({ user: req.user_id })
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' })

    // Find item with same product AND variant
    const itemIndex = cart.items.findIndex((ci: any) => {
        if (ci.product.toString() !== productId) return false
        if (!variantId && !ci.variantId) return true
        if (variantId && ci.variantId && ci.variantId.toString() === variantId.toString()) return true
        return false
    })

    if (itemIndex < 0) return res.status(404).json({ success: false, message: 'Item not in cart' })

    // Get current max stock from product/variant
    const product: any = await Product.findById(productId).select('stock variants')
    if (product) {
        let maxStock = product.stock
        if (cart.items[itemIndex].variantId) {
            const variant = product.variants?.id ? product.variants.id(cart.items[itemIndex].variantId) : product.variants?.find((v: any) => v._id?.toString() === cart.items[itemIndex].variantId?.toString())
            if (variant) maxStock = variant.stock
        }
        cart.items[itemIndex].quantity = Math.min(quantity, maxStock)
        cart.items[itemIndex].maxStock = maxStock
    } else {
        cart.items[itemIndex].quantity = quantity
    }

    await cart.save()
    return res.status(200).json({ success: true, data: cart })
})

// DELETE /cart/items/:productId — remove item
export const removeFromCart = asyncHandler(async (req: any, res: Response) => {
    const { productId } = req.params
    const { variantId } = req.query as { variantId?: string }

    // FIX 1: Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID format' })
    }

    const cart = await Cart.findOne({ user: req.user_id })
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' })

    cart.items = cart.items.filter((ci: any) => {
        if (ci.product.toString() !== productId) return true // keep different products
        if (!variantId && !ci.variantId) return false // remove base product item
        if (variantId && ci.variantId?.toString() === variantId) return false // remove specific variant
        return true // keep other variants of same product
    }) as any

    await cart.save()
    return res.status(200).json({ success: true, message: 'Removed from cart', data: cart })
})

// DELETE /cart — clear entire cart
export const clearCart = asyncHandler(async (req: any, res: Response) => {
    const cart = await Cart.findOne({ user: req.user_id })
    if (cart) {
        cart.items = [] as any
        await cart.save()
    }
    return res.status(200).json({ success: true, message: 'Cart cleared' })
})
