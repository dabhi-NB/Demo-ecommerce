import { Request, Response, NextFunction } from 'express';
import DeviceModel from '../models/deviceModel';
import Auth from '../models/authModel';

export const updateDeviceActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authToken = req.headers['authorization']?.split(' ')[1];
    if (!authToken) return next();

    const auth = await Auth.findOne({ auth_token: authToken });
    if (!auth) return next();

    await DeviceModel.findOneAndUpdate(
      { user_id: auth.user_id, device_uid: auth.device_uid },
      { last_activity: new Date() }
    );

    next();
  } catch (error) {
    console.error('Device activity update error:', error);
    next();
  }
};
