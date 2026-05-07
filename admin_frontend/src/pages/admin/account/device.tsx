import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { AccountBlock } from "./component/account_block";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import type { ColDef } from "ag-grid-community";
import { DataTable } from "@/components/DataTable";

/* ------------------ Types ------------------ */

type DeviceItem = {
  id?: string;
  _id?: string;
  client: string;
  ip: string;
  location: string;
  last_activity: string;
};

/* ------------------ Device List ------------------ */

export default function DeviceList() {
  const [rows] = useState<DeviceItem[]>([]);
  const isFetchingRef = useRef(false);

  /* ------------------ Fetch Devices ------------------ */

  const fetchDevices = useCallback(async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    // try {
    //   const res = await authService.deviceList({
    //     draw: 1,
    //     start: 0,
    //     length: 1000,
    //     search: { value: "" },
    //   });

    //   setRows(res.data || []);
    // } catch {
    //   toast.error("Failed to fetch devices");
    // } finally {
    //   isFetchingRef.current = false;
    // }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  /* ------------------ Logout Device ------------------ */

  const handleLogoutDevice = useCallback(
    async (deviceId?: string) => {
      if (!deviceId) return;

      toast.warning("Logout this device?", {
        action: {
          label: "Logout",
          onClick: async () => {
            try {
              const res = await authService.deviceLogout(deviceId);
              if (res.status === 1) {
                toast.success(res.message || "Device logged out");
                fetchDevices();
              } else {
                toast.error(res.message || "Logout failed");
              }
            } catch {
              toast.error("Failed to logout device");
            }
          },
        },
      });
    },
    [fetchDevices],
  );

  /* ------------------ Columns ------------------ */

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: "CLIENT",
        field: "client",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "IP",
        field: "ip",
        flex: 1,
        minWidth: 130,
      },
      {
        headerName: "LOCATION",
        field: "location",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "LAST ACTIVITY",
        field: "last_activity",
        flex: 1,
        minWidth: 170,
      },
      {
        headerName: "ACTION",
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const deviceId = params.data?.id || params.data?._id;

          return (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleLogoutDevice(deviceId)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [handleLogoutDevice],
  );

  return (
    <>
      <AccountBlock />

      <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b">
            <h2 className="text-lg font-semibold text-foreground">
              Device / List
            </h2>
          </div>

          {/* Table */}
          <div className="px-3 sm:px-6 pb-4">
            <DataTable
              rowData={rows}
              columnDefs={columnDefs}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
