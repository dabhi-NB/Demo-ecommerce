"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getCartFromDB,
  syncCartToDB,
  addItemToCartDB,
  updateCartItemDB,
  removeCartItemDB,
  clearCartDB,
  CartItem,
} from "@/services/cart.service";

export type { CartItem };

interface AddToCartPayload {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
  slug: string;
  variantId?: string | null;
  variant?: { combination: Array<{ name: string; value: string }> };
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setIsDrawerOpen: (open: boolean) => void;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

const LOCAL_CART_KEY = "rv_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const syncedRef = useRef(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const saveLocal = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems));
    } catch {}
  };

  const loadLocal = (): CartItem[] => {
    try {
      const raw = localStorage.getItem(LOCAL_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    console.log("[CART] 🔄 useEffect auth change", {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.user_id,
    });
    if (isAuthenticated && user) {
      syncedRef.current = false;
      console.log("[CART] 🚀 Calling initCart()");
      initCart();
    } else {
      console.log("[CART] 📦 Loading local cart");
      const local = loadLocal();
      setItems(local);
      syncedRef.current = false;
    }
  }, [isAuthenticated, user?.user_id]);

  const initCart = async () => {
    console.log("[CART] 🔄 initCart START");
    setIsLoading(true);
    try {
      const localItems = loadLocal();
      console.log("[CART] 📦 Local items found:", localItems.length);

      if (localItems.length > 0 && !syncedRef.current) {
        console.log("[CART] 🔄 Syncing local to DB...");
        syncedRef.current = true;
        const synced = await syncCartToDB(localItems);
        console.log("[CART] ✅ DB sync complete:", synced.items.length);
        setItems(synced.items);
        saveLocal(synced.items);
        localStorage.removeItem(LOCAL_CART_KEY);
      } else {
        console.log("[CART] 🔄 Loading from DB...");
        const dbCart = await getCartFromDB();
        console.log("[CART] ✅ DB cart loaded:", dbCart.items.length);
        setItems(dbCart.items);
        saveLocal(dbCart.items);
      }
    } catch (error) {
      console.error("[CART] ❌ initCart ERROR:", error);
      const local = loadLocal();
      setItems(local);
    } finally {
      console.log("[CART] ✅ initCart COMPLETE, isLoading=false");
      setIsLoading(false);
    }
  };

  const addToCart = useCallback(
    async (payload: AddToCartPayload) => {
      if (isAuthenticated) {
        try {
          const updated = await addItemToCartDB(
            payload.productId,
            payload.quantity,
            payload.variantId || null,
            payload.variant?.combination || [],
          );
          setItems(updated.items);
          saveLocal(updated.items);
        } catch (e) {
          console.error("addToCart DB error:", e);
          try {
            const dbCart = await getCartFromDB();
            setItems(dbCart.items);
            saveLocal(dbCart.items);
          } catch {}
        }
      } else {
        setItems((prev) => {
          const existing = prev.findIndex(
            (i) =>
              i.productId === payload.productId &&
              (payload.variantId
                ? i.variantId === payload.variantId
                : !i.variantId),
          );
          let updated: CartItem[];
          if (existing >= 0) {
            updated = prev.map((item, idx) =>
              idx === existing
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + payload.quantity,
                      item.maxStock,
                    ),
                  }
                : item,
            );
          } else {
            const newItem: CartItem = {
              _id: payload.productId + (payload.variantId || ""),
              product: payload.productId,
              productId: payload.productId,
              quantity: payload.quantity,
              price: payload.price,
              name: payload.name,
              image: payload.image,
              slug: payload.slug,
              maxStock: payload.maxStock,
              variantId: payload.variantId || null,
              variantCombination: payload.variant?.combination || null,
            };
            updated = [...prev, newItem];
          }
          saveLocal(updated);
          return updated;
        });
      }
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) {
        await removeFromCart(productId);
        return;
      }

      if (isAuthenticated) {
        try {
          const updated = await updateCartItemDB(productId, quantity);
          setItems(updated.items);
          saveLocal(updated.items);
        } catch {}
      } else {
        setItems((prev) => {
          const updated = prev.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          );
          saveLocal(updated);
          return updated;
        });
      }
    },
    [isAuthenticated],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        try {
          const updated = await removeCartItemDB(productId);
          setItems(updated.items);
          saveLocal(updated.items);
        } catch {}
      } else {
        setItems((prev) => {
          const updated = prev.filter((i) => i.productId !== productId);
          saveLocal(updated);
          return updated;
        });
      }
    },
    [isAuthenticated],
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await clearCartDB();
      } catch {}
    }
    setItems([]);
    localStorage.removeItem(LOCAL_CART_KEY);
  }, [isAuthenticated]);

  const isInCart = useCallback(
    (productId: string) => {
      return items.some(
        (i) => i.productId === productId || i.product === productId,
      );
    },
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isLoading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        setIsDrawerOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
