import { useEffect, useState } from "react";
import { Ajax } from "@/helper/ajax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Features {
  sub_categories: boolean;
  product_variants: boolean;
  bulk_stock: boolean;
  guest_checkout: boolean;
  wallet: boolean;
  coupon_system: boolean;
  sms_notifications: boolean;
  review_system: boolean;
  wishlist: boolean;
  compare_products: boolean;
  live_chat: boolean;
  invoice_download: boolean;
}

const FEATURE_META: Record<
  string,
  { label: string; description: string; group: string }
> = {
  sub_categories: {
    label: "Sub-Categories",
    description: "Enable nested category support (parent/child categories)",
    group: "Catalog",
  },
  product_variants: {
    label: "Product Variants",
    description: "Allow products to have multiple variants (size, color, etc.)",
    group: "Catalog",
  },
  bulk_stock: {
    label: "Bulk Stock Update",
    description: "Enable bulk stock management for variants",
    group: "Catalog",
  },
  wishlist: {
    label: "Wishlist",
    description: "Allow users to save products to wishlist",
    group: "Shopping",
  },
  coupon_system: {
    label: "Coupon System",
    description: "Enable discount coupons and promo codes",
    group: "Shopping",
  },
  guest_checkout: {
    label: "Guest Checkout",
    description: "Allow checkout without account registration",
    group: "Shopping",
  },
  compare_products: {
    label: "Compare Products",
    description: "Allow users to compare multiple products",
    group: "Shopping",
  },
  review_system: {
    label: "Review & Ratings",
    description: "Enable product reviews and ratings by users",
    group: "Engagement",
  },
  live_chat: {
    label: "Live Chat",
    description: "Show live chat widget on storefront",
    group: "Engagement",
  },
  wallet: {
    label: "Wallet System",
    description: "User wallet for store credits and cashback",
    group: "Finance",
  },
  sms_notifications: {
    label: "SMS Notifications",
    description: "Send SMS alerts for orders and updates",
    group: "Notifications",
  },
  invoice_download: {
    label: "Invoice Download",
    description: "Allow users to download PDF invoice for orders",
    group: "Notifications",
  },
};

const GROUPS = [
  "Catalog",
  "Shopping",
  "Engagement",
  "Finance",
  "Notifications",
];

export default function FeatureToggles() {
  const [features, setFeatures] = useState<Partial<Features>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Ajax.get("admin/features")
      .then((r) => {
        if (r.status === 1) setFeatures(r.data || {});
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load features");
        setLoading(false);
      });
  }, []);

  const toggle = (key: string) => {
    setFeatures((f) => ({ ...f, [key]: !f[key as keyof Features] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Ajax.post("admin/features/save", features);
      toast.success("Feature toggles saved successfully");
    } catch {
      toast.error("Failed to save features");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading features...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Feature Toggles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enable or disable features across the store. Changes apply to all
            users.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {GROUPS.map((group) => {
        const groupFeatures = Object.entries(FEATURE_META).filter(
          ([, m]) => m.group === group,
        );
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-base">{group}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupFeatures.map(([key, meta]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">{meta.label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                  <Switch
                    checked={!!features[key as keyof Features]}
                    onCheckedChange={() => toggle(key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
