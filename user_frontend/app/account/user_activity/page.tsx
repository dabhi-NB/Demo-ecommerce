"use client";
import { useMemo } from "react";
import { authService } from "@/services/auth.service";
import AccountLayout from "@/components/layout/account-layout/AccountLayout";
import { useQuery } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { Table } from "@/components/common/table";

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

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["userActivity"],
    queryFn: async () => {
      const res = await authService.userActivityList({
        draw: 1,
        start: 0,
        length: 1000,
        search: { value: "" },
      });
      return (res.data as unknown as LogItem[]) || [];
    },
  });

  /* -------- Formatted Data -------- */

  const formattedRows = useMemo(
    () =>
      activities.map((row) => ({
        ...row,
        formattedDate: formatDate(row.created_at),
        formattedDevice: formatDevice(row.client),
        formattedLocation: row.location || "-",
        formattedType: formatType(row.type),
      })),
    [activities],
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
    <AccountLayout title="Activity Log" subtitle="View your account activity">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="bg-card rounded-2xl border shadow-sm">
          {/* Header */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold ">Activity / List</h2>
          </div>

          {/* AG Grid (includes search) */}
          <div className="px-3 sm:px-6 pb-4 overflow-x-auto">
            <Table
              rowData={formattedRows}
              columnDefs={columnDefs}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
