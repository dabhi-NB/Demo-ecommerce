import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Eye, Package, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import {
  getOrders,
  getOrderStats,
  ORDERS_QUERY_KEY,
  type Order,
} from "@/services/order.service";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// Status badge colors mapping
const statusColors: Record<
  string,
  "default" | "success" | "destructive" | "secondary" | "outline" | null
> = {
  placed: "default",
  confirmed: "outline",
  processing: "default",
  shipped: "secondary",
  delivered: "success",
  cancelled: "destructive",
  returned: "secondary",
};

// Status labels
const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

// Payment status badge
function PaymentStatusBadge({
  method,
  status,
}: {
  method: string;
  status: string;
}) {
  const isPaid = status === "paid";
  const isCod = method === "cod";

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={isCod ? "outline" : "default"}>
        {isCod ? "COD" : "Online"}
      </Badge>
      <Badge
        variant={
          isPaid ? "success" : status === "pending" ? "default" : "destructive"
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    </div>
  );
}

// Status badge
function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusColors[status] || "default"}>
      {statusLabels[status] || status}
    </Badge>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const queryParams = {
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    paymentMethod: paymentMethodFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [ORDERS_QUERY_KEY, queryParams],
    queryFn: () => getOrders(queryParams),
  });

  const { data: orderStats } = useQuery({
    queryKey: ["order-stats"],
    queryFn: getOrderStats,
  });

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.total || 0;

  const handleView = useCallback(
    (id: string) => {
      navigate(`/admin/orders/view/${id}`);
    },
    [navigate],
  );

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch orders"
    : null;

  // Check if user has any order permission
  const hasAnyOrderPermission =
    hasPermission("admin/orders") || hasPermission("admin/orders/view");

  const columnDefs = useMemo(() => {
    const columns: ColDef<Order>[] = [
      {
        headerName: "#",
        width: 60,
        valueGetter: (params: any) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : "";
        },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Order Number",
        field: "orderNumber",
        cellRenderer: (params: any) => (
          <Link
            to={`/admin/orders/view/${params.data.id}`}
            className="font-mono text-blue-600 hover:underline"
          >
            {params.value}
          </Link>
        ),
      },
      {
        headerName: "Customer",

        cellRenderer: (params: any) => {
          const address = params.data.shippingAddress;
          return (
            <div>
              <div className="font-medium">{address?.fullName || "N/A"}</div>
              <div className="text-sm text-muted-foreground">
                {address?.phone || ""}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Items",
        width: 120,
        cellRenderer: (params: any) => {
          const items = params.data.items || [];
          const count = items.length;
          const firstItem = items[0]?.name || "";
          return (
            <div>
              <span className="font-medium">
                {count} item{count !== 1 ? "s" : ""}
              </span>
              {count > 0 && (
                <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                  {firstItem}
                </div>
              )}
            </div>
          );
        },
      },
      {
        headerName: "Total",
        field: "totalAmount",
        width: 100,
        cellRenderer: (params: any) => (
          <span className="font-semibold">
            ₹{params.value?.toLocaleString("en-IN") || 0}
          </span>
        ),
      },
      {
        headerName: "Payment",
        width: 120,
        cellRenderer: (params: any) => (
          <PaymentStatusBadge
            method={params.data.paymentMethod}
            status={params.data.paymentStatus}
          />
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 110,
        cellRenderer: (params: any) => (
          <OrderStatusBadge status={params.value} />
        ),
      },
      {
        headerName: "Date",
        field: "createdAt",
        width: 140,
        valueFormatter: (params: any) => formatDateTime(params.value),
      },
    ];

    // Only add Actions column if user has permission
    if (hasAnyOrderPermission) {
      columns.push({
        headerName: "Actions",
        width: 80,
        cellRenderer: (params: any) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleView(params.data.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      });
    }

    return columns;
  }, [handleView, hasAnyOrderPermission]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {orderStats?.totalOrders || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">
                  {orderStats?.pendingOrders || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {orderStats?.totalOrders || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₹{(orderStats?.totalRevenue || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <input
                type="text"
                placeholder="Order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="cod">COD</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management ({totalOrders} orders)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-10 text-muted-foreground">
              Loading...
            </div>
          )}
          {errorMessage && (
            <div className="text-center py-10 text-destructive">
              {errorMessage}
            </div>
          )}
          {!isLoading && !errorMessage && (
            <DataTable
              rowData={orders}
              columnDefs={columnDefs}
              perPage={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
