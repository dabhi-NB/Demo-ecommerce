import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { Input } from "@/components/ui/input";
import type { ColDef, DomLayoutType } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useTheme } from "@/hooks/useTheme";

// Register AG Grid modules once globally
if (typeof window !== "undefined") {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

const AG_GRID_DEFAULTS = {
  sortable: true,
  filter: true,
  resizable: true,
  wrapText: true,
  autoHeight: true,
};

export const AG_GRID_ROW_SELECTION = {
  mode: "multiRow" as const,
};

export const AG_GRID_PAGINATION_OPTIONS = [10, 20, 50, 100, 500];

export interface CommonTableProps {
  rowData?: any[];
  columnDefs: ColDef[];
  quickFilterText?: string;
  perPage?: number;
  pagination?: boolean;
  paginationPageSizeSelector?: number[];
  onGridReady?: (p: any) => void;
  loading?: boolean;
  style?: React.CSSProperties;
  className?: string;
  domLayout?: DomLayoutType;
  enableCellTextSelection?: boolean;
  suppressHorizontalScroll?: boolean;
  alwaysShowVerticalScroll?: boolean;
  overlayLoadingTemplate?: string;
  overlayNoRowsTemplate?: string;
  defaultColDef?: any;
}

export type TableHandle = { setQuickFilter: (v: string) => void };

export const Table = forwardRef<TableHandle, CommonTableProps>(function Table(
  {
    rowData = [],
    columnDefs,
    quickFilterText = "",
    perPage = 10,
    pagination = true,
    paginationPageSizeSelector = AG_GRID_PAGINATION_OPTIONS,
    onGridReady,
    loading = false,
    style,
    className,
    domLayout = "autoHeight",
    enableCellTextSelection = true,
    suppressHorizontalScroll = false, 
    alwaysShowVerticalScroll = true,
    overlayLoadingTemplate,
    overlayNoRowsTemplate,
    defaultColDef,
  },
  ref,
) {
  const [quickFilter, setQuickFilter] = useState<string>(quickFilterText);
  const gridApiRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({ setQuickFilter }));

  const { effectiveTheme } = useTheme();

  const handleGridReady = (params: any) => {
    gridApiRef.current = params.api;
    if (onGridReady) {
      onGridReady(params);
    }
  };

  useEffect(() => {
    if (gridApiRef.current) {
      if (loading) {
        gridApiRef.current.showLoadingOverlay();
      } else {
        gridApiRef.current.hideOverlay();
      }
    }
  }, [loading]);

  const gridOptions = {
    rowData,
    columnDefs,
    domLayout,
    pagination,
    paginationPageSize: perPage,
    paginationPageSizeSelector,
    onGridReady: handleGridReady,
    quickFilterText: quickFilter,
    enableCellTextSelection,
    suppressHorizontalScroll,
    alwaysShowVerticalScroll,
    overlayLoadingTemplate:
      overlayLoadingTemplate ||
      '<span class="ag-overlay-loading-center">Loading...</span>',
    overlayNoRowsTemplate:
      overlayNoRowsTemplate ||
      '<span class="ag-overlay-no-rows-center">No rows</span>',
    defaultColDef: defaultColDef || AG_GRID_DEFAULTS,
  };

  const wrapperClass = `${className || "ag-theme-alpine w-full"} ${effectiveTheme === "dark" ? "ag-theme-alpine-dark" : ""}`;
  const wrapperStyle = style || { minHeight: 350 };

  return (
    <div>
      <div className="px-3 sm:px-6 pb-4 flex justify-end">
        <Input
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          placeholder="Search"
          className="max-w-sm"
        />
      </div>
      <div className={wrapperClass} style={wrapperStyle}>
        <AgGridReact {...gridOptions} />
      </div>
    </div>
  );
});

export default Table;
