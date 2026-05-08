import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler";
import Order from "../models/orderModel";
import Product from "../models/productModel";
import Coupon from "../models/couponModel";
import User from "../models/userModel";

// FUNCTION 1: placeOrder - POST /orders
export const placeOrder = asyncHandler(async (req: any, res: any) => {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body
    const userId = req.user_id

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' })
    }
    if (!shippingAddress) {
        return res.status(400).json({ success: false, message: 'Shipping address is required' })
    }
    if (!paymentMethod || !['cod', 'online'].includes(paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Valid payment method is required' })
    }

    // Validate shippingAddress fields
    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        return res.status(400).json({ success: false, message: 'Complete shipping address is required' })
    }

    // Build order items with SERVER prices (never trust client prices)
    const orderItems = []
    let subtotal = 0

    for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid item in cart' })
        }

        const product: any = await Product.findById(item.productId)

        if (!product || !product.isActive) {
            return res.status(400).json({
                success: false,
                message: `Product is no longer available`,
            })
        }

        let unitPrice = product.salePrice ?? product.price
        let itemImage = product.images?.[0] || ''
        let variantCombination: any[] = []
        let variantSku = product.sku

        // Handle variant if provided
        if (item.variantId) {
            const variant = product.variants?.id ? product.variants.id(item.variantId) : product.variants?.find((v: any) => v._id?.toString() === item.variantId)

            if (!variant) {
                return res.status(400).json({
                    success: false,
                    message: `Variant not found for ${product.name}`,
                })
            }

            if (!variant.isActive) {
                return res.status(400).json({
                    success: false,
                    message: `This variant is no longer available`,
                })
            }

            if (variant.stock < item.quantity) {
                const variantName = variant.combination?.map((c: any) => c.value).join('/') || ''
                return res.status(400).json({
                    success: false,
                    message: `Only ${variant.stock} unit(s) of "${product.name}" ${variantName ? `(${variantName})` : ''} available`,
                })
            }

            unitPrice = variant.salePrice ?? variant.price ?? unitPrice
            itemImage = variant.images?.[0] || itemImage
            variantCombination = variant.combination || []
            variantSku = variant.sku || product.sku
        } else {
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} unit(s) of "${product.name}" available`,
                })
            }
        }

        subtotal += unitPrice * item.quantity

        orderItems.push({
            product: product._id,
            variantId: item.variantId || null,
            variantCombination: variantCombination,
            name: product.name,
            slug: product.slug,
            image: itemImage,
            price: unitPrice,
            quantity: item.quantity,
            variantSku: variantSku,
        })
    }

    // Shipping charge — read from admin settings (fallback to defaults)
    const { getSettingValue } = await import('../utils/settingsHelper');
    const freeAbove = parseFloat(await getSettingValue('shipping.free_above', '999'));
    const shippingRate = parseFloat(await getSettingValue('shipping.charge', '99'));
    const shippingCharge = subtotal >= freeAbove ? 0 : shippingRate;

    // Coupon validation
    let discount = 0
    let couponData: { code: string; discount: number } | undefined

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const now = new Date();
        const coupon = await Coupon.findOne({
            code: couponCode.trim().toUpperCase(),
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gt: now },
        })

        const usageLimitOk = coupon && (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit);
        if (coupon && usageLimitOk && subtotal >= coupon.minOrderAmount) {
            if (coupon.discountType === 'percentage') {
                const raw = (coupon.discountValue / 100) * subtotal
                discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
            } else {
                discount = coupon.discountValue
            }
            discount = Math.round(discount)
            couponData = { code: coupon.code, discount }

            // Increment coupon usage
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
        }
    }

    const totalAmount = subtotal + shippingCharge - discount

    // Estimated delivery: 5 days from now
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5)

    // Create order
    const order = new Order({
        user: userId,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        subtotal,
        tax: 0,
        shippingCharge,
        discount,
        totalAmount,
        coupon: couponData,
        estimatedDelivery,
    })

    await order.save()

    // Decrement stock for each product (handle variants)
    for (const item of items) {
        if (item.variantId) {
            // Decrement variant stock
            await Product.findOneAndUpdate(
                { _id: item.productId, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': -item.quantity } }
            )
        } else {
            // Decrement base product stock
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity },
            })
        }
    }

    return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order,
    })
})

// FUNCTION 2: getMyOrders - GET /orders/my
export const getMyOrders = asyncHandler(async (req: any, res: any) => {
    const userId = req.user_id
    const { status, page = '1' } = req.query

    const filter: any = { user: userId }

    if (status && status !== 'all') {
        if (status === 'active') {
            filter.status = { $in: ['placed', 'confirmed', 'shipped'] }
        } else {
            const validStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned']
            if (validStatuses.includes(status as string)) {
                filter.status = status
            }
        }
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = 10
    const skip = (pageNum - 1) * limitNum

    const [orders, total] = await Promise.all([
        Order.find(filter)
            // FIX 7: Use populate with select to avoid chain issues
            .populate({ path: 'items.product', select: 'name images slug brand' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Order.countDocuments(filter),
    ])

    return res.status(200).json({
        success: true,
        data: {
            orders,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        },
    })
})

// FUNCTION 3: getOrderById - GET /orders/:id
export const getOrderById = asyncHandler(async (req: any, res: any) => {
    // FIX 1: ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format' })
    }

    const { id } = req.params
    const userId = req.user_id

    if (!id || id.length !== 24) {
        return res.status(400).json({ success: false, message: 'Invalid order ID' })
    }

    const order = await Order.findOne({ _id: id, user: userId })
        // FIX 7: Use populate with select to avoid chain issues
        .populate({ path: 'items.product', select: 'name images slug brand sku' })

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
    }

    return res.status(200).json({ success: true, data: order })
})

// FUNCTION 4: cancelOrder - POST /orders/:id/cancel
export const cancelOrder = asyncHandler(async (req: any, res: any) => {
    // FIX 1: ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format' })
    }

    const { id } = req.params
    const { reason } = req.body
    const userId = req.user_id

    const order = await Order.findOne({ _id: id, user: userId })

    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' })
    }

    const cancellableStatuses = ['placed', 'confirmed']
    if (!cancellableStatuses.includes(order.status)) {
        return res.status(400).json({
            success: false,
            message: `Order cannot be cancelled. Current status: ${order.status}`,
        })
    }

    order.status = 'cancelled'
    order.cancellationReason = reason?.trim() || 'Cancelled by customer'
    order.timeline.push({
        status: 'cancelled',
        time: new Date(),
        note: reason?.trim() || 'Cancelled by customer',
    })

    await order.save()

    // Restore stock (handle variants)
    for (const item of order.items) {
        if (item.variantId) {
            // Restore variant stock
            await Product.findOneAndUpdate(
                { _id: item.product, 'variants._id': item.variantId },
                { $inc: { 'variants.$.stock': item.quantity } }
            )
        } else {
            // Restore base product stock
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            })
        }
    }

    return res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: order,
    })
})

// FUNCTION 5: validateCoupon — removed from here, lives in couponController.ts
// Keeping this stub so routes don't break if imported from here
export { validateCoupon } from './couponController';

// FUNCTION 6: validateCart - POST /cart/validate (Public - no auth required)
export const validateCart = asyncHandler(async (req: any, res: any) => {
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Items array is required' })
    }

    const issues: Array<{ productId: string; issue: string; availableStock?: number }> = []
    const validatedItems: Array<{
        productId: string
        variantId?: string
        name: string
        price: number
        image: string
        stock: number
    }> = []

    for (const item of items) {
        if (!item.productId) continue

        const product: any = await Product.findById(item.productId).select('name price salePrice images stock isActive variants')

        if (!product || !product.isActive) {
            issues.push({ productId: item.productId, issue: 'Product is no longer available' })
            continue
        }

        let stock = product.stock
        let price = product.salePrice ?? product.price
        let image = product.images?.[0] || ''

        // Handle variant if provided
        if (item.variantId) {
            const variant = product.variants?.id ? product.variants.id(item.variantId) : product.variants?.find((v: any) => v._id?.toString() === item.variantId)

            if (!variant || !variant.isActive) {
                issues.push({ productId: item.productId, issue: 'Variant is no longer available' })
                continue
            }

            stock = variant.stock
            price = variant.salePrice ?? variant.price ?? price
            image = variant.images?.[0] || image
        }

        if (stock === 0) {
            issues.push({ productId: item.productId, issue: 'Out of stock', availableStock: 0 })
            continue
        }

        if (item.quantity > stock) {
            issues.push({
                productId: item.productId,
                issue: `Only ${stock} unit(s) available`,
                availableStock: stock,
            })
        }

        validatedItems.push({
            productId: item.productId,
            variantId: item.variantId,
            name: product.name,
            price: price,
            image: image,
            stock: stock,
        })
    }

    return res.status(200).json({
        success: true,
        data: {
            valid: issues.length === 0,
            issues,
            items: validatedItems,
        },
    })
})