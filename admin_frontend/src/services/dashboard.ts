import { Ajax } from '../helper/ajax';

export type UserSummary = {
  total: number;
  active: number;
  inactive: number;
};

export const getdashboard = async (): Promise<any> => {
  const data = await Ajax.get('admin/dashboard');

  // Filter out deleted users if the API returns user list
  let total = data.totalUsers;
  let active = data.activeUsers;
  let inactive = data.inactiveUsers;

  // If the API returns a user list, filter out deleted users
  if (data.users) {
    const activeUsers = data.users.filter((user: any) => !user.deleted_at && user.status === 1);
    const totalUsers = data.users.filter((user: any) => !user.deleted_at);

    total = totalUsers.length;
    active = activeUsers.length;
    inactive = totalUsers.length - activeUsers.length;
  }

  return {
    total,
    active,
    inactive,
    ecommerce: data.ecommerce || null,
  };
};

export type ChartData = {
  label: string[];
  data: number[];
};

export const getUserChartData = async (period: 'day' | 'month' | 'year'): Promise<ChartData> => {
  const postData = { type: period };
  const data = await Ajax.post('admin/site/get-chart-user', postData);
  return data;
};

export const getOrderStatusChartData = async (): Promise<ChartData> => {
  const data = await Ajax.get('admin/site/get-order-status-chart');
  return data;
};

export const getRevenueChartData = async (): Promise<ChartData> => {
  const data = await Ajax.get('admin/site/get-revenue-chart');
  return data;
};





