import AppConfig from '@/appConfig';

const General = {
  /**
   * Get full image URL from path stored in database
   * Handles different image types: profile, user_profile, categories, products, setting
   */
  getImageUrl: function (imagePath: string, type: 'profile' | 'user_profile' | 'categories' | 'products' | 'setting' = 'setting'): string {
    if (!imagePath) return AppConfig.DEFULT_IMAGE;

    // If already full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // ADMIN_API_URL for images
    const base = AppConfig.ADMIN_API_URL.replace(/\/$/, '');
    const cleanPath = imagePath.replace(/^\/+/, '');

    if (imagePath.startsWith('upload/')) {
      return `${base}/${cleanPath}`;
    }

    return `${base}/upload/${type}/${cleanPath}`;
  },

  getCategoryImageUrl: function (imagePath: string): string {
    return this.getImageUrl(imagePath, 'categories');
  },

  getProductImageUrl: function (imagePath: string): string {
    if (!imagePath) return AppConfig.DEFULT_IMAGE;
    imagePath = imagePath.replace(/\\/g, '/'); // Windows paths
    return this.getImageUrl(imagePath, 'products');
  },

  makeId: function (length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  getTimezone: function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
};

export default General;

