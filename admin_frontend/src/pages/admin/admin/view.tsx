import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getAdminById,
  ADMIN_QUERY_KEY,
  getAdminDetails,
  deleteAdmin,
} from "@/services/admin.service";
import { formatDateTime } from "@/lib/utils";
import AppConfig from "@/appConfig";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import { PermissionService } from "@/services/permission.service";
import { useAuth } from "@/context/AuthContext";
import type { ColDef } from "ag-grid-community";

export default function AdminView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  // Check if user has permission to view admins
  if (!hasPermission("admin/admin") && !hasPermission("admin/admin/view")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  const { deleteMutation } = useDeleteEntity(
    deleteAdmin,
    ADMIN_QUERY_KEY,
    "Admin",
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      navigate("/admin/admin", { replace: true });
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const {
    data: admin,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [ADMIN_QUERY_KEY, id],
    queryFn: () => getAdminById(id!),
    enabled: !!id,
  });

  // Fetch all admin details (devices, activity, mails) in a single query
  const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["admin-details", id],
    queryFn: () => getAdminDetails(id!),
    enabled: !!id,
  });

  const devicesData = detailsData?.devices || [];
  const activityData = detailsData?.activity || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load admin"}
          </p>
          <Link to="/admin/admin">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!admin) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-600">Admin not found</p>
          <Link to="/admin/admin">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isActive = admin.status === 1;

  const adminPermissions = admin.permission
    ? admin.permission.split(",").map((p) => p.trim())
    : [];

  // Column Definitions for Recent Devices
  const devicesColumns: ColDef[] = [
    {
      headerName: "Browser",
      field: "type",
      flex: 1,
      cellRenderer: (params: any) => {
        const typeMap: Record<number, string> = {
          0: "IOS",
          1: "Android",
        };
        return <strong>{typeMap[params.value] || "Web"}</strong>;
      },
    },
    { headerName: "Device", field: "device_uid", flex: 1 },
    { headerName: "Location", field: "ip", flex: 1.5 },
    {
      headerName: "Recent Activities",
      field: "created_at",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  // Column Definitions for Recent Activity
  const activityColumns: ColDef[] = [
    {
      headerName: "Browser",
      field: "type",
      flex: 1,
      cellRenderer: (params: any) => {
        const typeMap: Record<number, string> = {
          0: "Login Fail",
          1: "Login Success",
          2: "Login By Remember",
          3: "Register",
          4: "Login With Otp",
          5: "Login With Social Media",
          6: "Register With Social Media",
        };
        return <strong>{typeMap[params.value] || params.value}</strong>;
      },
    },
    { headerName: "Device", field: "client", flex: 2 },
    { headerName: "IP", field: "ip", flex: 1.5 },
    {
      headerName: "Recent Activities",
      field: "created_at",
      flex: 1,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Details</h1>
        <Link to="/admin/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Admin Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <div className="flex gap-2">
              <Link to={`/admin/admin/update/${admin.id}`}>
                <Button size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <ConfirmationDialog
                title="Delete Admin"
                description="Are you sure you want to delete this admin?"
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
              >
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </ConfirmationDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image and Details */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              {admin.image ? (
                <img
                  src={`${AppConfig.API_URL}upload/profile/${admin.image}`}
                  alt={admin.first_name}
                  className="h-32 w-32 rounded-full border-4 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="h-32 w-32 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center  text-muted-foreground">
                  No Image
                </div>
              )}
            </div>

            {/* Admin Details Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Username
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {admin.first_name} {admin.last_name}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">{admin.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {admin.phone || "N/A"}
                  </p>
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {admin.country || "N/A"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1 ">
                  <Badge variant={isActive ? "success" : "destructive"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium  text-muted-foreground">
                  Created At
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-5 w-5  text-muted-foreground" />
                  <p className="text-lg font-semibold">
                    {formatDateTime(admin.createdAt || admin.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PermissionService.getPermissionListData().map((group) => (
              <div key={group.key} className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium  text-muted-foreground">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.list?.map((perm) => {
                    const hasPermission = adminPermissions.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{perm.title}</span>
                        {hasPermission ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin  text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              rowData={devicesData}
              columnDefs={devicesColumns}
              perPage={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          )}
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin  text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              rowData={activityData}
              columnDefs={activityColumns}
              perPage={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
