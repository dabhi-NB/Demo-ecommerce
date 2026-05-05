import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import type { ColDef, GridReadyEvent, DomLayoutType } from "ag-grid-community";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

ModuleRegistry.registerModules([AllCommunityModule]);

const AG_GRID_DEFAULTS: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  wrapText: true,
  autoHeight: true,
};

export const AG_GRID_PAGINATION_OPTIONS = [10, 20, 50, 100, 500];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableProps<T = any> {
  // New prop names (matching Next.js format)
  rowData?: T[];
  columnDefs?: ColDef<T>[];
  // Backward compatibility - old prop names
  data?: T[];
  columns?: ColDef<T>[];
  // Search
  quickFilterText?: string;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchFields?: any[];
  // Pagination
  perPage?: number;
  paginationPageSize?: number;
  pagination?: boolean;
  paginationPageSizeSelector?: number[];
  // Grid events
  onGridReady?: (params: GridReadyEvent) => void;
  // Loading
  loading?: boolean;
  // Styling
  style?: React.CSSProperties;
  className?: string;
  domLayout?: DomLayoutType;
  enableCellTextSelection?: boolean;
  suppressHorizontalScroll?: boolean;
  alwaysShowVerticalScroll?: boolean;
  overlayLoadingTemplate?: string;
  overlayNoRowsTemplate?: string;
  defaultColDef?: ColDef;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableHandle {
  setQuickFilter: (value: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTableComponent: React.ForwardRefRenderFunction<
  DataTableHandle,
  DataTableProps
> = (
  {
    rowData,
    columnDefs,
    // Backward compatibility
    data,
    columns,
    // Search
    quickFilterText = "",
    searchPlaceholder = "Search",
    enableSearch = true,
    // Pagination - prefer perPage, fallback to paginationPageSize
    perPage,
    paginationPageSize,
    pagination = true,
    paginationPageSizeSelector = AG_GRID_PAGINATION_OPTIONS,
    // Grid events
    onGridReady,
    // Loading
    loading = false,
    // Styling
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
) => {
  // Use data/rowData prop (backward compatibility: prefer data over rowData)
  const finalRowData = rowData ?? data ?? [];
  // Use columns/columnDefs (backward compatibility: prefer columnDefs over columns)
  const finalColumnDefs = columnDefs ?? columns ?? [];
  // Use perPage or paginationPageSize (backward compatibility)
  const finalPerPage = perPage ?? paginationPageSize ?? 10;

  const [quickFilter, setQuickFilter] = useState<string>(quickFilterText);
  const gridApiRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    setQuickFilter: (value: string) => setQuickFilter(value),
  }));

  const { effectiveTheme } = useTheme();

  const handleGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    if (onGridReady) {
      onGridReady(params);
    }
  };

  // Handle loading state
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
    rowData: finalRowData,
    columnDefs: finalColumnDefs,
    domLayout,
    pagination,
    paginationPageSize: finalPerPage,
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

  const wrapperClass = className
    ? `${className} ${effectiveTheme === "dark" ? "ag-theme-alpine-dark" : ""}`
    : `ag-theme-alpine w-full ${effectiveTheme === "dark" ? "ag-theme-alpine-dark" : ""}`;
  const wrapperStyle = style || { minHeight: 350 };

  return (
    <div className="w-full">
      {/* Search Input - similar to Next.js format */}
      {enableSearch && (
        <div className="px-3 sm:px-6 pb-4 flex justify-end">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="pl-9"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* AG Grid Table */}
      <div className={wrapperClass} style={wrapperStyle}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AgGridReact<any> {...gridOptions} />
      </div>
    </div>
  );
};

export const DataTable = forwardRef(DataTableComponent);

export default DataTable;
