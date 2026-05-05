import { Request, Response } from "express";
import {
  getAllSettings,
  getSetting,
  updateSetting,
} from "../utils/settingsHelper";
import { asyncHandler } from "../middlewares/asyncHandler";

export const getPublicSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await getAllSettings();
    res.status(200).json({
      status: 1,
      message: "Settings retrieved successfully",
      data: settings,
    });
  },
);

export const getSettingValue = asyncHandler(
  async (req: Request, res: Response) => {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({
        status: 0,
        message: "Setting key is required",
        data: {},
      });
    }

    const value = await getSetting(key);
    res.status(200).json({
      status: 1,
      message: "Setting retrieved successfully",
      data: { key, value },
    });
  },
);

export const updateSettingValue = asyncHandler(
  async (req: Request, res: Response) => {
    const { key, value, type } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        status: 0,
        message: "Key and value are required",
        data: {},
      });
    }

    try {
      await updateSetting(key, value, type || 0);
      res.status(200).json({
        status: 1,
        message: "Setting updated successfully",
        data: { key, value, type: type || 0 },
      });
    } catch (error) {
      res.status(500).json({
        status: 0,
        message: "Failed to update setting",
        data: {},
      });
    }
  },
);

