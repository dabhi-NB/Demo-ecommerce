import { subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';
import User from '../models/userModel';
import Order from '../models/orderModel';

type ChartType = 'week' | '6months' | '12months';

interface ChartResult {
  label: string[];
  data: number[];
}

export class ChartService {
  static async getUserChartData(type: ChartType): Promise<ChartResult> {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();
    const periods: { start: Date; end: Date }[] = [];
    let startDate: Date = today;

    if (type === 'week') {
      labels.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

      const todayDay = today.getDay(); // 0=Sun
      const diffToMonday = todayDay === 0 ? 6 : todayDay - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        periods.push({ start: d, end: d });
      }

      startDate = periods[0].start;

    } else if (type === '6months' || type === '12months') {
      const count = type === '6months' ? 6 : 12;

      for (let i = count - 1; i >= 0; i--) {
        const d = subMonths(today, i);
        labels.push(d.toLocaleString('default', { month: 'short' }));
        periods.push({
          start: startOfMonth(d),
          end: endOfMonth(d),
        });
      }

      startDate = periods[0].start;
    }

    // AGGREGATION
    const aggregation: Array<{ _id: any; total: number }> =
      await User.aggregate([
        {
          $match: {
            created_at: { $gte: startDate, $lte: today },
          },
        },
        {
          $group: {
            _id:
              type === 'week'
                ? {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$created_at',
                      timezone: 'Asia/Calcutta',
                    },
                  }
                : {
                    year: {
                      $year: {
                        date: '$created_at',
                        timezone: 'Asia/Calcutta',
                      },
                    },
                    month: {
                      $month: {
                        date: '$created_at',
                        timezone: 'Asia/Calcutta',
                      },
                    },
                  },
            total: { $sum: 1 },
          },
        },
      ]);

    // MAP DATA
    periods.forEach((p, index) => {
      let value = 0;

      if (type === 'week') {
        const key = p.start.toISOString().split('T')[0];
        const found = aggregation.find((a: any) => a._id === key);
        value = found ? found.total : 0;
      } else {
        const found = aggregation.find(
          (a: any) =>
            a._id.year === p.start.getFullYear() &&
            a._id.month === p.start.getMonth() + 1
        );
        value = found ? found.total : 0;
      }

      data.push(value);
    });

    // IMPORTANT: return { label, data }
    return { label: labels, data };
  }

  // Optional: Backward compatibility methods
  static async getUserLast7DaysChartData(): Promise<ChartResult> {
    return this.getUserChartData('week');
  }

  static async getUserLast6MonthsChartData(): Promise<ChartResult> {
    return this.getUserChartData('6months');
  }

  static async getUserMonthlyChartData(): Promise<ChartResult> {
    return this.getUserChartData('12months');
  }

  // Get order status distribution for donut chart
  static async getOrderStatusChartData(): Promise<ChartResult> {
    const labels: string[] = [];
    const data: number[] = [];

    const statusGroups = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Define order of status for consistent colors
    const statusOrder = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    
    statusOrder.forEach((status) => {
      const found = statusGroups.find((s: any) => s._id === status);
      if (found && found.count > 0) {
        labels.push(status);
        data.push(found.count);
      }
    });

    return { label: labels, data };
  }

  // Get revenue chart data for last 12 months
  static async getRevenueChartData(): Promise<ChartResult> {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();

    // Generate last 12 months labels
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(today, i);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }

    // Get revenue by month
    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: subMonths(today, 11) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: { date: '$createdAt', timezone: 'Asia/Calcutta' } },
            month: { $month: { date: '$createdAt', timezone: 'Asia/Calcutta' } },
          },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Map revenue to labels
    labels.forEach((_, idx) => {
      const d = subMonths(today, 11 - idx);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const found = revenueData.find((r: any) => r._id.year === year && r._id.month === month);
      data.push(found ? found.revenue : 0);
    });

    return { label: labels, data };
  }
}
