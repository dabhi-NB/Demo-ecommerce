const baseUrl =
  (import.meta.env.VITE_BASE_URL as string) || "http://127.0.0.1:3001/";
const apiUrl =
  (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:5001/";

const AppConfig = {
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || "React Admin",
  BASE_URL: baseUrl,
  API_URL: apiUrl,
  API_KEY: (import.meta.env.VITE_API_KEY as string) || "my-secret-api-key",
  API_DEVICE_TYPE: (import.meta.env.VITE_API_DEVICE_TYPE as string)
    ? Number(import.meta.env.VITE_API_DEVICE_TYPE)
    : 0,
  // use local placeholder assets instead of AdminLTE theme assets
  DEFAULT_IMAGE: `${apiUrl}upload/setting/no-image.jpg`,
  FRONT_URL: "http://127.0.0.1:3000/",
};

export default AppConfig;
