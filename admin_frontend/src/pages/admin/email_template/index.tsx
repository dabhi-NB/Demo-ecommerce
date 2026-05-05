import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getEmailTemplates,
  type EmailTemplate,
} from "@/services/email_template.service";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";
import { useAuth } from "@/context/AuthContext";

const ActionCell: React.FC<{ data: EmailTemplate }> = ({ data }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <div className="flex gap-2">
      {hasPermission("admin/email_template/view") && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (data._id) {
              window.open(`/admin/email-template/view/${data._id}`, "_blank");
            }
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {hasPermission("admin/email_template/update") && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/admin/email-template/update/${data._id}`)}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const EmailTemplateList: React.FC = () => {
  const { hasPermission } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["email_template"],
    queryFn: getEmailTemplates,
  });

  const columns: ColDef<EmailTemplate>[] = useMemo(() => {
    const baseColumns: ColDef<EmailTemplate>[] = [
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
      {
        headerName: "Subject",
        field: "subject",
        flex: 2,
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/email_template/view") ||
      hasPermission("admin/email_template/update");

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
      <h1 className="text-2xl font-bold mb-4">Email Templates</h1>
      <DataTable
        rowData={data}
        columnDefs={columns}
        perPage={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
      />
    </div>
  );
};

export default EmailTemplateList;
