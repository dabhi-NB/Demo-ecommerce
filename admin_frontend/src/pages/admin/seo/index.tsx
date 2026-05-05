import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { ColDef } from "ag-grid-community";
import {
  getSeoMetasPaginated,
  deleteSeoMeta,
  type SeoMeta,
} from "@/services/seo.service";
import { usePaginatedData } from "@/hooks/usePaginatedData";
import { ConfirmationDialog } from "../layouts/component/ConfirmationDialog";
import { useDeleteEntity } from "@/hooks/useDeleteEntity";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppConfig from "@/appConfig";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function SeoStatusBadge({
  sitemap_enable,
}: {
  sitemap_enable: SeoMeta["sitemap_enable"];
}) {
  const isEnabled = sitemap_enable === 1;
  return (
    <Badge variant={isEnabled ? "success" : "destructive"}>
      {isEnabled ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function SeoMeta() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { deleteItem: handleDelete } = useDeleteEntity(
    deleteSeoMeta,
    ["seo"],
    "SEO Meta",
  );
  const [isSitemapDialogOpen, setIsSitemapDialogOpen] = useState(false);

  const {
    data: seoMetas,
    isLoading,
    isError,
    error,
  } = usePaginatedData(getSeoMetasPaginated, ["seo"], 10);

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/seo/update/${id}`);
    },
    [navigate],
  );

  const handleUpdateSitemap = useCallback(async () => {
    try {
      await Ajax.post("admin/seo/update-sitemap", {});
      toast.success("Sitemap updated successfully");
      setIsSitemapDialogOpen(false);
    } catch (error) {
      console.error("Error updating sitemap:", error);
      toast.error("Failed to update sitemap");
    }
  }, []);

  const errorMessage = isError
    ? (error as any)?.message || "Failed to fetch SEO metas"
    : null;

  const columnDefs: ColDef<SeoMeta>[] = useMemo(() => {
    const baseColumns: ColDef<SeoMeta>[] = [
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
        headerName: "Url",
        field: "url",
        flex: 1,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Title",
        field: "title",
        flex: 1,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Keyword",
        field: "keyword",
        width: 120,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        headerName: "Sitemap",
        field: "sitemap_enable",
        width: 120,
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center justify-center h-full mt-2">
              <SeoStatusBadge sitemap_enable={params.value} />
            </div>
          );
        },
      },
    ];

    // Only add Actions column if user has at least one action permission
    const hasAnyActionPermission =
      hasPermission("admin/seo/update") || hasPermission("admin/seo/delete");

    if (hasAnyActionPermission) {
      baseColumns.push({
        headerName: "Actions",
        width: 150,
        cellRenderer: (params: any) => {
          return (
            <div className="flex items-center gap-2 h-full">
              {hasPermission("admin/seo/update") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(params.data._id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {hasPermission("admin/seo/delete") && (
                <ConfirmationDialog
                  title="Delete SEO Meta"
                  description="Are you sure you want to delete this SEO meta?"
                  confirmText="Delete"
                  cancelText="Cancel"
                  onConfirm={() => handleDelete(params.data._id)}
                >
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ConfirmationDialog>
              )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [handleDelete, handleEdit, hasPermission]);

  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex-1">Seo Meta </h1>
        <div className="flex gap-2 justify-end">
          <Dialog
            open={isSitemapDialogOpen}
            onOpenChange={setIsSitemapDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>SiteMap</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sitemap Management</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sitemap-url" className="mb-4">
                    Sitemap URL
                  </Label>
                  <Input
                    id="sitemap-url"
                    value={`${AppConfig.FRONT_URL}express/sitemap.xml`}
                    readOnly
                  />
                </div>
                <Button onClick={handleUpdateSitemap} className="w-full">
                  Update Sitemap
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {hasPermission("admin/seo/create") && (
            <Button asChild>
              <Link to="/admin/seo/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Seo Meta
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seo Meta Management</CardTitle>
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
              rowData={seoMetas}
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
