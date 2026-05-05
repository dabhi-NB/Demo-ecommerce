import { Router } from 'express';
import { generalLimiter, authLimiter } from '../utils/rateLimit';
import { apiKeyMiddleware } from '../middlewares/apiKeyMiddleware';
import { userAuthMiddleware } from '../middlewares/userAuthMiddleware';
import { AuthRequest } from '../middlewares/userAuthMiddleware';

import * as authController from '../controllers/authController';
import * as defaultController from '../controllers/defaultController';
import * as siteController from '../controllers/siteController';
import * as userController from '../controllers/userController';
import * as settingController from '../controllers/settingController';
import {
  getPaymentGateways,
  addPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  updatePaymentSettings,
} from '../controllers/settingController';
import * as seoController from '../controllers/seoController';
import * as adminController from '../controllers/adminController';
import * as deviceController from '../controllers/deviceController';
import * as userActivityController from '../controllers/userActivityController';
import * as pageController from '../controllers/pageController';
import * as emailTemplateController from '../controllers/emailTemplateController';
import * as accountController from '../controllers/accountController';
import * as categoryController from '../controllers/categoryController';
import * as productController from '../controllers/productController';
import * as orderController from '../controllers/orderController';
import * as couponController from '../controllers/couponController';
import * as adminCartWishlistController from '../controllers/adminCartWishlistController';

import { uploadAdminProfile, uploadUserProfile, uploadLogo, uploadCategoryImage, uploadProductImagesArray } from '../utils/fileUpload';

const router = Router();

// --------------------
// Apply rate limiting
// --------------------
router.use(generalLimiter);

// --------------------
// Public routes
// --------------------
router.get('/', defaultController.home);

router.get('/health', (req, res) => {
  res.json({
    status: 1,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use(apiKeyMiddleware);

router.post('/setting/public/get', settingController.getPublicSettings);

router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/verify', authLimiter, authController.verifyOtp);
router.post('/auth/resend-otp', authLimiter, authController.resendOtp);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);

// Public product routes (for user side - requires API key but not user auth)
router.get("/products/:id/variants", productController.getProductVariants);

// --------------------
// Protected routes
// --------------------
router.use(userAuthMiddleware);

// Auth routes
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);

// Dashboard
router.get('/admin/dashboard', siteController.getDashboard);
router.post('/admin/site/get-chart-user', siteController.getChartUser);
router.get('/admin/site/get-order-status-chart', siteController.getOrderStatusChart);
router.get('/admin/site/get-revenue-chart', siteController.getRevenueChart);

// Users
router.get('/admin/users', userController.getAllUsers);
router.post('/admin/users/create', uploadUserProfile.single('image'), userController.createUser);
router.post('/admin/users/update', userController.getUserById);
router.post('/admin/users/save', uploadUserProfile.single('image'), userController.saveUser);
router.delete('/admin/users/:id', userController.deleteUser);
router.post('/admin/user/view', userController.getUserDetails);
router.post('/admin/user/mail', userController.sendUserMail);
router.post('/admin/user/autologin', userController.autoLogin);
router.post('/admin/user/send-tfa-mail', userController.sendTfaMail);
router.get('/admin/users/:userId/devices', userController.getUserDevices);
router.get('/admin/users/:userId/activity', userController.getUserActivity);
router.get('/admin/users/:userId/mails', userController.getUserMails);
router.get('/admin/users/:userId/addresses', userController.getUserAddresses);
router.post('/admin/users/:userId/addresses', userController.createUserAddress);
router.put('/admin/users/:userId/addresses/:addressId', userController.updateUserAddress);
router.delete('/admin/users/:userId/addresses/:addressId', userController.deleteUserAddress);

// User cart and wishlist (admin view)
router.get('/admin/users/:userId/cart', adminCartWishlistController.getUserCart);
router.get('/admin/users/:userId/wishlist', adminCartWishlistController.getUserWishlist);
router.delete('/admin/users/:userId/cart/items/:productId', adminCartWishlistController.removeFromUserCart);
router.delete('/admin/users/:userId/wishlist/:productId', adminCartWishlistController.removeFromUserWishlist);

// Settings
router.get('/admin/setting/update', settingController.getSettings);
router.post('/admin/setting/save', settingController.saveSettings);
router.post('/admin/setting/save-captcha', settingController.saveCaptchaSettings);
router.post('/admin/setting/save-social', settingController.saveSocialSettings);
router.post('/admin/setting/save-content', settingController.saveContentSettings);
router.post('/admin/setting/save-logo', uploadLogo.single('image'), settingController.saveLogo);
router.post('/admin/setting/mail-process', settingController.mailProcess);
router.get('/admin/setting/cache-clear', settingController.cacheClear);
router.post('/admin/setting/save-payment', settingController.savePaymentSettings);
router.post('/admin/setting/save-sms', settingController.saveSmsSettings);

// Payment Gateways
router.get('/admin/payment/gateways', getPaymentGateways);
router.post('/admin/payment/gateways', addPaymentGateway);
router.put('/admin/payment/gateways/:gatewayId', updatePaymentGateway);
router.delete('/admin/payment/gateways/:gatewayId', deletePaymentGateway);
router.put('/admin/payment/settings', updatePaymentSettings);

// SEO
router.get("/admin/seo/meta", seoController.getAllSeoMeta);
router.post("/admin/seo/create", uploadAdminProfile.none(), seoController.createSeoMeta);
router.post("/admin/seo/update", seoController.getSeoMetaById);
router.post("/admin/seo/save", uploadAdminProfile.none(), seoController.saveSeo);
router.delete("/admin/seo/:id", seoController.deleteSeoMeta);

// Admins
router.get('/admin/admin', adminController.getAllAdmins);
router.post('/admin/admin/create', uploadAdminProfile.single('image'), adminController.createAdmin);
router.post('/admin/admin/update', adminController.getAdminById);
router.post('/admin/admin/save', uploadAdminProfile.single('image'), adminController.saveAdmin);
router.delete('/admin/admin/:id', adminController.deleteAdmin);
router.post('/admin/admin/view', adminController.getAdminDetails);

// Devices
router.get("/admin/device", deviceController.getAllDevices);
router.post("/admin/device/logout", deviceController.logoutDevice);

// User activity
router.get("/admin/user-activity", userActivityController.getAllActivities);

// Pages
router.get("/admin/pages", pageController.getAllPages);
router.post("/admin/page/update", pageController.getPageById);
router.post("/admin/page/save", pageController.savePage);

// Categories (order matters: /select before /:id)
router.get("/admin/categories", categoryController.getCategories);
router.get("/admin/categories/select", categoryController.getCategoriesForSelect);
router.get("/admin/categories/:id", categoryController.getCategoryById);
router.post("/admin/categories/create", uploadCategoryImage, categoryController.createCategory);
router.post("/admin/categories/update/:id", uploadCategoryImage, categoryController.updateCategory);
router.delete("/admin/categories/delete/:id", categoryController.deleteCategory);

// Products (order matters: /bulk-stock, /select before /:id)
router.get("/admin/products", productController.getProducts);
router.get("/admin/products/select", productController.getProductsForSelect);
router.post("/admin/products/bulk-stock", productController.getBulkStockUpdate);
router.get("/admin/products/:id", productController.getProductById);
router.post("/admin/products/create", uploadProductImagesArray, productController.createProduct);
router.post("/admin/products/images/:id", uploadProductImagesArray, productController.updateProduct);
router.post("/admin/products/update/:id", uploadProductImagesArray, productController.updateProduct);
router.patch("/admin/products/update/stock/:id", productController.updateProductStock);
router.delete("/admin/products/delete/:id", productController.deleteProduct);

// Orders (order matters: /stats before /:id)
router.get("/admin/orders", orderController.getOrders);
router.get("/admin/orders/stats", orderController.getOrderStats);
router.get("/admin/orders/:id", orderController.getOrderById);
router.get("/admin/orders/user/:userId", orderController.getOrdersByUser);
router.patch("/admin/orders/status/:id", orderController.updateOrderStatus);

// Coupons
router.get("/admin/coupons", couponController.getCoupons);
router.get("/admin/coupons/:id", couponController.getCouponById);
router.post("/admin/coupons/create", couponController.createCoupon);
router.put("/admin/coupons/update/:id", couponController.updateCoupon);
router.delete("/admin/coupons/delete/:id", couponController.deleteCoupon);

// Public coupon validation
router.post("/coupons/validate", couponController.validateCoupon);

// Email templates
router.get("/admin/email-template", emailTemplateController.getAllEmailTemplate);
router.post("/admin/email-template/update", emailTemplateController.getEmailTemplateById);
router.post("/admin/email-template/save", emailTemplateController.saveEmailTemplate);
router.post('/admin/email-template/view', emailTemplateController.getEmailTemplateDetails);

// Account routes (use req.userData in controllers)
router.get('/admin/account/profile', accountController.getProfile);
router.put('/admin/account/update', accountController.updateProfile);
router.post('/admin/account/password-change', accountController.changePassword);
router.post('/admin/account/upload-image', uploadAdminProfile.single('image'), accountController.updateImage);
router.delete("/admin/account/delete-image", accountController.deleteImage);
router.post("/admin/account/device", deviceController.getMyAccountDevices);
router.post("/admin/account/user-activity", userActivityController.getMyAccountActivities);
router.post("/admin/account/tfa-status-change", accountController.toggleTfaStatus);
router.post("/admin/account/revoke-all", accountController.revokeAllDevices);

export default router;
