import api from './api'

export interface CartItem {
  _id: string
  product: string
  productId: string
  quantity: number
  variant?: { color?: string; storage?: string }
  variantId?: string | null
  variantCombination?: Array<{ name: string; value: string }> | null
  price: number
  name: string
  image: string
  slug: string
  maxStock: number
}

export interface ICart {
  _id: string
  user: string
  items: CartItem[]
}

const normalize = (cart: ICart): ICart => ({
  ...cart,
  items: cart.items.map(item => ({
    ...item,
    productId: item.product || item.productId,
  })),
})

export const getCartFromDB = async (): Promise<ICart> => {
  const res = await api.get('/cart')
  return normalize(res.data.data)
}

export const syncCartToDB = async (items: CartItem[]): Promise<ICart> => {
  const res = await api.post('/cart/sync', { items })
  return normalize(res.data.data)
}

export const addItemToCartDB = async (
  productId: string,
  quantity: number,
  variantId?: string | null,
  variantCombination?: Array<{ name: string; value: string }>
): Promise<ICart> => {
  const res = await api.post('/cart/items', { productId, quantity, variantId, variantCombination })
  return normalize(res.data.data)
}

export const updateCartItemDB = async (productId: string, quantity: number): Promise<ICart> => {
  const res = await api.put(`/cart/items/${productId}`, { quantity })
  return normalize(res.data.data)
}

export const removeCartItemDB = async (productId: string): Promise<ICart> => {
  const res = await api.delete(`/cart/items/${productId}`)
  return normalize(res.data.data)
}

export const clearCartDB = async (): Promise<void> => {
  await api.delete('/cart')
}
