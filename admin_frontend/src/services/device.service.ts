import { Ajax } from '@/helper/ajax';

export type Device = {
  _id: string;
  device_uid: string;
  user_id: string;
  client: string;
  created_at: string;
  id: string;
  ip: string;
  is_current_device: boolean;
  last_activity: string;
  last_login_at: string;
  location: string;
  name: string;
  email: string;
  updated_at: string;

};

export const getDevices = async (): Promise<Device[]> => {
  const response = await Ajax.get('admin/device');
  return response.data || [];
};



export const logoutDevice = async (deviceId: string): Promise<any> => {
  const response = await Ajax.post('admin/device/logout', { deviceId });
  return response;
};


