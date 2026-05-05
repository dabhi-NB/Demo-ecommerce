import { Request, Response } from "express";
import { AccountService } from "../services/accountService";
import { AuthService } from "../services/authService";
import { changePasswordSchema } from "../validators/authValidator";
import { asyncHandler } from "../middlewares/asyncHandler";
import { accountUpdateSchema } from "../validators/accountValidator";
import DeviceModel from "../models/deviceModel";
import { GeneralHelper } from "../utils/generalHelper";
import User from "../models/userModel";
import Auth from "../models/authModel";
import { delCache } from "../utils/cache";

interface MulterRequest extends Request {
  file: any;
}
interface ApiResponse {
  status: number;
  message: string;
  data: any;
  next?: "redirect" | "reload" | "refresh";
  url?: string;
}

const formatResponse = (response: any): ApiResponse => ({
  status: response.status,
  message: response.message,
  data: response.data || [],
  next: response.next,
  url: response.url,
});

export const viewAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id || (req.query.userId as string);

  if (!userId) {
    return res.status(400).json({
      status: 0,
      message: "User ID is required",
      data: [],
    });
  }

  const result = await AccountService.getProfile(userId);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const passwordChange = asyncHandler(
  async (req: Request, res: Response) => {

    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        message: error.details[0].message,
        data: [],
      });
    }

    const userId = req.user_id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        status: 0,
        message: "User ID is required",
        data: [],
      });
    }

    const result = await AccountService.changePassword(req, userId, req.body);
    res.status(result.http_status ?? 200).json(formatResponse(result));
  },
);

export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const mReq = req as MulterRequest;
  const userId = req.user_id || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: 0,
      message: "User ID is required",
      data: [],
    });
  }

  if (!mReq.file) {
    return res.status(400).json({
      status: 0,
      message: "Image file is required",
      data: [],
    });
  }

  const result = await AccountService.updateImage(userId, mReq.file.path);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: 0,
      message: "User ID is required",
      data: [],
    });
  }

  const result = await AccountService.deleteImage(userId);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const getUserSessions = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;

    if (!userId) {
      return res.status(400).json({
        status: 0,
        message: "User ID is required",
        data: [],
      });
    }

    const result = await AccountService.getUserSessions(userId);
    res.status(result.http_status ?? 200).json(formatResponse(result));
  },
);

export const deleteSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: 0,
        message: "User ID is required",
        data: [],
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        status: 0,
        message: "Session ID is required",
        data: [],
      });
    }

    const result = await AccountService.logoutSession(userId, sessionId);
    res.status(result.http_status ?? 200).json(formatResponse(result));
  },
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authToken = req.headers["auth-token"] as string;

    if (!authToken) {
      return res.status(401).json({
        status: 0,
        message: "Auth token is required",
        data: [],
      });
    }

    const result = await AuthService.refreshToken(authToken);
    res.status(result.http_status ?? 200).json(formatResponse(result));
  },
);

export const userActivityList = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;

    if (!userId) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized",
        data: [],
      });
    }

    const result = await AccountService.getUserActivityList(userId, req.body);

    return res.status(200).json(result);
  },
);

export const deviceList = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id;

  if (!userId) {
    return res.status(401).json({
      draw: 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
    });
  }

  const draw = Number(req.body.draw || 1);
  const start = Number(req.body.start || 0);
  const length = Number(req.body.length || 10);
  const search = req.body.search?.value?.trim() || "";

  const match: any = { user_id: userId };
  if (search.length > 2) {
    match.$or = [
      { client: { $regex: search, $options: "i" } },
      { ip: { $regex: search, $options: "i" } },
    ];
  }

  const recordsTotal = await DeviceModel.countDocuments({ user_id: userId });
  const recordsFiltered = await DeviceModel.countDocuments(match);

  const devices = await DeviceModel.find(match)
    .sort({ updated_at: -1 })
    .skip(start)
    .limit(length)
    .lean();

  const data = await Promise.all(
    devices.map(async (row, index) => {
      const location = await GeneralHelper.getIpLocation(row.ip);

      return {
        id: row.id,
        client:
          GeneralHelper.deviceName(row.client) +
          (row.device_uid === req.cookies?.[`${process.env.APP_UID}_token`]
            ? " (This Device)"
            : ""),
        ip: row.ip,
        location,
        last_activity: GeneralHelper.dateFormat(row.updated_at, true),
        action:
          row.device_uid === req.cookies?.[`${process.env.APP_UID}_token`]
            ? ""
            : "logout",
      };
    }),
  );

  return res.json({
    draw,
    recordsTotal,
    recordsFiltered,
    data,
  });
});

export const updateAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const { error } = accountUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        message: error.details[0].message,
        data: [],
      });
    }
    const userId = req.user_id || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        status: 0,
        message: "User ID is required",
        data: [],
      });
    }
    const result = await AccountService.updateAccount(userId, req.body);
    res.status(result.http_status ?? 200).json(formatResponse(result));
  },
);

export const deviceLogout = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;
    const { device_id } = req.body;

    if (!userId || !device_id) {
      return res.status(400).json({
        status: 0,
        message: "Device ID required",
      });
    }

    const result = await AccountService.logoutDevice(userId, device_id);
    return res.status(200).json(result);
  },
);

export const deleteAccount = asyncHandler(async (req: any, res: any) => {
  const userId = req.user_id;

  if (!userId) {
    return res.status(401).json({
      status: 0,
      message: "Unauthorized",
    });
  }

  const result = await AccountService.deactivateAccount(userId);

  return res.status(result.http_status ?? 200).json(formatResponse(result));
});

export const getProfile = viewAccount;

export const tfa = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id;

  if (!userId) {
    return res.status(401).json({
      status: 0,
      message: "Unauthorized",
      data: [],
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: 0,
      message: "User not found",
      data: [],
    });
  }

  let userAuthList: any[] = [];
  if (user.ignore_tfa_device) {
    const ignoredDevices = user.ignore_tfa_device.split(',').map(entry => entry.split('_')[0]);
    const authRecords = await Auth.find({
      device_uid: { $in: ignoredDevices },
      user_id: userId,
    });
    userAuthList = await Promise.all(
      authRecords.map(async (auth) => {
        const client =
          GeneralHelper.deviceName(auth.client) +
          (auth.device_uid === req.authData.device_uid ? " (This Device)" : "");
        const location = await GeneralHelper.getIpLocation(auth.ip);
        return {
          ...auth.toObject(),
          client,
          location,
        };
      }),
    );
  }

  const currentDeviceIgnored = user.ignore_tfa_device
    ? user.ignore_tfa_device.split(',').some(entry => entry.startsWith(`${req.authData.device_uid}_`))
    : false;

  res.json({
    status: 1,
    message: "TFA settings retrieved",
    data: {
      status_tfa: user.status_tfa,
      userAuthList,
    },
  });
});

export const tfaStatusChange = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;

    if (!userId) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized",
        data: [],
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
        data: [],
      });
    }

    let status_tfa: number;
    if (user.status_tfa === 1) {
      user.status_tfa = 0;
      user.ignore_tfa_device = "";
      status_tfa = 0;
    } else {
      user.status_tfa = 1;
      status_tfa = 1;
    }
    await user.save();

    await delCache(`user:${userId}`);

    res.json({
      status: 1,
      next: "refresh",
      message: status_tfa
        ? "Two Factor Authentication is enabled"
        : "Two Factor Authentication is disabled",
      data: {
        user: {
          status_tfa: status_tfa,
        },
      },
    });
  },
);

export const revokeAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id;

  if (!userId) {
    return res.status(401).json({
      status: 0,
      message: "Unauthorized",
      data: [],
    });
  }

  const result = await AccountService.revokeAll2FADevices(userId);
  res.status(result.http_status ?? 200).json(formatResponse(result));
});

// ========== ADDRESS FUNCTIONS ==========

// Get all addresses
export const getAddresses = asyncHandler(async (req: any, res: any) => {
  const user = await User.findById(req.user_id).select('addresses')

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  return res.status(200).json({
    success: true,
    data: user.addresses || [],
  })
})

// Add new address
export const addAddress = asyncHandler(async (req: any, res: any) => {
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body

  // Validate required fields
  if (!fullName?.trim() || !phone?.trim() || !addressLine1?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
    return res.status(400).json({ success: false, message: 'All required address fields must be provided' })
  }

  // Validate phone (10 digit Indian mobile)
  if (!/^[6-9]\d{9}$/.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number' })
  }

  // Validate pincode
  if (!/^\d{6}$/.test(pincode.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid 6-digit pincode' })
  }

  const user = await User.findById(req.user_id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  // Max 5 addresses
  if (user.addresses && user.addresses.length >= 5) {
    return res.status(400).json({ success: false, message: 'Maximum 5 addresses allowed. Please delete one to add a new address.' })
  }

  const newAddress = {
    fullName: fullName.trim(),
    phone: phone.trim(),
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2?.trim() || undefined,
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    isDefault: Boolean(isDefault),
  }

  // Get current addresses array
  let addresses = user.addresses || []

  // If new address is default, remove default from others
  if (newAddress.isDefault && addresses.length) {
    addresses = addresses.map((addr: any) => ({ ...addr, isDefault: false }))
  }

  // If this is the first address, make it default
  if (addresses.length === 0) {
    newAddress.isDefault = true
  }

  addresses.push(newAddress)

  // Use findOneAndUpdate to bypass validation on other fields
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user_id },
    { $set: { addresses: addresses, updated_at: new Date() } },
    { new: true }
  )

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  return res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: updatedUser.addresses,
  })
})

// Update address
export const updateAddress = asyncHandler(async (req: any, res: any) => {
  const { addressId } = req.params
  const updates = req.body

  const user = await User.findById(req.user_id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  let addresses = user.addresses || []
  const addressIndex = addresses.findIndex((addr: any) => addr._id.toString() === addressId)

  if (addressIndex === -1) {
    return res.status(404).json({ success: false, message: 'Address not found' })
  }

  // If setting as default, unset others
  if (updates.isDefault) {
    addresses = addresses.map((addr: any) => ({ ...addr, isDefault: false }))
  }

  // Update allowed fields
  const allowedFields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'isDefault']
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      (addresses[addressIndex] as any)[field] = updates[field]
    }
  })

  // Use findOneAndUpdate to bypass validation
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user_id },
    { $set: { addresses: addresses, updated_at: new Date() } },
    { new: true }
  )

  return res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: updatedUser?.addresses || [],
  })
})

// Delete address
export const deleteAddress = asyncHandler(async (req: any, res: any) => {
  const { addressId } = req.params

  const user = await User.findById(req.user_id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  let addresses = user.addresses || []
  const addressExists = addresses.some((addr: any) => addr._id.toString() === addressId)
  if (!addressExists) {
    return res.status(404).json({ success: false, message: 'Address not found' })
  }

  const wasDefault = addresses.find((addr: any) => addr._id.toString() === addressId && addr.isDefault)

  // Remove address
  addresses = addresses.filter((addr: any) => addr._id.toString() !== addressId)

  // If deleted address was default, make first remaining address default
  if (wasDefault && addresses.length > 0) {
    addresses[0].isDefault = true
  }

  // Use findOneAndUpdate to bypass validation
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user_id },
    { $set: { addresses: addresses, updated_at: new Date() } },
    { new: true }
  )

  return res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: updatedUser?.addresses || [],
  })
})

// Set default address
export const setDefaultAddress = asyncHandler(async (req: any, res: any) => {
  const { addressId } = req.params

  const user = await User.findById(req.user_id)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  let addresses = user.addresses || []
  const addressExists = addresses.some((addr: any) => addr._id.toString() === addressId)
  if (!addressExists) {
    return res.status(404).json({ success: false, message: 'Address not found' })
  }

  // Set all to false, then set selected to true
  addresses = addresses.map((addr: any) => ({
    ...addr,
    isDefault: addr._id.toString() === addressId
  }))

  // Use findOneAndUpdate to bypass validation
  const updatedUser = await User.findOneAndUpdate(
    { _id: req.user_id },
    { $set: { addresses: addresses, updated_at: new Date() } },
    { new: true }
  )

  return res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: updatedUser?.addresses || [],
  })
})
