import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { authService } from "@/services/auth.service";
import { AccountBlock } from "./component/account_block";
import { toast } from "sonner";
import type { ColDef } from "ag-grid-community";
import { DataTable } from "@/components/DataTable";

/* ---------------- Types ---------------- */

type LogItem = {
  id: number;
  created_at: string;
  client: string;
  location: string;
  ip: string;
  type: string | number;
};

/* ---------------- Component ---------------- */

export default function UserActivityLog() {
  /* State */
  const [rows, setRows] = useState<LogItem[]>([]);

  const isFetchingRef = useRef(false);

  /* -------- Format Helpers -------- */

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDevice = (ua: string) => {
    if (!ua) return "-";
    if (ua.includes("Chrome")) return "Chrome on Windows";
    if (ua.includes("Firefox")) return "Firefox on Windows";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari on Mac";
    return ua.split("(")[0];
  };

  const formatType = (type: string | number) => {
    const map: Record<string | number, string> = {
      1: "Login success",
      2: "Register",
      3: "Logout",
    };
    return map[type] || String(type);
  };

  /* -------- API -------- */

  const fetchActivities = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await authService.userActivityList({
        page: 1,
        per_page: 1000,
      });

      const activities = (res.data as unknown as LogItem[]) || [];
      setRows(activities);
    } catch {
      toast.error("Failed to fetch user activity");
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    {
      fetchActivities();
    }
  }, [fetchActivities]);

  /* -------- Formatted Data -------- */

  const formattedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        formattedDate: formatDate(row.created_at),
        formattedDevice: formatDevice(row.client),
        formattedLocation: row.location || "-",
        formattedType: formatType(row.type),
      })),
    [rows],
  );

  /* -------- AG Grid Columns -------- */

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Date",
        field: "formattedDate",
        flex: 1.2,
        minWidth: 120,
        cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
        autoHeight: true,
      },
      {
        headerName: "Device",
        field: "formattedDevice",
        flex: 1.2,
        minWidth: 110,
        cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
        autoHeight: true,
      },
      {
        headerName: "Location",
        field: "formattedLocation",
        flex: 1,
        minWidth: 100,
        cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
        autoHeight: true,
      },
      {
        headerName: "IP Address",
        field: "ip",
        flex: 1,
        minWidth: 90,
        cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
        autoHeight: true,
      },
      {
        headerName: "Type",
        field: "formattedType",
        flex: 1,
        minWidth: 90,
        cellStyle: { whiteSpace: "normal", wordWrap: "break-word" },
        autoHeight: true,
      },
    ],
    [],
  );

  return (
    <>
      <AccountBlock />
      <div className="flex-1 sm:px-10 mt-6 sm:mt-9">
        <div className="bg-card rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">
              Activity / List
            </h2>
          </div>
 
          {/* Data Table */}
          <div className="px-3 sm:px-6 pb-4">
            <DataTable
              rowData={formattedRows}
              columnDefs={columnDefs}
              perPage={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
