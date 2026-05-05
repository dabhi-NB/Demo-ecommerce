import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { AuthService } from "../services/authService";

export const getAllDevices = asyncHandler(async (_req: Request, res: Response) => {

  const result = await AuthService.getActiveDevices();

  return res.status(result.http_status).json({
    status: result.status,
    message: result.message,
    data: result.data || []
  });
});

export const logoutDevice = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.body;

  const result = await AuthService.forceLogoutDevice(deviceId);

  return res.status(result.http_status).json({
    status: result.status,
    message: result.message,
  });
});

// ✅ NEW: My account devices (filter by current user)
export const getMyAccountDevices = asyncHandler(async (req: Request, res: Response) => {
  const userDataId = (req as any).userData?._id;
  if (!userDataId) {
    return res.status(401).json({
      status: 0,
      message: 'Authentication required'
    });
  }

  const result = await AuthService.getActiveDevices(userDataId);

  return res.status(result.http_status).json({
    status: result.status,
    message: result.message,
    data: result.data || []
  });
});
