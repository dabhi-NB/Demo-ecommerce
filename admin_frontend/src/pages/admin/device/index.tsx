import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getDevices,
  logoutDevice,
  type Device,
} from "@/services/device.service";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { ColDef } from "ag-grid-community";

function LogoutButton({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () => logoutDevice(deviceId),
    onSuccess: (response) => {
      if (response?.status === 1) {
        toast.success(response.message || "Device successfully logged out");
      } else {
        toast.error(response.message || "Failed to logout device");
      }
    },
    onError: () => {
      toast.error("Failed to logout device");
    },
  });
  const isLoading = mutation.status === "pending";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          onClick={() => setOpen(true)}
        >
          <LogOut className="w-4 h-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            Do you really want to logout this device?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={async () => {
              await mutation.mutateAsync();
              setOpen(false);
            }}
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DevicePage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  const rowData = React.useMemo(() => {
    return devices.map((device) => ({
      ...device,
    }));
  }, [devices]);

  const columns: ColDef<Device>[] = useMemo(() => {
    const baseColumns: ColDef<Device>[] = [
      {
        headerName: "Last Activity",
        field: "last_activity",
        valueFormatter: (params: any) => formatDateTime(params.value),
      },
      { headerName: "Name", field: "name" },
      { headerName: "Email", field: "email" },
      { headerName: "Client", field: "client" },
      { headerName: "IP", field: "ip" },
      { headerName: "Location", field: "location" },
    ];

    // Only add Actions column if user has logout permission
    if (hasPermission("admin/device/logout")) {
      baseColumns.push({
        headerName: "Action",
        cellRenderer: (params: any) => (
          <LogoutButton deviceId={params.data._id} />
        ),
        sortable: false,
        filter: false,
        flex: 1,
      });
    }

    return baseColumns;
  }, [hasPermission]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Device Management</h1>
      <DataTable
        rowData={rowData}
        columnDefs={columns}
        perPage={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default DevicePage;
