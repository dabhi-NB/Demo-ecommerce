import { useEffect, useState } from "react";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical, Globe, Lock, User } from "lucide-react";
import { Link } from "react-router";

interface NavItem {
  _id: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  location: "header" | "footer" | "sidebar";
  visibleTo: "all" | "guest" | "user";
  parent: string | null;
}

export default function NavManagement() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<"header" | "footer" | "sidebar">("header");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await Ajax.get("admin/nav");
      if (res.status === 1) setItems(res.data || []);
    } catch {
      toast.error("Failed to load nav items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this nav item and its children?")) return;
    try {
      await Ajax.delete(`admin/nav/${id}`);
      toast.success("Nav item deleted");
      fetchItems();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleToggle = async (item: NavItem) => {
    try {
      await Ajax.put(`admin/nav/${item._id}`, { isActive: !item.isActive });
      toast.success(`Nav item ${item.isActive ? "disabled" : "enabled"}`);
      fetchItems();
    } catch {
      toast.error("Update failed");
    }
  };

  const filtered = items.filter((i) => i.location === activeLocation);

  const visibilityIcon = (v: string) => {
    if (v === "guest") return <Lock className="h-3 w-3" />;
    if (v === "user") return <User className="h-3 w-3" />;
    return <Globe className="h-3 w-3" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Navigation Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage header, footer, and sidebar navigation links</p>
        </div>
        <Link to="/admin/nav/create">
          <Button><Plus className="h-4 w-4 mr-2" /> Add Nav Item</Button>
        </Link>
      </div>

      {/* Location tabs */}
      <div className="flex gap-2">
        {(["header", "footer", "sidebar"] as const).map((loc) => (
          <Button
            key={loc}
            variant={activeLocation === loc ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveLocation(loc)}
            className="capitalize"
          >
            {loc} ({items.filter((i) => i.location === loc).length})
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{activeLocation} Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No nav items for {activeLocation}. <Link to="/admin/nav/create" className="text-primary">Add one</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered
                .filter((i) => !i.parent)
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div key={item._id}>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {!item.isActive && <Badge variant="secondary">Inactive</Badge>}
                          {item.isExternal && <Badge variant="outline">External</Badge>}
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            {visibilityIcon(item.visibleTo)} {item.visibleTo}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground truncate">{item.url}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">#{item.order}</span>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(item)}>
                        {item.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Link to={`/admin/nav/update/${item._id}`}>
                        <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Children */}
                    {items.filter((c) => c.parent === item._id).sort((a, b) => a.order - b.order).map((child) => (
                      <div key={child._id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 ml-8 mt-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{child.label}</span>
                            {!child.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{child.url}</span>
                        </div>
                        <Link to={`/admin/nav/update/${child._id}`}>
                          <Button size="sm" variant="ghost"><Pencil className="h-3 w-3" /></Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(child._id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
