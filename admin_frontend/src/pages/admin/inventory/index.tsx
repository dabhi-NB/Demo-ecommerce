import { useEffect, useState } from "react";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package, RefreshCw, TrendingDown } from "lucide-react";
import { Link } from "react-router";

interface StockAlert { _id: string; name: string; slug: string; stock: number; sku?: string; lowStockThreshold: number; variantAlerts?: Array<{ sku: string; combination: string; stock: number; }>; }

export default function InventoryPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertRes, overviewRes] = await Promise.all([
        Ajax.get("admin/inventory/alerts"),
        Ajax.get("admin/inventory"),
      ]);
      if (alertRes.status === 1) setAlerts(alertRes.data || []);
      if (overviewRes.status === 1) setOverview(overviewRes.data);
    } catch {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = alerts.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || (a.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor stock levels and low stock alerts</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Products", value: overview.totalProducts, icon: Package, color: "text-blue-600" },
            { label: "Out of Stock", value: overview.outOfStock, icon: AlertTriangle, color: "text-red-600" },
            { label: "Low Stock", value: overview.lowStock, icon: TrendingDown, color: "text-amber-600" },
            { label: "In Stock", value: overview.inStock, icon: Package, color: "text-green-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts ({filtered.length})
          </CardTitle>
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading alerts...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-green-600 font-medium">
              {search ? "No matching products found." : "✅ All products are well-stocked!"}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div key={item._id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.stock === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300">Low Stock</Badge>
                        )}
                      </div>
                      {item.sku && <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>}
                      <p className="text-sm mt-1">Stock: <strong>{item.stock}</strong> / Threshold: {item.lowStockThreshold}</p>
                    </div>
                    <Link to={`/admin/products/update/${item._id}`}>
                      <Button size="sm" variant="outline">Update Stock</Button>
                    </Link>
                  </div>
                  {item.variantAlerts && item.variantAlerts.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Variant Alerts:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {item.variantAlerts.map((v, i) => (
                          <div key={i} className="text-xs bg-muted rounded p-2">
                            <span className="font-medium">{v.combination}</span>
                            <br />SKU: {v.sku} | Stock: <strong className={v.stock === 0 ? "text-red-600" : "text-amber-600"}>{v.stock}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
