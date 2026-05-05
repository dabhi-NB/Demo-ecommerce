import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  ShoppingBag,
  IndianRupee,
  Clock,
  Package,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getdashboard } from "@/services/dashboard";
import {
  UserDonutChart,
  UserChart,
  OrderDonutChart,
  RevenueChart,
} from "../site/userchart";

type UserSummary = {
  total: number;
  active: number;
  inactive: number;
};

type EcommerceStats = {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: { name: string; stock: number }[];
};

function useCountUp(target: number | undefined, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const targetRef = useRef<number>(0);

  useEffect(() => {
    setCount(0);
    targetRef.current = typeof target === "number" ? target : 0;

    if (typeof target !== "number") return;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * targetRef.current));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setCount(targetRef.current);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return count;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
  iconBg: string;
}

function StatCard({
  title,
  value,
  icon,
  trend,
  gradient,
  iconBg,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 group border border-gray-100 dark:border-gray-700">
      <div className={`absolute inset-0 opacity-5 ${gradient}`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-2xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? "text-emerald-600" : "text-rose-600"}`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
      <div
        className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${gradient}`}
      />
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [ecommerce, setEcommerce] = useState<EcommerceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "month" | "year">("year");

  useEffect(() => {
    setLoading(true);
    setError(null);

    getdashboard()
      .then((data: any) => {
        console.log("Dashboard data:", data);
        setSummary({
          total: data.total ?? 0,
          active: data.active ?? 0,
          inactive: data.inactive ?? 0,
        });
        setEcommerce(
          data.ecommerce || {
            totalOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            totalProducts: 0,
            lowStockProducts: [],
          },
        );
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error("Dashboard error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalCount = useCountUp(summary?.total ?? 0);
  const activeCount = useCountUp(summary?.active ?? 0);
  const inactiveCount = useCountUp(summary?.inactive ?? 0);
  const totalOrdersCount = useCountUp(ecommerce?.totalOrders ?? 0);
  const completedOrdersCount = useCountUp(ecommerce?.completedOrders ?? 0);
  const totalRevenueCount = useCountUp(ecommerce?.totalRevenue ?? 0);
  const pendingOrdersCount = useCountUp(ecommerce?.pendingOrders ?? 0);
  const totalProductsCount = useCountUp(ecommerce?.totalProducts ?? 0);

  // Calculate completion rate
  const completionRate = ecommerce?.totalOrders
    ? Math.round((ecommerce.completedOrders / ecommerce.totalOrders) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium">
            Error loading dashboard
          </p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={totalCount}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
        />
        <StatCard
          title="Active Users"
          value={activeCount}
          icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Inactive Users"
          value={inactiveCount}
          icon={<UserX className="w-6 h-6 text-rose-600" />}
          gradient="bg-gradient-to-br from-rose-500 to-orange-600"
          iconBg="bg-rose-100 dark:bg-rose-900/30"
        />
      </div>

      {/* E-commerce Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Orders"
          value={totalOrdersCount}
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Completed"
          value={completedOrdersCount}
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          gradient="bg-gradient-to-br from-emerald-500 to-green-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenueCount.toLocaleString()}`}
          icon={<IndianRupee className="w-6 h-6 text-amber-600" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrdersCount}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard
          title="Total Products"
          value={totalProductsCount}
          icon={<Package className="w-6 h-6 text-purple-600" />}
          gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* User Charts */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              User Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <UserDonutChart active={activeCount} inactive={inactiveCount} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
            <select
              className="text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as "day" | "month" | "year")
              }
            >
              <option value="day">Last 7 Days</option>
              <option value="month">Last 6 Months</option>
              <option value="year">Last 12 Months</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <UserChart period={period} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order & Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <OrderDonutChart />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <RevenueChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {ecommerce &&
        ecommerce.lowStockProducts &&
        ecommerce.lowStockProducts.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full" />
                  Low Stock Alert
                </CardTitle>
                <a
                  href="/admin/products?stock=low"
                  className="text-sm text-amber-600 hover:text-amber-700 hover:underline"
                >
                  View All →
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-amber-200/50 dark:border-amber-800">
                      <th className="pb-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Product
                      </th>
                      <th className="pb-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Stock
                      </th>
                      <th className="pb-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecommerce.lowStockProducts
                      .slice(0, 5)
                      .map((product, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <td className="py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </td>
                          <td className="py-3 text-right text-sm font-mono text-amber-600">
                            {product.stock}
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Low Stock
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm">Order Completion Rate</p>
                <p className="text-3xl font-bold mt-1">{completionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm">Avg. Order Value</p>
                <p className="text-3xl font-bold mt-1">
                  ₹
                  {ecommerce?.totalOrders
                    ? Math.round(
                        ecommerce.totalRevenue / ecommerce.totalOrders,
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-emerald-200 text-sm mt-4">Per order</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-cyan-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Products Listed</p>
                <p className="text-3xl font-bold mt-1">{totalProductsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-blue-200 text-sm mt-4">Active listings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
