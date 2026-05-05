import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { AuthService } from "../services/authService";

export const getAllActivities = asyncHandler(async (req: Request, res: Response) => {
  // Call the service
  const data = await AuthService.getAllUserActivities();

  return res.status(data.http_status).json({
    status: data.status,
    message: data.message,
    data: data.data || []
  });
});

// ✅ NEW: My account activities  
export const getMyAccountActivities = asyncHandler(async (req: Request, res: Response) => {
  const userDataId = (req as any).userData?.id || (req as any).userData?._id;
  if (!userDataId) {
    return res.status(401).json({
      status: 0,
      message: 'Authentication required'
    });
  }

  const data = await AuthService.getAllUserActivities(userDataId);

  return res.status(200).json({
    status: 1,
    message: 'Account activities fetched successfully',
    data: data || []
  });
});
