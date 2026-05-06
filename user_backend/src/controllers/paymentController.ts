import { Request, Response } from 'express'
import { asyncHandler } from '../middlewares/asyncHandler'
import Order from '../models/orderModel'
import { getSettingValue } from '../utils/settingsHelper'
import crypto from 'crypto'

// ── Razorpay order initiate ──
export const initiatePayment = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.body

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID required' })
  }

  const order: any = await Order.findOne({ _id: orderId, user: req.user_id })
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' })
  }

  const razorpayKeyId = await getSettingValue('payment.razorpay_key_id')
  const razorpayKeySecret = await getSettingValue('payment.razorpay_key_secret')

  if (!razorpayKeyId || !razorpayKeySecret) {
    return res.status(500).json({ success: false, message: 'Payment gateway not configured' })
  }

  try {
    const Razorpay = require('razorpay')
    const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: `order_${order._id}`,
      notes: { orderId: order._id.toString(), userId: req.user_id },
    })

    // Save razorpay order id
    order.paymentGatewayOrderId = razorpayOrder.id
    await order.save()

    return res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId,
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    })
  } catch (err: any) {
    console.error('Razorpay error:', err)
    return res.status(500).json({ success: false, message: 'Payment initiation failed' })
  }
})

// ── Verify payment after success ──
export const verifyPayment = asyncHandler(async (req: any, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    return res.status(400).json({ success: false, message: 'Missing payment verification data' })
  }

  const order: any = await Order.findOne({ _id: orderId, user: req.user_id })
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  const razorpayKeySecret = await getSettingValue('payment.razorpay_key_secret')

  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret || '')
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    order.paymentStatus = 'failed'
    await order.save()
    return res.status(400).json({ success: false, message: 'Payment verification failed' })
  }

  // Mark as paid
  order.paymentStatus = 'paid'
  order.paymentId = razorpayPaymentId
  order.status = 'confirmed'
  order.timeline = order.timeline || []
  order.timeline.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received' })
  await order.save()

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: { orderId: order._id, orderNumber: order.orderNumber },
  })
})

// ── Razorpay webhook handler ──
export const paymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const razorpayKeySecret = await getSettingValue('payment.razorpay_key_secret')
  const webhookSecret = await getSettingValue('payment.razorpay_webhook_secret')

  // Verify webhook signature
  const shasum = crypto.createHmac('sha256', webhookSecret || razorpayKeySecret || '')
  shasum.update(JSON.stringify(req.body))
  const digest = shasum.digest('hex')

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
  }

  const event = req.body.event
  const paymentEntity = req.body.payload?.payment?.entity

  if (event === 'payment.captured' && paymentEntity) {
    const notes = paymentEntity.notes || {}
    const orderId = notes.orderId

    if (orderId) {
      const order: any = await Order.findById(orderId)
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid'
        order.paymentId = paymentEntity.id
        order.status = 'confirmed'
        order.timeline = order.timeline || []
        order.timeline.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment captured via webhook' })
        await order.save()
      }
    }
  }

  if (event === 'payment.failed' && paymentEntity) {
    const notes = paymentEntity.notes || {}
    const orderId = notes.orderId
    if (orderId) {
      const order: any = await Order.findById(orderId)
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed'
        await order.save()
      }
    }
  }

  return res.status(200).json({ success: true })
})

// ── Get payment status ──
export const getPaymentStatus = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.params

  const order: any = await Order.findOne({ _id: orderId, user: req.user_id })
    .select('paymentStatus paymentMethod paymentId totalAmount orderNumber status')
    .lean()

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  return res.status(200).json({ success: true, data: order })
})
