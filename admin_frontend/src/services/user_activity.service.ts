import { Ajax } from '@/helper/ajax';

export type UserActivity = {
  _id: string;
  user_id: string;
  type: number;
  device_id: string;
  ip: string;
  client: string;
  id: string;
  created_at: string;
  name: string;
  email: string;
  location: string;


};

export const getUserActivities = async (): Promise<UserActivity[]> => {
  const response = await Ajax.get('admin/user-activity');
  return response.data || [];
};

