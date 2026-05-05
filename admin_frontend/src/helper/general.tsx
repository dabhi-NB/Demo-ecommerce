import { toast } from 'react-hot-toast';
import AppConfig from '@/appConfig';

const General = {
    makeId: function (length: number) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    getTimezone: function () {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (e) {
            return 'UTC';
        }
    },

    showMessage: function (data: {status:number, message:string}    ) {
        if(data.status === 1) {
            toast.success(data.message);
        }else{
            toast.error(data.message);
        }
    },
    currentTime : function (format?: string) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (format === 'YYYY-MM-DDTHH:mm') {
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * Get full image URL from path stored in database
     * Handles different image types: profile, user_profile, categories, products, setting
     * @param imagePath - The image path from database (e.g., "slug/filename.jpg" or just "filename.jpg")
     * @param type - The type of image: 'profile' | 'user_profile' | 'categories' | 'products' | 'setting'
     * @returns Full URL to the image
     */
    getImageUrl: function (imagePath: string, type: 'profile' | 'user_profile' | 'categories' | 'products' | 'setting' = 'setting'): string {
        if (!imagePath) return '';
        
        // If already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If path already starts with 'upload/', prepend API URL (remove trailing slash first)
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        
        // Build URL based on type
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/${type}/${imagePath}`;
    },
    
    /**
     * Get category image URL
     * Category stores path as "slug/filename" e.g., "electronics/abc123.jpg"
     */
    getCategoryImageUrl: function (imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/categories/${imagePath}`;
    },
    
    /**
     * Get product image URL
     * Product stores path as "category_slug/product_slug/filename" e.g., "electronics/phones/abc123.jpg"
     * Also handles Windows-style paths with backslashes
     */
    getProductImageUrl: function (imagePath: string): string {
        if (!imagePath) return '';
        
        // Replace backslashes with forward slashes (handle Windows paths)
        imagePath = imagePath.replace(/\\/g, '/');
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/products/${imagePath}`;
    },
    
    /**
     * Get admin profile image URL
     */
    getProfileImageUrl: function (imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/profile/${imagePath}`;
    },
    
    /**
     * Get user profile image URL
     */
    getUserProfileImageUrl: function (imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/user_profile/${imagePath}`;
    },
    
    /**
     * Get setting image URL (logo, favicon)
     */
    getSettingImageUrl: function (imagePath: string): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        if (imagePath.startsWith('upload/')) {
            return `${AppConfig.API_URL.replace(/\/$/, '')}/${imagePath}`;
        }
        return `${AppConfig.API_URL.replace(/\/$/, '')}/upload/setting/${imagePath}`;
    },

};

export default General;


