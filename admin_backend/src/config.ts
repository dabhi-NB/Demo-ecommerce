import dotenv from 'dotenv';

// Load .env into process.env
dotenv.config();

export interface AppConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  CORS_ORIGIN: string | string[];
  MONGODB_URI: string;
  REDIS_URL: string;
  CACHE_DRIVER?: string;
  API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  JWT_SECRET?: string;
}

const env = process.env;

const config: AppConfig = {
  NODE_ENV: env.NODE_ENV || 'development',
  PORT: env.PORT ? Number(env.PORT) : 5001,
  HOST: env.HOST || '127.0.0.1',
  CORS_ORIGIN: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : '*',
  MONGODB_URI: env.MONGODB_URI || 'mongodb://localhost:27017/demo',
  REDIS_URL: env.REDIS_URL || 'redis://localhost:6379',
  CACHE_DRIVER: env.CACHE_DRIVER || 'memory',
  API_KEY: env.API_KEY,
  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
  SMTP_FROM: env.SMTP_FROM || env.SMTP_USER,
  JWT_SECRET: env.JWT_SECRET,
};

export default config;
