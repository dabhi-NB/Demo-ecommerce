import axios from "axios";
import AppConfig from "@/appConfig";

interface AjaxType {
  postWithProgress: (
    url: string,
    data: any,
    progressCallBack?: (n: number) => void
  ) => Promise<any>;
  get: (url: string) => Promise<any>;
  post: (url: string, data?: any) => Promise<any>;
  put: (url: string, data?: any) => Promise<any>;
  delete: (url: string, data?: any) => Promise<any>;
  postWithFormData: (url: string, formData: FormData) => Promise<any>;
  request: (url: string, data: any, method?: string) => Promise<any>;
  normalizeError: (err: any, url?: string) => any;
}

export const Ajax: AjaxType = {
  postWithProgress: function (
    url: string,
    data: any,
    progressCallBack?: (n: number) => void
  ): Promise<any> {
    const auth_token = localStorage.getItem("auth_token");

    // For public endpoints like contact and page, don't send API key but send auth token for contact
    const isPublicEndpoint = url === "contact" || url === "page/:slug";

    let headers: any = {};
    if (!isPublicEndpoint) {
      headers["x-api-key"] = AppConfig.API_KEY;
      // Send auth token only for non-public endpoints
      if (auth_token) {
        headers["x-auth-token"] = auth_token;
      }
    } else if (url === "contact" && auth_token) {
      // Send auth token for contact endpoint to get user_id
      headers["x-auth-token"] = auth_token;
    }

    return axios
      .post(AppConfig.API_URL + url, data, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const percent = Math.round((e.loaded / e.total) * 100);
          progressCallBack?.(percent);
        },
        headers,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw Ajax.normalizeError(err, url);
      });
  },

  get: function (url: string): Promise<any> {
    return this.request(url, {}, "get");
  },

  post: function (url: string, data?: any): Promise<any> {
    return this.request(url, data, "post");
  },

  put: function (url: string, data?: any): Promise<any> {
    return this.request(url, data, "put");
  },

  delete: function (url: string, data?: any): Promise<any> {
    return this.request(url, data || {}, "delete");
  },

  postWithFormData: function (url: string, formData: FormData): Promise<any> {
    return this.request(url, formData, "form-data");
  },

  request: function (
    url: string,
    data: any,
    method: string = "post"
  ): Promise<any> {
    const auth_token = localStorage.getItem("auth_token");

    // For public endpoints like contact and page, don't send API key but send auth token for contact
    const isPublicEndpoint = url === "contact" || url === "page/:slug";

    let headers: any = {};
    if (!isPublicEndpoint) {
      headers["x-api-key"] = AppConfig.API_KEY;
      // Send auth token only for non-public endpoints
      if (auth_token) {
        headers["x-auth-token"] = auth_token;
        console.log(
          `[AJAX] Sending x-auth-token for ${url}:`,
          auth_token.substring(0, 10) + "..."
        );
      } else {
        console.log(`[AJAX] No auth token found in localStorage for ${url}`);
      }
    } else if (url === "contact" && auth_token) {
      // Send auth token for contact endpoint to get user_id
      headers["x-auth-token"] = auth_token;
    }

    if (method === "form-data") {
      headers["Content-Type"] = "multipart/form-data";
      method = "post";
    }

    const fullUrl = AppConfig.API_URL + url;
    console.log(`[AJAX] Calling: ${method.toUpperCase()} ${fullUrl}`, { data, headers });

    if (method === "get") {
      return axios
        .get(fullUrl, { params: data, headers })
        .then((res) => {
          console.log(`[AJAX] Response for ${url}:`, res.data);
          return res.data;
        })
        .catch((err) => {
          console.log(`[AJAX] Error for ${url}:`, err);
          throw Ajax.normalizeError(err, url);
        });
    } else if (method === "post") {
      return axios
        .post(fullUrl, data || {}, { headers })
        .then((res) => {
          console.log(`[AJAX] Response for ${url}:`, res.data);
          return res.data;
        })
        .catch((err) => {
          console.log(`[AJAX] Error for ${url}:`, err);
          throw Ajax.normalizeError(err, url);
        });
    } else if (method === "put") {
      return axios
        .put(fullUrl, data || {}, { headers })
        .then((res) => {
          console.log(`[AJAX] Response for ${url}:`, res.data);
          return res.data;
        })
        .catch((err) => {
          console.log(`[AJAX] Error for ${url}:`, err);
          throw Ajax.normalizeError(err, url);
        });
    } else if (method === "delete") {
      return axios
        .delete(fullUrl, { data, headers })
        .then((res) => {
          console.log(`[AJAX] Response for ${url}:`, res.data);
          return res.data;
        })
        .catch((err) => {
          console.log(`[AJAX] Error for ${url}:`, err);
          throw Ajax.normalizeError(err, url);
        });
    } else {
      return axios({
        method,
        url: fullUrl,
        data: data || {},
        headers,
      })
        .then((res) => {
          console.log(`[AJAX] Response for ${url}:`, res.data);
          return res.data;
        })
        .catch((err) => {
          console.log(`[AJAX] Error for ${url}:`, err);
          throw Ajax.normalizeError(err, url);
        });
    }
  },

  normalizeError: function (err: any, url?: string): any {
    const backend = err?.response?.data ?? {};
    const http_status = err?.response?.status || 500;

    // console.log(
    //   "API Error:",
    //   err.message,
    //   "Status:",
    //   http_status,
    //   "Response:",
    //   !!err.response
    // );

    // Dispatch server-crash event for 5xx errors or network errors (server down)
    // But NOT for 401 errors on public endpoints like contact
    // Also NOT for CORS errors (no response or specific CORS messages)
    const isCorsError = !err.response || err.message?.includes('CORS') || err.code === 'ERR_NETWORK';
    if ((http_status >= 500 && http_status < 600) || (!err.response && !isCorsError)) {
      // console.log("Dispatching server-crash event");
      window.dispatchEvent(new CustomEvent("server-crash"));
    }

    return {
      status: backend?.status ?? 0,
      message:
        backend?.message ||
        backend?.msg ||
        err?.message ||
        "Something went wrong",
      data: backend?.data ?? null,
      http_status,
    };
  },
};
