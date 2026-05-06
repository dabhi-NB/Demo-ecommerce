import { type RouteConfig, index, route } from "@react-router/dev/routes";


export default [
  // index("pages/home.tsx"),
  index("pages/admin/auth/login.tsx"),
  route("/auth/verify", "pages/admin/auth/verify.tsx"),
  route("/auth/password-forgot", "pages/admin/auth/password_forgot.tsx"),
  route("/auth/reset-password", "pages/admin/auth/reset_password.tsx"),
  // user management routes
  route("/admin/dashboard", "pages/admin/site/dashboard.tsx"),
  route("/admin/users", "pages/admin/user/index.tsx"),
  route("/admin/user/create", "pages/admin/user/create.tsx"),
  route("/admin/user/view/:id", "pages/admin/user/view.tsx"),
  route("/admin/user/update/:id", "pages/admin/user/update.tsx"),

  // setting management routes
  route("/admin/setting/update", "pages/admin/setting/update.tsx"),

  // seo management routes
  route("/admin/seo/meta", "pages/admin/seo/index.tsx"),
  route("/admin/seo/create", "pages/admin/seo/create.tsx"),
  route("/admin/seo/update/:id", "pages/admin/seo/update.tsx"),
  route("/admin/seo/sitemap", "pages/admin/seo/sitemap.tsx"),

  // admin management routes
  route("/admin/admin", "pages/admin/admin/index.tsx"),
  route("/admin/admin/create", "pages/admin/admin/create.tsx"),
  route("/admin/admin/view/:id", "pages/admin/admin/view.tsx"),
  route("/admin/admin/update/:id", "pages/admin/admin/update.tsx"),

  route("/admin/device", "pages/admin/device/index.tsx"),
  route("/admin/user-activity", "pages/admin/user_activity/index.tsx"),

  route("/admin/pages", "pages/admin/page/index.tsx"),
  route("/admin/page/update/:id", "pages/admin/page/update.tsx"),

  route("/admin/email-template", "pages/admin/email_template/index.tsx"),
  route("/admin/email-template/update/:id", "pages/admin/email_template/update.tsx"),
  route("/admin/email-template/view/:id", "pages/admin/email_template/view.tsx"),

  // category management routes
  route("/admin/categories", "pages/admin/category/index.tsx"),
  route("/admin/categories/create", "pages/admin/category/create.tsx"),
  route("/admin/categories/view/:id", "pages/admin/category/view.tsx"),
  route("/admin/categories/update/:id", "pages/admin/category/update.tsx"),

  // product management routes
  route("/admin/products", "pages/admin/product/index.tsx"),
  route("/admin/products/create", "pages/admin/product/create.tsx"),
  route("/admin/products/view/:id", "pages/admin/product/view.tsx"),
  route("/admin/products/update/:id", "pages/admin/product/update.tsx"),
  route("/admin/products/images/:id", "pages/admin/product/images.tsx"),

  // order management routes
  route("/admin/orders", "pages/admin/order/index.tsx"),
  route("/admin/orders/view/:id", "pages/admin/order/view.tsx"),

  // coupon management routes
  route("/admin/coupons", "pages/admin/coupon/index.tsx"),
  route("/admin/coupons/create", "pages/admin/coupon/create.tsx"),
  route("/admin/coupons/view/:id", "pages/admin/coupon/view.tsx"),
  route("/admin/coupons/update/:id", "pages/admin/coupon/update.tsx"),



  // nav management routes
  route("/admin/nav", "pages/admin/nav/index.tsx"),
  route("/admin/nav/create", "pages/admin/nav/create.tsx"),
  route("/admin/nav/update/:id", "pages/admin/nav/update.tsx"),

  // feature toggles
  route("/admin/features", "pages/admin/features/index.tsx"),

  // inventory
  route("/admin/inventory", "pages/admin/inventory/index.tsx"),

  // account
  route("/admin/account/update", "pages/admin/account/update.tsx"),
  route("/admin/account/change_password", "pages/admin/account/change_password.tsx"),
  route("/admin/account/tfa", "pages/admin/account/tfa.tsx"),
  route("/admin/account/device", "pages/admin/account/device.tsx"),
  route("/admin/account/user-activity", "pages/admin/account/user_activity.tsx"),



] satisfies RouteConfig;




