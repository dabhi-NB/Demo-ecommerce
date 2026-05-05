import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getUserActivities,
  type UserActivity,
} from "@/services/user_activity.service";
import { DataTable } from "@/components/DataTable";
import { formatDateTime } from "@/lib/utils";

const columns = [
  {
    headerName: "Date",
    field: "created_at" as keyof UserActivity,
    valueFormatter: (params: any) => formatDateTime(params.value),
    flex: 1,
  },
  {
    headerName: "Type",
    field: "type" as keyof UserActivity,
    flex: 1,
  },
  {
    headerName: "Name",
    field: "name" as keyof UserActivity,
    flex: 1,
  },
  {
    headerName: "Email",
    field: "email" as keyof UserActivity,
    flex: 1,
  },
  {
    headerName: "Device",
    field: "device_id" as keyof UserActivity,
    flex: 1,
  },
  {
    headerName: "IP",
    field: "ip" as keyof UserActivity,
    flex: 1,
  },
  {
    headerName: "Location",
    field: "location" as keyof UserActivity,
    flex: 1,
  },
];

const UserActivityPage: React.FC = () => {
  const { data = [] } = useQuery({
    queryKey: ["user-activities"],
    queryFn: getUserActivities,
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Activity</h1>
      <DataTable
        rowData={data}
        columnDefs={columns}
        perPage={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default UserActivityPage;
