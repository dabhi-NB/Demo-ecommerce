import { useEffect, useState } from "react";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ThemeData {
  "theme.primary_color": string;
  "theme.secondary_color": string;
  "theme.font": string;
  "theme.dark_mode": string;
  "store.type": string;
  "store.currency": string;
  "store.currency_symbol": string;
}

const FONTS = ["Inter", "Roboto", "Poppins", "Nunito", "Lato", "Open Sans", "Montserrat"];
const STORE_TYPES = ["fashion", "electronics", "grocery", "furniture", "beauty", "sports", "general"];
const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
];

interface Props { settings: Record<string, string>; }

export function ThemeTab({ settings }: Props) {
  const [form, setForm] = useState<ThemeData>({
    "theme.primary_color": "#6366f1",
    "theme.secondary_color": "#f59e0b",
    "theme.font": "Inter",
    "theme.dark_mode": "false",
    "store.type": "general",
    "store.currency": "INR",
    "store.currency_symbol": "₹",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm((f) => ({
        ...f,
        "theme.primary_color": settings["theme.primary_color"] || f["theme.primary_color"],
        "theme.secondary_color": settings["theme.secondary_color"] || f["theme.secondary_color"],
        "theme.font": settings["theme.font"] || f["theme.font"],
        "theme.dark_mode": settings["theme.dark_mode"] || "false",
        "store.type": settings["store.type"] || f["store.type"],
        "store.currency": settings["store.currency"] || "INR",
        "store.currency_symbol": settings["store.currency_symbol"] || "₹",
      }));
    }
  }, [settings]);

  const s = (k: keyof ThemeData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCurrencyChange = (code: string) => {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) {
      setForm((f) => ({ ...f, "store.currency": cur.code, "store.currency_symbol": cur.symbol }));
    }
  };

  const saveTheme = async () => {
    setSaving(true);
    try {
      await Ajax.post("admin/setting/save-theme", {
        theme_primary_color: form["theme.primary_color"],
        theme_secondary_color: form["theme.secondary_color"],
        theme_font: form["theme.font"],
        theme_dark_mode: form["theme.dark_mode"],
      });
      await Ajax.post("admin/setting/save-store", {
        store_type: form["store.type"],
        store_currency: form["store.currency"],
        store_currency_symbol: form["store.currency_symbol"],
      });
      toast.success("Theme & store settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Colors</CardTitle>
          <CardDescription>Customize your store's color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={form["theme.primary_color"]} onChange={(e) => s("theme.primary_color", e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
                <Input value={form["theme.primary_color"]} onChange={(e) => s("theme.primary_color", e.target.value)} placeholder="#6366f1" />
              </div>
            </div>
            <div>
              <Label>Secondary / Accent Color</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={form["theme.secondary_color"]} onChange={(e) => s("theme.secondary_color", e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
                <Input value={form["theme.secondary_color"]} onChange={(e) => s("theme.secondary_color", e.target.value)} placeholder="#f59e0b" />
              </div>
            </div>
          </div>
          <div>
            <Label>Font Family</Label>
            <Select value={form["theme.font"]} onValueChange={(v) => s("theme.font", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form["theme.dark_mode"] === "true"}
              onCheckedChange={(v) => s("theme.dark_mode", v ? "true" : "false")}
            />
            <div>
              <Label>Default Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Users can always override this preference</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store Identity</CardTitle>
          <CardDescription>Set store type and currency configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Store Type</Label>
            <Select value={form["store.type"]} onValueChange={(v) => s("store.type", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STORE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form["store.currency"]} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveTheme} disabled={saving}>
        {saving ? "Saving..." : "Save Theme & Store Settings"}
      </Button>
    </div>
  );
}
