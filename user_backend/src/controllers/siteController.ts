import { Request, Response } from 'express';
import { AccountService } from '../services/accountService';
import { accountRegisterSchema } from '../validators/RegisterValidator';
import { asyncHandler } from '../middlewares/asyncHandler';
import mongoose from "mongoose";

interface ApiResponse {
  status: number;
  message: string;
  data: any;
  next?: 'redirect' | 'reload' | 'refresh';
  url?: string;
}

const formatResponse = (response: any): ApiResponse => ({
  status: response.status,
  message: response.message,
  data: response.data || [],
  next: response.next,
  url: response.url
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { error } = accountRegisterSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: 0,
      message: error.details[0].message,
      data: []
    });
  }

  const result = await AccountService.register(req, req.body);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const verifyAccount = asyncHandler(async (req: Request, res: Response) => {
  const result = await AccountService.verifyAccount(req.body);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await AccountService.forgotPassword(req, req.body);
    res
      .status(result.http_status ?? 200)
      .json(formatResponse(result));
  }
);



