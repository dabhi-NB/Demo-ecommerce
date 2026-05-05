import { Router } from "express";
import { generalLimiter, authLimiter } from "../utils/rateLimit";
import { apiKeyMiddleware } from "../middlewares/apiKeyMiddleware";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware";
import * as authController from "../controllers/authController";
import * as accountController from "../controllers/accountController";
import * as settingController from "../controllers/settingController";
import * as siteController from "../controllers/siteController";
import { home } from "../controllers/defaultController";
import FrontController from "../controllers/frontController";
import { uploadMiddleware } from "../utils/fileUpload";
import SeoController from "../controllers/seoController";
import {
  tfa,
  tfaStatusChange,
  revokeAll,
} from "../controllers/accountController";
import * as categoryController from "../controllers/categoryController";
import * as productController from "../controllers/productController";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  validateCart,
} from '../controllers/orderController'
import { validateCoupon } from '../controllers/couponController'
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/accountController'
import { getCart, syncCart, addToCart, updateCartItem, removeFromCart, clearCart as clearCartCtrl } from '../controllers/cartController'
import { getWishlist, toggleWishlist, clearWishlist as clearWishlistCtrl } from '../controllers/wishlistController'

const router: Router = Router();

router.get("/", home as any);

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: 1,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Public routes (no API key required)
router.get("/page/:slug", FrontController.page as any);
router.post("/contact", FrontController.contact as any);

// Sitemap.xml route (public)
router.get("/sitemap.xml", SeoController.generateSitemap);

// Settings routes (public)
router.get("/settings/public", settingController.getPublicSettings);

// Public auth routes (no auth required)
router.post("/auth/login", authLimiter, authController.login);
router.post("/auth/login-otp", authLimiter, authController.loginOtp);
router.post("/auth/verify", authLimiter, authController.verify);
router.post("/auth/resend-otp", authLimiter, authController.resendOtp);

router.post("/register", siteController.register);
router.post("/auth/verify-account", siteController.verifyAccount);
router.post("/auth/forgot-password", siteController.forgotPassword);

router.use(apiKeyMiddleware as any);
// Apply general rate limiting to non-TFA routes
router.use((req, res, next) => {
  // Skip general limiter for TFA routes
  if (
    req.path.startsWith("/account/tfa") ||
    req.path.startsWith("/auth/opt-verify-process") ||
    req.path.startsWith("/auth/save-totp-secret") ||
    req.path.startsWith("/auth/remove-totp")
  ) {
    return next();
  }
  return generalLimiter(req, res, next);
});

// Category routes (PUBLIC — no auth)
router.get("/categories", categoryController.getAllCategories);
router.get("/categories/slug/:slug", categoryController.getCategoryBySlug);

// Product routes (PUBLIC — no auth)
// IMPORTANT: specific routes B EFORE param routes
router.get("/products/featured", productController.getFeaturedProducts);
router.get("/products/search", productController.searchProducts);
router.get("/products/:slug/variants", productController.getProductVariants);
router.get("/products/slug/:slug", productController.getProductBySlug);
router.get("/products/:id/related", productController.getRelatedProducts);
router.get("/products", productController.getProducts);

// ============================================================
// CART ROUTES (public)
// ============================================================
router.post('/cart/validate', validateCart)

// CART ROUTES (protected)
router.get('/cart', userAuthMiddleware, getCart)
router.post('/cart/sync', userAuthMiddleware, syncCart)
router.post('/cart/items', userAuthMiddleware, addToCart)
router.put('/cart/items/:productId', userAuthMiddleware, updateCartItem)
router.delete('/cart/items/:productId', userAuthMiddleware, removeFromCart)
router.delete('/cart', userAuthMiddleware, clearCartCtrl)

// WISHLIST ROUTES
router.get('/wishlist', userAuthMiddleware, getWishlist)
router.post('/wishlist/toggle', userAuthMiddleware, toggleWishlist)
router.delete('/wishlist', userAuthMiddleware, clearWishlistCtrl)

// Settings routes (public - requires API key only)
// router.get("/settings/public", settingController.getPublicSettings);
router.post("/setting/public/get", settingController.getPublicSettings);
router.post("/setting/get", settingController.getSettingValue);

// Protected auth routes (require authentication)
router.use(userAuthMiddleware as any);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh-token", authController.refreshToken);

// ============================================================
// COUPON ROUTES
// ============================================================
router.post('/coupons/validate', userAuthMiddleware, validateCoupon)

// ============================================================
// ORDER ROUTES
// IMPORTANT: /orders/my MUST be before /orders/:id
// ============================================================
router.get('/orders/my', userAuthMiddleware, getMyOrders)
router.get('/orders/:id', userAuthMiddleware, getOrderById)
router.post('/orders', userAuthMiddleware, placeOrder)
router.post('/orders/:id/cancel', userAuthMiddleware, cancelOrder)

// ============================================================
// ADDRESS ROUTES
// IMPORTANT: /account/addresses/:addressId/default MUST be
// before /account/addresses/:addressId
// ============================================================
router.get('/account/addresses', userAuthMiddleware, getAddresses)
router.post('/account/addresses', userAuthMiddleware, addAddress)
router.patch('/account/addresses/:addressId/default', userAuthMiddleware, setDefaultAddress)
router.put('/account/addresses/:addressId', userAuthMiddleware, updateAddress)
router.delete('/account/addresses/:addressId', userAuthMiddleware, deleteAddress)

// ========== ACCOUNT ROUTES ==========

router.get("/account/profile", accountController.getProfile);
router.get("/account/view", accountController.viewAccount);
router.get("/auth/me", accountController.getProfile);
router.put("/account/update", accountController.updateAccount);

router.post("/account/password-change", accountController.passwordChange);
router.post(
  "/account/update-image",
  uploadMiddleware,
  accountController.updateImage
);
router.delete("/account/delete-image", accountController.deleteImage);

router.get("/account/sessions", accountController.getUserSessions);
router.delete("/account/sessions/:sessionId", accountController.deleteSession);

router.post("/account/device-list", accountController.deviceList);
router.post("/account/user-activity-list", accountController.userActivityList);
router.post("/account/device-logout", accountController.deviceLogout);

router.post("/account/deactivate", accountController.deleteAccount);

// TFA routes
router.get("/account/tfa", tfa);
router.post("/account/tfa-status-change", tfaStatusChange);
router.post("/account/revoke-all", revokeAll);

// Auth Controller TFA routes (Laravel style - all using AuthController)
router.get("/get-qr-modal", authController.getTotpModel);
router.get("/otp.verify", authController.verifyOtpModal);
router.post("/otp.confirm", authController.optVerifyProcess);
router.get("/account/backup-code", authController.backupCode);
router.get(
  "/account/backup-codes.regenerate",
  authController.regenerateBackupCode
);
router.get("/copy-secret-key", authController.getTotpModel);
router.post("/remove-totp", authController.removeTotp);

export default router;
