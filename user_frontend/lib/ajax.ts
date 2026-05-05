import axios from "axios";
import AppConfig from "../appConfig";

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
  normalizeError: (err: any) => any;
}

export const Ajax: AjaxType = {
  postWithProgress: function (
    url: string,
    data: any,
    progressCallBack?: (n: number) => void
  ): Promise<any> {
    const auth_token = localStorage.getItem("auth_token");

    return axios
      .post(AppConfig.API_URL + url, data, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const percent = Math.round((e.loaded / e.total) * 100);
          progressCallBack?.(percent);
        },
        headers: {
          "x-api-key": AppConfig.API_KEY,
          "x-auth-token": auth_token || "",
        },
      })
      .then((res) => res.data)
      .catch((err) => {
        throw Ajax.normalizeError(err);
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

    let headers: any = {
      "x-api-key": AppConfig.API_KEY,
      "x-auth-token": auth_token || "",
    };

    if (method === "form-data") {
      headers["Content-Type"] = "multipart/form-data";
      method = "post";
    }

    const fullUrl = `${AppConfig.API_URL || 'http://127.0.0.1:5000/'}${url}`;
    console.log('[AJAX] Calling:', fullUrl, method, headers);
    return axios({
      method,
      url: fullUrl,
      data: data || {},
      headers,
    })
      .then((res) => res.data)
      .catch((err) => {
        throw Ajax.normalizeError(err);
      });
  },

  normalizeError: function (err: any): any {
    const backend = err?.response?.data ?? {};
    const http_status = err?.response?.status || 500;
    const url = err.config?.url || 'unknown';

    console.log(
      `🌐 AJAX ERROR [${http_status}]: ${url}`,
      err.message,
      "Full error:",
      err.response?.data || err.message
    );

    // Dispatch server-crash event for 5xx errors or network errors (server down)
    if ((http_status >= 500 && http_status < 600) || !err.response) {
      console.log("Dispatching server-crash event");
      window.dispatchEvent(new CustomEvent("server-crash"));
    }

    // Dispatch unauthorized event for 401 errors
    if (http_status === 401) {
      console.log("Dispatching unauthorized event");
      window.dispatchEvent(new CustomEvent("unauthorized"));
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
