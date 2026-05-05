import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Auth from '../models/authModel';
import Activity from '../models/userActivityModel';
import Device from '../models/deviceModel';
import Mail from '../models/userSendMailModel';
import { asyncHandler } from '../middlewares/asyncHandler';
import { encryptPassword } from "../utils/encryption";
import Admin from '../models/adminModel';
import { PermissionService } from '../services/permissionService';
import { GeneralHelper } from '../utils/general';


// Get all admins (Admin) 
export const getAllAdmins = asyncHandler(async (req: Request, res: Response) => {
  const admins = await Admin.find({ deleted_at: null })
    .select('-password -otp -totp_secret_key -totp_backup_code')
    .sort({ created_at: -1 });

  res.json({
    status: 1,
    data: admins,
  });
});

//getUserById  
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 0,
        message: 'Admin ID is required',
      });
    }

    const admin = await Admin.findById(id).lean(); // 🔥 IMPORTANT

    if (!admin) {
      return res.status(404).json({
        status: 0,
        message: 'Admin not found',
      });
    }

    return res.json({
      status: 1,
      data: admin,
    });
  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({
      status: 0,
      message: 'Server error',
    });
  }
};


export const createAdmin = async (req: Request, res: Response) => {
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
      permission,
    } = req.body;

    const image = req.file?.filename; // ✅ filename only

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ status: 0, message: 'Missing required fields' });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ status: 0, message: 'Email already exists' });
    }

    const hashedPassword = await encryptPassword(password);

    const admin = await Admin.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone,
      country,
      role,
      status,
      permission: permission ? (Array.isArray(permission) ? permission.join(',') : permission) : '',
      image, // ✅ best practice
    });

    const adminObj = admin.toObject();
    delete adminObj.password;

    res.status(201).json({
      status: 1,
      message: 'Admin created successfully',
      data: adminObj,
    });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ status: 0, message: 'Failed to create admin' });
  }
};

export const saveAdmin = async (req: Request, res: Response) => {
  try {
    const { id, first_name, last_name, email, phone, country, status, role, password, permission } = req.body;
    const file = req.file;

    if (!id) {
      return res.status(400).json({ status: 0, message: 'Admin ID is required' });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ status: 0, message: 'Admin not found' });
    }

    // Update fields
    admin.first_name = first_name ?? admin.first_name;
    admin.last_name = last_name ?? admin.last_name;
    admin.email = email ?? admin.email;
    admin.phone = phone ?? admin.phone;
    admin.country = country ?? admin.country;
    admin.status = status !== undefined ? Number(status) : admin.status;
    admin.role = role ?? admin.role;
    admin.permission = permission ? (Array.isArray(permission) ? permission.join(',') : permission) : admin.permission;

    if (password) {
      admin.password = await encryptPassword(password); // hash new password
    }

    if (file) {
      // Delete old image if exists
      if (admin.image) {
        const { deleteFile } = await import('../utils/fileUpload');
        deleteFile('profile', admin.image);
      }
      admin.image = file.filename; // save uploaded image filename
    }

    admin.updated_at = new Date();

    await admin.save();

    const adminObj = admin.toObject();
    delete adminObj.password; // hide password

    return res.json({ status: 1, message: 'Admin updated successfully', data: adminObj });

  } catch (err) {
    console.error('Error updating admin:', err);
    return res.status(500).json({ status: 0, message: 'Failed to update admin' });
  }
};

export const getAdminDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: 0, message: 'Invalid Admin ID' });
    }

    const userId = new mongoose.Types.ObjectId(id);

    const admin = await Admin.findById(userId).lean();
    if (!admin) {
      return res.status(404).json({ status: 0, message: 'Admin not found' });
    }

    const devices = await Device.find({ user_id: userId }) // where('user_id', $id)
      .lean();
    const activity = await Activity
      .find({ user_id: userId })        // where('user_id', $id)
      .lean();                          // get()




    return res.json({
      status: 1,
      data: {
        admin,
        devices,
        activity,

      },
    });
  } catch (err) {
    console.error('Error fetching admin details:', err);
    return res.status(500).json({ status: 0, message: 'Server error' });
  }
};

// Get permission list data for frontend
export const getPermissionListData = asyncHandler(async (req: Request, res: Response) => {
  const permissionData = PermissionService.getPermissionListData();

  res.json({
    status: 1,
    data: permissionData,
  });
});

// Delete (Admin only)
export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      status: 0,
      message: 'Invalid admin ID',
    });
  }


  const admin = await Admin.findByIdAndDelete(id);

  if (!admin) {
    return res.status(404).json({
      status: 0,
      message: 'Admin not found',
    });
  }

  // Cascade delete associated data
  await Device.deleteMany({ user_id: id });
  await Activity.deleteMany({ user_id: id });
  await Auth.deleteMany({ user_id: id });

  return res.json({
    status: 1,
    message: 'Admin and associated data deleted successfully',
  });

});




