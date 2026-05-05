import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPages, type Page } from "@/services/page.service";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router";
import AppConfig from "@/appConfig";
import { useAuth } from "@/context/AuthContext";
import type { ColDef } from "ag-grid-community";

const ActionCell: React.FC<{ data: Page }> = ({ data }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <div className="flex gap-2">
      {hasPermission("page/") && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (data.slug) {
              window.open(`${AppConfig.FRONT_URL}page/${data.slug}`, "_blank");
            }
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {hasPermission("admin/page/update") && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/page/update/${data._id}`)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const PageList: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["pages"],
    queryFn: getPages,
  });

  const columns: ColDef<Page>[] = useMemo(() => {
    const baseColumns: ColDef<Page>[] = [
      {
        headerName: "#",
        width: 70,
        valueGetter: (params: any) => {
          return params.node?.rowIndex != null ? params.node.rowIndex + 1 : "";
        },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Title",
        field: "title",
        flex: 2,
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("page/") || hasPermission("admin/page/update");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Action",
        cellRenderer: (params: any) => <ActionCell data={params.data} />,
        sortable: false,
        filter: false,
        flex: 1,
      });
    }

    return baseColumns;
  }, [hasPermission]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pages</h1>
      <DataTable
        rowData={data}
        columnDefs={columns}
        perPage={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default PageList;
