import api from './api'

export interface ShippingAddress {
    _id?: string
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    isDefault?: boolean
}

export interface OrderItemVariant {
    color?: string;
    storage?: string;
    combination?: Array<{ name: string; value: string }>;
}

export interface OrderItem {
    product: { _id: string; name: string; images: string[]; slug: string; brand?: string }
    name: string
    image: string
    price: number
    quantity: number
    variant?: OrderItemVariant
    variantId?: string | null
}

export interface OrderTimeline {
    status: string
    time: string
    note?: string
}

export interface IOrder {
    _id: string
    orderNumber: string
    user: string
    items: OrderItem[]
    shippingAddress: ShippingAddress
    paymentMethod: 'cod' | 'online'
    paymentStatus: 'pending' | 'paid' | 'failed'
    status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
    subtotal: number
    tax: number
    shippingCharge: number
    discount: number
    totalAmount: number
    coupon?: { code: string; discount: number }
    cancellationReason?: string
    timeline: OrderTimeline[]
    estimatedDelivery?: string
    createdAt: string
}

export interface PlaceOrderPayload {
    items: Array<{ 
        productId: string; 
        quantity: number; 
        variantId?: string | null;
        variant?: OrderItemVariant;
    }>
    shippingAddress: ShippingAddress
    paymentMethod: 'cod' | 'online'
    gatewayId?: string | null
    couponCode?: string
}

export const placeOrder = async (payload: PlaceOrderPayload): Promise<IOrder> => {
    const res = await api.post('/orders', payload)
    return res.data.data
}

export const getMyOrders = async (page = 1, status?: string): Promise<{
    orders: IOrder[]; total: number; page: number; totalPages: number
}> => {
    const params = new URLSearchParams()
    params.append('page', String(page))
    if (status) params.append('status', status)
    const res = await api.get(`/orders/my?${params.toString()}`)
    return res.data.data
}

export const getOrderById = async (id: string): Promise<IOrder> => {
    const res = await api.get(`/orders/${id}`)
    return res.data.data
}

export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
    await api.post(`/orders/${id}/cancel`, { reason })
}

export const validateCoupon = async (code: string, cartTotal: number): Promise<{
    valid: boolean; discount: number; message: string
}> => {
    const res = await api.post('/coupons/validate', { code, cartTotal })
    return res.data.data
}

export const getAddresses = async (): Promise<ShippingAddress[]> => {
    const res = await api.get('/account/addresses')
    return res.data.data
}

export const addAddress = async (address: ShippingAddress): Promise<ShippingAddress[]> => {
    const res = await api.post('/account/addresses', address)
    return res.data.data
}

export const deleteAddress = async (addressId: string): Promise<void> => {
    await api.delete(`/account/addresses/${addressId}`)
}

export const setDefaultAddress = async (addressId: string): Promise<void> => {
    await api.patch(`/account/addresses/${addressId}/default`)
}
