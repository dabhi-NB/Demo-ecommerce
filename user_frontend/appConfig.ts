const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000/";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/";
const adminapiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://127.0.0.1:5001/";
const AppConfig = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Next",
  BASE_URL: baseUrl,
  API_URL: apiUrl,
  ADMIN_API_URL: adminapiUrl,

  API_KEY: process.env.NEXT_PUBLIC_API_KEY || "my-api-key",
  PUBLIC_AUTH_TOKEN: process.env.NEXT_PUBLIC_PUBLIC_AUTH_TOKEN || "public",
  API_DEVICE_TYPE: process.env.NEXT_PUBLIC_API_DEVICE_TYPE
    ? Number(process.env.NEXT_PUBLIC_API_DEVICE_TYPE)
    : 0,
  APP_LOGO:
    process.env.NEXT_PUBLIC_APP_LOGO || `${adminapiUrl}upload/setting/logo.jpg`,
  DEFULT_IMAGE: `${adminapiUrl}upload/setting/no-image.jpg`,
};

export default AppConfig;