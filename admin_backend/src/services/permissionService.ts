export class PermissionService {
  /**
   * Check if the user has a specific permission.
   *
   * @param permission The permission to check.
   * @param userPermission The user's permissions string.
   * @return boolean
   */
  static hasPermission(permission: string, userPermission: string = ''): boolean {
    if (!permission) {
      return false;
    }

    if (!userPermission) {
      return false;
    }

    return userPermission.split(',').includes(permission);
  }

  /**
   * Get the list of all permissions.
   *
   * @return string[]
   */
  static getPermissionList(): string[] {
    const permissionList: string[] = [];
    const permissionData = this.getPermissionListData();

    for (const permissionL of permissionData) {
      permissionList.push(permissionL.key);
      if (permissionL.list && permissionL.list.length > 0) {
        for (const permission of permissionL.list) {
          permissionList.push(permission.key);
        }
      }
    }
    return permissionList;
  }

  /**
   * Get the permission data list.
   *
   * @return any[]
   */
  static getPermissionListData(): any[] {
    return [
      {
        title: 'Admin',
        key: 'admin_admin',
        list: [
          { title: 'List', key: 'admin/admin' },
          { title: 'View', key: 'admin/admin/view' },
          { title: 'Create', key: 'admin/admin/create' },
          { title: 'Update', key: 'admin/admin/update' },
          { title: 'Delete', key: 'admin/admin/delete' },
          { title: 'Autologin', key: 'admin/admin/autologin' },
        ]
      },
      {
        title: 'User',
        key: 'admin/user',
        list: [
          { title: 'List', key: 'admin/user' },
          { title: 'View', key: 'admin/user/view' },
          { title: 'Create', key: 'admin/user/create' },
          { title: 'Update', key: 'admin/user/update' },
          { title: 'Delete', key: 'admin/user/delete' },
        ]
      },
      {
        title: 'Page',
        key: 'admin_page',
        list: [
          { title: 'List', key: 'admin/page' },
          { title: 'Update', key: 'admin/page/update' },
          { title: 'View', key: 'page/' },
        ]
      },
      {
        title: 'Seo meta',
        key: 'admin_seo',
        list: [
          { title: 'List', key: 'admin/seo/meta' },
          { title: 'Create', key: 'admin/seo/create' },
          { title: 'Update', key: 'admin/seo/update' },
          { title: 'Delete', key: 'admin/seo/delete' },
        ]
      },
      {
        title: 'Setting',
        key: 'admin_setting',
        list: [
          { title: 'Update', key: 'admin/setting/update' },
        ]
      },
      {
        title: 'Devices',
        key: 'admin_device',
        list: [
          { title: 'Index', key: 'admin/device' },
          { title: 'Action', key: 'admin/device/logout' },
        ]
      },
      {
        title: 'Activity',
        key: 'admin_activity',
        list: [
          { title: 'view', key: 'admin/activity' },
        ]
      },
      {
        title: 'Email Template',
        key: 'admin_email_template',
        list: [
          { title: 'List', key: 'admin/email_template' },
          { title: 'View', key: 'admin/email_template/view' },
          { title: 'Update', key: 'admin/email_template/update' },
        ]
      },
      {
        title: 'Category',
        key: 'admin_category',
        list: [
          { title: 'List', key: 'admin/categories' },
          { title: 'Create', key: 'admin/categories/create' },
          { title: 'Update', key: 'admin/categories/update' },
          { title: 'Delete', key: 'admin/categories/delete' },
        ]
      },
      {
        title: 'Product',
        key: 'admin_product',
        list: [
          { title: 'List', key: 'admin/products' },
          { title: 'Create', key: 'admin/products/create' },
          { title: 'Update', key: 'admin/products/update' },
          { title: 'Delete', key: 'admin/products/delete' },
        ]
      },
      {
        title: 'Order',
        key: 'admin_order',
        list: [
          { title: 'List', key: 'admin/orders' },
          { title: 'View', key: 'admin/orders/view' },
          { title: 'Update Status', key: 'admin/orders/update-status' },
        ]
      },
      {
        title: 'Coupon',
        key: 'admin_coupon',
        list: [
          { title: 'List', key: 'admin/coupons' },
          { title: 'Create', key: 'admin/coupons/create' },
          { title: 'Update', key: 'admin/coupons/update' },
          { title: 'Delete', key: 'admin/coupons/delete' },
        ]
      },
      {
        title: 'Inventory',
        key: 'admin_inventory',
        list: [
          { title: 'List', key: 'admin/inventory' },
          { title: 'Update Stock', key: 'admin/inventory/update-stock' },
        ]
      }
    ];
  }
}
