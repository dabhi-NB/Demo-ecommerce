import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getUserChartData,
  getOrderStatusChartData,
  getRevenueChartData,
} from "@/services/dashboard";
type Period = "day" | "month" | "year";

interface UserChartProps {
  period: Period;
}

type UserDonutChartProps = {
  active: number;
  inactive: number;
};

const COLORS = ["currentColor", "var(--tw-color-muted, #6b7280)"];

const ORDER_STATUS_COLORS: Record<string, string> = {
  placed: "var(--chart-1)",
  confirmed: "var(--chart-2)",
  processing: "var(--chart-3)",
  shipped: "var(--chart-4)",
  delivered: "var(--chart-5)",
  cancelled: "var(--color-destructive)",
  returned: "var(--chart-6)",
};

export function UserDonutChart({ active, inactive }: UserDonutChartProps) {
  const data = [
    { name: "Active", value: active },
    { name: "Inactive", value: inactive },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={false}
        >
          <Cell fill={COLORS[0]} />
          <Cell fill={COLORS[1]} />
        </Pie>
        <Tooltip wrapperStyle={{ fontSize: 10 }} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconSize={8}
          fontSize={11}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OrderDonutChart() {
  const [data, setData] = useState<{ label: string[]; data: number[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getOrderStatusChartData()
      .then((res: { label: string[]; data: number[] }) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading chart...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  const chartData =
    data?.label.map((lbl: string, idx: number) => ({
      name: lbl.charAt(0).toUpperCase() + lbl.slice(1),
      value: data.data[idx] ?? 0,
    })) ?? [];

  const colors = chartData.map(
    (d: { name: string }) =>
      ORDER_STATUS_COLORS[d.name.toLowerCase()] || "var(--chart-1)",
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={false}
        >
          {chartData.map((_: any, index: number) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconSize={8}
          fontSize={11}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart() {
  const [data, setData] = useState<{ label: string[]; data: number[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getRevenueChartData()
      .then((res: { label: string[]; data: number[] }) => {
        setData(res);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const chartData =
    data?.label.map((lbl: string, idx: number) => ({
      label: lbl,
      revenue: data.data[idx] ?? 0,
    })) ?? [];

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading chart...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis
          tickFormatter={(value: number) =>
            `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`
          }
        />
        <Tooltip
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: unknown) => {
            const num = typeof value === "number" ? value : 0;
            return [`₹${num.toLocaleString()}`, "Revenue"];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function UserChart({ period }: UserChartProps) {
  const [data, setData] = useState<{ labels: string[]; data: number[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getUserChartData(period)
      .then((res: { label: string[]; data: number[] }) => {
        let labels = Array.isArray(res.label) ? res.label : [];
        let values = Array.isArray(res.data) ? res.data : [];

        if (period === "day") {
          const today = new Date();
          const dayLabels: string[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
            dayLabels.push(weekday);
          }
          labels = dayLabels;
          values = new Array(7).fill(0);
          if (Array.isArray(res.label) && Array.isArray(res.data)) {
            res.label.forEach((_: string, idx: number) => {
              values[7 - res.label.length + idx] = res.data[idx];
            });
          }
        } else if (period === "month" && labels.length > 6) {
          labels = labels.slice(-6);
          values = values.slice(-6);
        } else if (period === "year" && labels.length > 12) {
          labels = labels.slice(-12);
          values = values.slice(-12);
        }

        setData({ labels, data: values });
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [period]);

  const chartData =
    data?.labels.map((label, idx) => ({
      label,
      newUsers: data.data[idx] ?? 0,
    })) ?? [];

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading chart...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis />
        <Tooltip wrapperStyle={{ fontSize: 12 }} />
        <Legend />
        <Line
          type="monotone"
          dataKey="newUsers"
          name="New Users"
          stroke="currentColor"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
