"use client";
import { useMemo } from "react";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { Table } from "@/components/common/table";

/* ------------------ Types ------------------ */

type DeviceItem = {
  id: string;
  client: string;
  ip: string;
  location: string;
  last_activity: string;
  action?: string;
};

/* ------------------ Device List ------------------ */

export default function DeviceList() {
  /* State */
  const queryClient = useQueryClient();

  /* ------------------ API Call ------------------ */

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const res = await authService.deviceList({
        draw: 1,
        start: 0,
        length: 1000,
        search: { value: "" },
      });
      return (res.data as unknown as DeviceItem[]) || [];
    },
  });

  /* ------------------ Logout Device ------------------ */

  const logoutMutation = useMutation({
    mutationFn: (deviceId: string) => authService.deviceLogout(deviceId),
    onSuccess: (res) => {
      if (res.status === 1) {
        toast.success(res.message || "Device logged out");
        queryClient.invalidateQueries({ queryKey: ["devices"] });
      } else {
        toast.error(res.message || "Failed");
      }
    },
    onError: () => {
      toast.error("Failed to logout device");
    },
  });

  const handleLogoutDevice = (deviceId: string) => {
    toast.warning("Logout this device?", {
      action: {
        label: "Logout",
        onClick: () => logoutMutation.mutate(deviceId),
      },
    });
  };

  /* ------------------ AG Grid Columns ------------------ */

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: "CLIENT",
        field: "client",
        flex: 1,
        minWidth: 150,
        cellStyle: {
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
      },
      {
        headerName: "IP",
        field: "ip",
        flex: 1,
        minWidth: 130,
        cellStyle: {
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
      },
      {
        headerName: "LOCATION",
        field: "location",
        flex: 1,
        minWidth: 140,
        cellStyle: {
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
      },
      {
        headerName: "LAST ACTIVITY",
        field: "last_activity",
        flex: 1,
        minWidth: 150,
        cellStyle: {
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
      },
      {
        headerName: "ACTION",
        width: 100,
        cellRenderer: (params: any) =>
          params.data?.action === "logout" ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={() => handleLogoutDevice(params.data.id)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [],
  );

  /* ------------------ UI ------------------ */

  return (
    <AccountLayout title="Devices" subtitle="Manage your logged in devices">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="bg-card rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-card-foreground">
              Device / List
            </h2>
          </div>

          {/* AG Grid (includes search) */}
          <div className="px-3 sm:px-6 pb-4 overflow-x-auto">
            <Table
              rowData={devices}
              columnDefs={columnDefs}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
