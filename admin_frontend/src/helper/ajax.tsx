import axios from "axios";
import AppConfig from "@/appConfig"; 


// Helper function to properly concatenate API URL with endpoint
// This handles trailing/leading slashes properly to avoid double slashes
const buildUrl = (endpoint: string): string => {
    const baseUrl = AppConfig.API_URL.replace(/\/$/, ''); // Remove trailing slash
    const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
    return `${baseUrl}/${cleanEndpoint}`;
};

export const Ajax = {
    postWithProgress: function (url: string, data: any, progressCallBack?: (n: number) => void) {
        const auth_token = localStorage.getItem('auth_token');
        return axios
            .post(buildUrl(url), data, {
                onUploadProgress: (progressEvent: any) => {
                    const total = progressEvent?.total || (progressEvent?.progressEvent && progressEvent.progressEvent.total);
                    const loaded = progressEvent?.loaded || (progressEvent?.progressEvent && progressEvent.progressEvent.loaded);
                    if (!total) return;
                    let percentComplete = Math.round((loaded / total) * 100);
                    if (typeof progressCallBack === 'function') {
                        progressCallBack(percentComplete);
                    }
                },
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': AppConfig.API_KEY,
                    'x-auth-token': auth_token || '',
                },
            })
            .then((response) => response.data)
            .catch((err) => {
                // Normalize error response
                const normalizedError = Ajax.normalizeError(err);
                throw normalizedError;
            });
    },

    post: function (url: string, data: any) {
        return this.request(url, data, 'post');
    },

    get: function (url: string) {
        return this.request(url, null, 'get');
    },
    
    put: function (url: string, data: any) {
        return this.request(url, data, 'put');
    },

    delete: function (url: string, data?: any) {
        return this.request(url, data, 'delete');
    },

    postWithFormData: function (url: string, formData: FormData) {
        return this.request(url, formData, 'post');
    },

    request: function (url: string, data: any, method: string = 'post') {
        const auth_token = localStorage.getItem('auth_token');
        let headers: any = {
            'x-api-key': AppConfig.API_KEY,
            'x-auth-token': auth_token || '',
        };
        
        // Only set content-type for JSON; let axios set it for FormData
        if (!(data instanceof FormData)) {
            headers['content-type'] = 'application/json';
        }
        
        const config: any = {
            method: method,
            url: buildUrl(url),
            headers: headers,
        };
        if (method !== 'get') {
            config.data = data || {};
        }
        return axios(config)
            .then((response) => response.data)
            .catch((err) => {
                // Normalize error response
                const normalizedError = Ajax.normalizeError(err);
                throw normalizedError;
            });
    },

    healthCheck: function () {
        return axios.get(buildUrl('health'), {
            headers: {
                'x-api-key': AppConfig.API_KEY,
            },
        })
        .then((response) => response.data)
        .catch(() => {
            // Return false if health check fails
            return false;
        });
    },

    normalizeError: function (err: any) {
        const backend = err?.response?.data ?? null;
        const http_status = err?.response?.status || 500;

        // Extract meaningful error message
        const message =
            backend?.message || // Backend-provided message
            backend?.msg || // Alternative backend message field
            err?.message || // Axios error message
            "Something went Wrong"; // Default fallback message

        return {
            status: backend?.status ?? 0,
            message: String(message),
            data: backend?.data ?? null,
            http_status,
        };
    },
};



