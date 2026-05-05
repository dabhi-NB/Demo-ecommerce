export type PermissionItem = {
    title: string;
    key: string;
    list?: PermissionItem[];
};

export class PermissionService {
    /**
     * Check if the user has a specific permission.
     *
     * @param permission The permission(s) to check.
     * @param userPermission The user's permissions.
     * @return boolean
     */
    static hasPermission(permission: string | string[], userPermission: string = ''): boolean {
        if (permission === '') {
            permission = window.location.pathname;
        }
        if (userPermission === null) {
            userPermission = '';
        }

        if (Array.isArray(permission)) {
            return permission.some(p => this.checkPermission(p, userPermission));
        }

        return this.checkPermission(permission, userPermission);
    }

    /**
     * Check if the user has a specific permission in the permission list.
     *
     * @param permission The permission to check.
     * @param userPermission The user's permissions.
     * @return boolean
     */
    static checkPermission(permission: string, userPermission: string): boolean {
        if (this.getPermissionList().includes(permission)) {
            return userPermission.split(',').includes(permission);
        }
        return true;
    }

    /**
     * Get the list of all permissions.
     *
     * @return string[]
     */
    static getPermissionList(): string[] {
        const permissionList: string[] = [];
        this.getPermissionListData().forEach(permissionL => {
            permissionList.push(permissionL.key);
            if (permissionL.list) {
                permissionL.list.forEach(permission => {
                    permissionList.push(permission.key);
                });
            }
        });
        return permissionList;
    }

    /**
     * Get the permission data list.
     *
     * @return PermissionItem[]
     */
    static getPermissionListData(): PermissionItem[] {
        return [
            {
                title: 'Admin',
                key: 'admin_admin',
                list: [
                    {
                        title: 'List',
                        key: 'admin/admin',
                    },
                    {
                        title: 'View',
                        key: 'admin/admin/view',
                    },
                    {
                        title: 'Create',
                        key: 'admin/admin/create',
                    },
                    {
                        title: 'Update',
                        key: 'admin/admin/update',
                    },
                    {
                        title: 'Delete',
                        key: 'admin/admin/delete',
                    },
                ]
            },
            {
                title: 'User',
                key: 'admin_user',
                list: [
                    {
                        title: 'List',
                        key: 'admin/user',
                    },
                    {
                        title: 'View',
                        key: 'admin/user/view',
                    },
                    {
                        title: 'Create',
                        key: 'admin/user/create',
                    },
                    {
                        title: 'Update',
                        key: 'admin/user/update',
                    },
                    {
                        title: 'Delete',
                        key: 'admin/user/delete',
                    },
                    {
                        title: 'Auto Login',
                        key: 'admin/user/autologin',
                    },
                    {
                        title: 'Send TFA Mail',
                        key: 'admin/user/send-tfa-mail',
                    },
                ]
            },
            {
                title: 'Page',
                key: 'admin_page',
                list: [
                    {
                        title: 'List',
                        key: 'admin/page',
                    },
                    {
                        title: 'Update',
                        key: 'admin/page/update',
                    },
                    {
                        title: 'View',
                        key: 'page/',
                    },
                ]
            },
            {
                title: 'Seo meta',
                key: 'admin_seo',
                list: [
                    {
                        title: 'List',
                        key: 'admin/seo/meta',
                    },
                    {
                        title: 'Create',
                        key: 'admin/seo/create',
                    },
                    {
                        title: 'Update',
                        key: 'admin/seo/update',
                    },
                    {
                        title: 'Delete',
                        key: 'admin/seo/delete',
                    },
                ]
            },
            {
                title: 'Setting',
                key: 'admin_setting',
                list: [
                    {
                        title: 'Update',
                        key: 'admin/setting/update',
                    },
                ]
            },
            {
                title: 'Devices',
                key: 'admin_device',
                list: [
                    {
                        title: 'Index',
                        key: 'admin/device',
                    },
                    {
                        title: 'Action',
                        key: 'admin/device/logout',
                    },
                ]
            },
            {
                title: 'Activity',
                key: 'admin_activity',
                list: [
                    {
                        title: 'View',
                        key: 'admin/activity',
                    },
                ]
            },
            {
                title: 'Email Template',
                key: 'admin_email_template',
                list: [
                    {
                        title: 'List',
                        key: 'admin/email_template',
                    },
                    {
                        title: 'View',
                        key: 'admin/email_template/view',
                    },

                    {
                        title: 'Update',
                        key: 'admin/email_template/update',
                    },
                    

                ]
            },
            {
                title: 'Products',
                key: 'admin_product',
                list: [
                    {
                        title: 'list Products',
                        key: 'admin/products',
                    },
                    {
                        title: 'View Products',
                        key: 'admin/products/view',
                    },
                    {
                        title: 'Create Products',
                        key: 'admin/products/create',
                    },
                    {
                        title: 'Update Products',
                        key: 'admin/products/update',
                    },
                    {
                        title: 'Delete Products',
                        key: 'admin/products/delete',
                    },
                ]
            },
            {
                title: 'Categories',
                key: 'admin_category',
                list: [
                    {
                        title: 'View Categories',
                        key: 'admin/categories',
                    }, {
                        title: 'View Category',    // ADD THIS
                        key: 'admin/categories/view',  // ADD THIS
                    },
                    {
                        title: 'Create Categories',
                        key: 'admin/categories/create',
                    },
                    {
                        title: 'Update Categories',
                        key: 'admin/categories/update',
                    },
                    {
                        title: 'Delete Categories',
                        key: 'admin/categories/delete',
                    },
                ]
            },
            {
                title: 'Orders',
                key: 'admin_order',
                list: [
                    {
                        title: 'View Orders',
                        key: 'admin/orders',
                    },
                    {
                        title: 'View Order Details',  // ADD THIS
                        key: 'admin/orders/view',     // ADD THIS
                    },
                    {
                        title: 'Update Order Status',
                        key: 'admin/orders/status',
                    },
                ]
            },
            {
                title: 'Coupons',
                key: 'admin_coupon',
                list: [
                    {
                        title: 'View Coupons',
                        key: 'admin/coupons',
                    },
                    {
                        title: 'View Coupon',    // ADD THIS
                        key: 'admin/coupons/view',  // ADD THIS
                    },
                    {
                        title: 'Create Coupons',
                        key: 'admin/coupons/create',
                    },
                    {
                        title: 'Update Coupons',
                        key: 'admin/coupons/update',
                    },
                    {
                        title: 'Delete Coupons',
                        key: 'admin/coupons/delete',
                    },
                ]
            },
            {
                title: 'Payment',
                key: 'admin_payment',
                list: [
                    {
                        title: 'View Gateways',
                        key: 'admin/payment/gateways',
                    },
                    {
                        title: 'Manage Gateways',
                        key: 'admin/payment/manage',
                    },
                    {
                        title: 'Update Settings',
                        key: 'admin/payment/settings',
                    },
                ]
            }
        ];
    }
}
