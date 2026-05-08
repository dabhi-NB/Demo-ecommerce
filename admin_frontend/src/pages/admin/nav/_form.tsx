import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NavItem {
  _id: string;
  label: string;
  location: string;
  parent: string | null;
}

interface NavFormProps {
  mode: "create" | "update";
  id?: string;
}

export default function NavForm({ mode, id }: NavFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [form, setForm] = useState({
    label: "",
    url: "/",
    icon: "",
    order: 0,
    isActive: true,
    isExternal: false,
    openInNewTab: false,
    parent: "",
    location: "header",
    visibleTo: "all",
  });

  useEffect(() => {
    Ajax.get("admin/nav").then((r) => {
      if (r.status === 1) setNavItems(r.data || []);
    });
    if (mode === "update" && id) {
      Ajax.get(`admin/nav/${id}`).then((r) => {
        if (r.status === 1 && r.data) {
          const d = r.data;
          setForm({
            label: d.label,
            url: d.url,
            icon: d.icon || "",
            order: d.order,
            isActive: d.isActive,
            isExternal: d.isExternal,
            openInNewTab: d.openInNewTab,
            parent: d.parent || "",
            location: d.location,
            visibleTo: d.visibleTo,
          });
        }
      });
    }
  }, [mode, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (mode === "create") {
        await Ajax.post("admin/nav/create", payload);
        toast.success("Nav item created");
      } else {
        await Ajax.put(`admin/nav/${id}`, payload);
        toast.success("Nav item updated");
      }
      navigate("/admin/nav");
    } catch {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const s = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {mode === "create" ? "Create" : "Update"} Nav Item
      </h1>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Nav Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Label *</Label>
              <Input
                value={form.label}
                onChange={(e) => s("label", e.target.value)}
                placeholder="Home"
                required
              />
            </div>
            <div>
              <Label>URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => s("url", e.target.value)}
                placeholder="/"
                required
              />
            </div>
            <div>
              <Label>Icon (lucide name)</Label>
              <Input
                value={form.icon}
                onChange={(e) => s("icon", e.target.value)}
                placeholder="home"
              />
            </div>
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => s("order", +e.target.value)}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Select
                value={form.location}
                onValueChange={(v) => s("location", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visible To</Label>
              <Select
                value={form.visibleTo}
                onValueChange={(v) => s("visibleTo", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All (Everyone)</SelectItem>
                  <SelectItem value="guest">Guests Only</SelectItem>
                  <SelectItem value="user">Logged In Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent Item (optional)</Label>
              <Select value={form.parent} onValueChange={(v) => s("parent", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (top level)</SelectItem>
                  {navItems
                    .filter(
                      (i) =>
                        !i.parent &&
                        i._id !== id &&
                        i.location === form.location,
                    )
                    .map((i) => (
                      <SelectItem key={i._id} value={i._id}>
                        {i.label} ({i.location})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => s("isActive", v)}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isExternal}
                  onCheckedChange={(v) => s("isExternal", v)}
                />
                <Label>External Link</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.openInNewTab}
                  onCheckedChange={(v) => s("openInNewTab", v)}
                />
                <Label>New Tab</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Nav Item"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/nav")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
