import api from './api'
import type { IProduct } from './product.service'

export const getWishlistFromDB = async (): Promise<IProduct[]> => {
    const res = await api.get('/wishlist')
    return res.data.data
}

export const toggleWishlistDB = async (productId: string): Promise<{
    inWishlist: boolean
    productId: string
    message: string
}> => {
    const res = await api.post('/wishlist/toggle', { productId })
    return res.data.data
}

export const clearWishlistDB = async (): Promise<void> => {
    await api.delete('/wishlist')
}
