import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import mongoose from 'mongoose';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: any;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log detailed error
  logger.error({
    message: err.message || 'Server Error',
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, statusCode: 400 } as CustomError;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const message = `Duplicate value for field: ${field}`;
    error = { message, statusCode: 400 } as CustomError;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const mongooseErr = err as mongoose.Error.ValidationError;
    const message = Object.values(mongooseErr.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 } as CustomError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 } as CustomError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 } as CustomError;
  }

  // File upload errors
  if (err.message && err.message.includes('File too large')) {
    const message = 'File size too large';
    error = { message, statusCode: 400 } as CustomError;
  }

  if (err.message && err.message.includes('Only image files')) {
    const message = 'Only image files are allowed';
    error = { message, statusCode: 400 } as CustomError;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 0,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.name 
    }),
  });
};

export default errorHandler;
