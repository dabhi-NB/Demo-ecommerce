import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/userModel';
import Auth from '../models/authModel';
import Activity from '../models/userActivityModel';
import Device from '../models/deviceModel';
import Mail from '../models/userSendMailModel';
import Order from '../models/orderModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { encryptPassword } from "../utils/encryption";
import Admin from '../models/adminModel';
import { GeneralHelper } from '../utils/general';
import { AuthService } from '../services/authService';


// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authToken = req.headers['auth-token'] as string;

  await Auth.findOneAndDelete({ auth_token: authToken });

  res.json({ status: 1, message: 'Logged out successfully' });
});

// Refresh auth token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const authToken = req.headers['auth-token'] as string;
  const authDoc = await Auth.findOne({ auth_token: authToken });

  if (!authDoc) {
    return res.status(401).json({ status: 0, message: 'Invalid token' });
  }

  // Extend token expiry by 30 days
  authDoc.auth_token_expire_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  authDoc.updated_at = new Date();
  await authDoc.save();

  res.json({ status: 1, message: 'Token refreshed successfully' });
});

// Get user sessions
export const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (global as any).user_id;

  const sessions = await Auth.find({ user_id: userId })
    .select('device_uid client ip created_at auth_token_expire_at')
    .sort({ updated_at: -1 });

  res.json({ status: 1, data: sessions });
});

// Delete specific session
export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = (global as any).user_id;
  const { sessionId } = req.params;

  const result = await Auth.findOneAndDelete({
    _id: sessionId,
    user_id: userId
  });

  if (!result) {
    return res.status(404).json({ status: 0, message: 'Session not found' });
  }

  res.json({ status: 1, message: 'Session deleted successfully' });
});


// Get all users (Admin)
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find()
    .select('-password -otp -totp_secret_key -totp_backup_code')
    .sort({ created_at: -1 });

  res.json({
    status: 1,
    data: users,
  });
});

//getUserById  
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 0,
        message: 'User ID is required',
      });
    }

    const user = await User.findById(id).lean(); // 🔥 IMPORTANT

    if (!user) {
      return res.status(404).json({
        status: 0,
        message: 'User not found',
      });
    }

    return res.json({
      status: 1,
      data: user,
    });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({
      status: 0,
      message: 'Server error',
    });
  }
};


export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      country,
      role,
      status,
    } = req.body;

    const image = req.file?.filename; // ✅ filename only

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ status: 0, message: 'Missing required fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ status: 0, message: 'Email already exists' });
    }

    const hashedPassword = await encryptPassword(password);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone,
      country,
      role,
      status,
      image, // ✅ best practice
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      status: 1,
      message: 'User created successfully',
      data: userObj,
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ status: 0, message: 'Failed to create user' });
  }
};

export const saveUser = async (req: Request, res: Response) => {
  try {
    const { id, first_name, last_name, email, phone, country, status, role, password } = req.body;
    const file = req.file;

    if (!id) {
      return res.status(400).json({ status: 0, message: 'User ID is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }

    // Update fields
    user.first_name = first_name ?? user.first_name;
    user.last_name = last_name ?? user.last_name;
    user.email = email ?? user.email;
    user.phone = phone ?? user.phone;
    user.country = country ?? user.country;
    user.status = status !== undefined ? Number(status) : user.status;
    user.role = role ?? user.role;

    if (password) {
      user.password = await encryptPassword(password); // hash new password
    }

    if (file) {
      // Delete old image if exists
      if (user.image) {
        const { deleteFile } = await import('../utils/fileUpload');
        deleteFile('user_profile', user.image);
      }
      user.image = file.filename; // save uploaded image filename
      // Note: User images are now stored in upload/user_profile/ folder
    }

    user.updated_at = new Date();

    await user.save();

    const userObj = user.toObject();
    delete userObj.password; // hide password

    return res.json({ status: 1, message: 'User updated successfully', data: userObj });

  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ status: 0, message: 'Failed to update user' });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, message: 'Invalid User ID' });
    }

    const userId = new mongoose.Types.ObjectId(id);

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }

    const devices = await Auth.find({ user_id: userId }) // where('user_id', $id)
      .sort({ updated_at: -1 })         // orderBy('updated_at', 'desc')
      .limit(10)                        // limit(10)
      .lean();
    const activity = await Activity
      .find({ user_id: userId })        // where('user_id', $id)
      .sort({ created_at: -1 })         // orderBy('created_at', 'desc')
      .limit(10)                        // limit(10)
      .lean();                          // get()


    const mails = await Mail.find({ user_id: userId })
      .sort({ created_at: -1 })         // orderBy('created_at', 'desc')
      .lean();

    return res.json({
      status: 1,
      data: {
        user,
        devices,
        activity,
        mails,
      },
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    return res.status(500).json({ status: 0, message: 'Server error' });
  }
};

// Delete user (Admin only) - Permanent delete
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return res.status(404).json({
      status: 0,
      message: 'User not found',
    });
  }

  // Also remove user sessions, devices, activities
  await Auth.deleteMany({ user_id: id });
  await Device.deleteMany({ user_id: id });
  await Activity.deleteMany({ user_id: id });

  return res.json({
    status: 1,
    message: 'User and associated data deleted successfully',
  });

});


export const sendUserMail = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, message } = req.body;

  // Validate request
  if (!to || !subject || !message) {
    return res.status(400).json({
      status: 0,
      message: 'to, subject, and message are required',
    });
  }

  // 1️⃣ Send email
  const emailResult = await GeneralHelper.sendEmail(to, 'send_mail', { subject, message });

  if (emailResult.status === 0) {
    return res.status(500).json({
      status: 0,
      message: `Failed to send email: ${emailResult.message}`,
    });
  }

  // 2️⃣ Store email in DB
  const recipient = await User.findOne({ email: to });
  const mail = new Mail({
    user_id: recipient ? recipient._id : null,
    to_user: to,
    subject,
    message,              // This is the actual email content
    created_at: new Date(),
    updated_at: new Date(),
  });

  await mail.save();

  // 3️⃣ Respond
  return res.json({
    status: 1,
    message: 'Email sent and saved successfully', // ✅ API success message
    data: {
      mail_id: mail._id,
      to_user: mail.to_user,
      subject: mail.subject,
      email_content: mail.message,
      created_at: mail.created_at,
      message: 'Email sent and saved successfully', // optional duplicate for frontend
    },
  });
});

// Auto login as user (Admin only)
export const autoLogin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'User ID is required' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  // Generate auth token for the user
  const authToken = require('crypto').randomBytes(32).toString('hex');
  const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Create auth record
  const auth = new Auth({
    user_id: user._id,
    auth_token: authToken,
    auth_token_expire_at: expireAt,
    client: req.headers['user-agent'] || 'Admin Auto Login',
    ip: req.ip || req.connection.remoteAddress,
    device_uid: `admin_auto_${Date.now()}`,
    type: 0, // Web
  });

  await auth.save();

  return res.json({
    status: 1,
    message: 'Auto login successful',
    data: {
      auth_token: authToken,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    },
  });
});

// Send TFA mail to user (Admin only)
export const sendTfaMail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ status: 0, message: 'User ID is required' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  // Generate OTP for user
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes

  // Save OTP in user
  user.otp = `${otp}_${expiresAt}`;
  user.otp_failed = 0;
  user.updated_at = new Date();
  await user.save();

  // Send OTP via email
  await GeneralHelper.sendEmail(user.email!, 'otp', {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    otp,
    message: 'Verify your account',
  });

  return res.json({
    status: 1,
    message: 'TFA mail sent successfully',
  });
});

// Get user devices (Admin only)
export const getUserDevices = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  const userIdObj = new mongoose.Types.ObjectId(userId);
  const result = await AuthService.getActiveDevices(userIdObj);

  return res.status(result.http_status).json({
    status: result.status,
    message: result.message,
    data: result.data || []
  });
});

// Get user activity (Admin only)
export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  const userIdObj = new mongoose.Types.ObjectId(userId);
  const data = await AuthService.getAllUserActivities(userIdObj);

  return res.status(data.http_status).json({
    status: data.status,
    message: data.message,
    data: data.data || []
  });
});

// Get user mails (Admin only)
export const getUserMails = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  const userIdObj = new mongoose.Types.ObjectId(userId);

  const mails = await Mail.find({ user_id: userIdObj })
    .sort({ created_at: -1 })
    .lean();

  return res.json({
    status: 1,
    data: mails,
  });
});

// Get user addresses (Admin only) - from user model
export const getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  const user = await User.findById(userId).select('addresses').lean();

  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  const addresses = user.addresses || [];

  return res.json({
    status: 1,
    data: addresses,
  });
});

// Create user address (Admin only)
export const createUserAddress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  // Validate required fields
  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ status: 0, message: 'Missing required fields' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  // If setting this address as default, unset all other addresses
  if (isDefault === true) {
    user.addresses?.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // Add new address
  const newAddress = {
    fullName,
    phone,
    addressLine1,
    addressLine2: addressLine2 || '',
    city,
    state,
    pincode,
    country: country || 'India',
    isDefault: isDefault || false,
  };

  if (!user.addresses) {
    user.addresses = [];
  }
  user.addresses.push(newAddress as any);

  user.updated_at = new Date();
  await user.save();

  return res.status(201).json({
    status: 1,
    message: 'Address created successfully',
    data: user.addresses,
  });
});

// Update user address (Admin only)
export const updateUserAddress = asyncHandler(async (req: Request, res: Response) => {
  const { userId, addressId } = req.params;
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ status: 0, message: 'Invalid Address ID' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  // Find the address index
  const addressIndex = user.addresses?.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1 || addressIndex === undefined) {
    return res.status(404).json({ status: 0, message: 'Address not found' });
  }

  // If setting this address as default, unset all other addresses
  if (isDefault === true) {
    user.addresses?.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // Update the address
  if (user.addresses && user.addresses[addressIndex]) {
    user.addresses[addressIndex].fullName = fullName || user.addresses[addressIndex].fullName;
    user.addresses[addressIndex].phone = phone || user.addresses[addressIndex].phone;
    user.addresses[addressIndex].addressLine1 = addressLine1 || user.addresses[addressIndex].addressLine1;
    user.addresses[addressIndex].addressLine2 = addressLine2 !== undefined ? addressLine2 : user.addresses[addressIndex].addressLine2;
    user.addresses[addressIndex].city = city || user.addresses[addressIndex].city;
    user.addresses[addressIndex].state = state || user.addresses[addressIndex].state;
    user.addresses[addressIndex].pincode = pincode || user.addresses[addressIndex].pincode;
    user.addresses[addressIndex].country = country || user.addresses[addressIndex].country;
    user.addresses[addressIndex].isDefault = isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault;
  }

  user.updated_at = new Date();
  await user.save();

  return res.json({
    status: 1,
    message: 'Address updated successfully',
    data: user.addresses,
  });
});

// Delete user address (Admin only)
export const deleteUserAddress = asyncHandler(async (req: Request, res: Response) => {
  const { userId, addressId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: 0, message: 'Invalid User ID' });
  }

  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
    return res.status(400).json({ status: 0, message: 'Invalid Address ID' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ status: 0, message: 'User not found' });
  }

  // Find the address index
  const addressIndex = user.addresses?.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1 || addressIndex === undefined) {
    return res.status(404).json({ status: 0, message: 'Address not found' });
  }

  // Remove the address
  user.addresses?.splice(addressIndex, 1);

  user.updated_at = new Date();
  await user.save();

  return res.json({
    status: 1,
    message: 'Address deleted successfully',
    data: user.addresses,
  });
});




