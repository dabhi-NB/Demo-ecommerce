"use client"
import AccountLayout from '@/components/layout/account-layout/AccountLayout'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProductCard from '@/components/layout/shop-layout/ProductCard'
import ProductCardSkeleton from '@/components/layout/shop-layout/ProductCardSkeleton'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'

export default function WishlistPage() {
  const { isAuthenticated } = useAuth()
  const { wishlistProducts, isLoading, clearWishlist, totalWishlist } = useWishlist()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login?redirect=/shop/account/wishlist')
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  return (
    <AccountLayout title="My Wishlist" subtitle={`${totalWishlist} item${totalWishlist !== 1 ? 's' : ''} saved`}>

      {/* EMPTY STATE */}
      {!isLoading && wishlistProducts.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Heart size={36} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-heading)' }}>
            Nothing saved yet
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Tap the ♡ heart on any product to save it to your wishlist
          </p>
          <Link href="/shop/products">
            <button className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
              <ShoppingBag size={16} /> Explore Products
            </button>
          </Link>
        </div>
      )}

      {/* HEADER ROW (only if items exist) */}
      {(isLoading || wishlistProducts.length > 0) && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${totalWishlist} item${totalWishlist !== 1 ? 's' : ''}`}
          </p>
          {wishlistProducts.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Clear all wishlist items?')) clearWishlist() }}
              className="text-xs text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/8 transition-all font-semibold"
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* PRODUCT GRID — Flipkart/Myntra wishlist style */}
      {(isLoading || wishlistProducts.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : wishlistProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))
          }
        </div>
      )}

    </AccountLayout>
  )
}
