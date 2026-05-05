import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  Shield,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  getPaymentGateways,
  addPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
  updatePaymentSettings,
} from "@/services/payment.service";

// GATEWAY_REGISTRY — fully dynamic, no predefined restriction
const GATEWAY_REGISTRY: Record<
  string,
  {
    label: string;
    fields: Array<{
      key: string;
      label: string;
      secret: boolean;
      placeholder: string;
    }>;
    docs: string;
  }
> = {
  razorpay: {
    label: "Razorpay",
    fields: [
      {
        key: "keyId",
        label: "Key ID",
        secret: false,
        placeholder: "rzp_test_...",
      },
      { key: "keySecret", label: "Key Secret", secret: true, placeholder: "" },
      {
        key: "webhookSecret",
        label: "Webhook Secret (optional)",
        secret: true,
        placeholder: "",
      },
    ],
    docs: "https://razorpay.com/docs/",
  },
  stripe: {
    label: "Stripe",
    fields: [
      {
        key: "keyId",
        label: "Publishable Key",
        secret: false,
        placeholder: "pk_test_...",
      },
      { key: "keySecret", label: "Secret Key", secret: true, placeholder: "" },
      {
        key: "webhookSecret",
        label: "Webhook Secret",
        secret: true,
        placeholder: "whsec_...",
      },
    ],
    docs: "https://stripe.com/docs/",
  },
  cashfree: {
    label: "Cashfree",
    fields: [
      { key: "keyId", label: "App ID", secret: false, placeholder: "" },
      { key: "keySecret", label: "Secret Key", secret: true, placeholder: "" },
    ],
    docs: "https://docs.cashfree.com/",
  },
  payu: {
    label: "PayU",
    fields: [
      { key: "keyId", label: "Merchant Key", secret: false, placeholder: "" },
      { key: "keySecret", label: "Salt", secret: true, placeholder: "" },
    ],
    docs: "https://devguide.payu.in/",
  },
  phonepe: {
    label: "PhonePe",
    fields: [
      { key: "keyId", label: "Merchant ID", secret: false, placeholder: "" },
      { key: "keySecret", label: "Salt Key", secret: true, placeholder: "" },
      {
        key: "saltIndex",
        label: "Salt Index",
        secret: false,
        placeholder: "1",
      },
    ],
    docs: "https://developer.phonepe.com/",
  },
  ccavenue: {
    label: "CCAvenue",
    fields: [
      { key: "keyId", label: "Merchant ID", secret: false, placeholder: "" },
      { key: "keySecret", label: "Working Key", secret: true, placeholder: "" },
      {
        key: "accessCode",
        label: "Access Code",
        secret: false,
        placeholder: "",
      },
    ],
    docs: "",
  },
  custom: {
    label: "Custom",
    fields: [
      {
        key: "keyId",
        label: "API Key / Key ID",
        secret: false,
        placeholder: "",
      },
      { key: "keySecret", label: "API Secret", secret: true, placeholder: "" },
      {
        key: "apiUrl",
        label: "API Base URL",
        secret: false,
        placeholder: "https://...",
      },
    ],
    docs: "",
  },
};

const SUPPORTED_METHODS = [
  "UPI",
  "Credit Card",
  "Debit Card",
  "Net Banking",
  "Wallet",
  "EMI",
  "BNPL",
];

// Empty form state
const emptyForm = {
  type: "razorpay",
  displayName: "",
  mode: "test",
  isActive: false,
  isDefault: false,
  supportedMethods: [] as string[],
  credentials: {} as Record<string, string>,
  userDisplayConfig: { label: "", description: "", iconUrl: "" },
};

interface PaymentTabProps {
  canEdit?: boolean;
}

export function PaymentTab({ canEdit = true }: PaymentTabProps) {
  // const queryClient = useQueryClient();
  const [gateways, setGateways] = useState<any[]>([]);
  const [generalSettings, setGeneralSettings] = useState({
    codEnabled: true,
    onlinePaymentEnabled: false,
    currency: "INR",
    orderAmountMin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingGateway, setEditingGateway] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Fetch gateways
  const fetchGateways = async () => {
    setLoading(true);
    try {
      const res = await getPaymentGateways();
      setGateways(res.data?.gateways || []);
      setGeneralSettings({
        codEnabled: res.data?.codEnabled ?? true,
        onlinePaymentEnabled: res.data?.onlinePaymentEnabled ?? false,
        currency: res.data?.currency || "INR",
        orderAmountMin: res.data?.orderAmountMin || 0,
      });
    } catch {
      toast.error("Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  // Mutations
  const addMutation = useMutation({
    mutationFn: addPaymentGateway,
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success(response.message || "Gateway added!");
        setShowDialog(false);
        setForm({ ...emptyForm });
        fetchGateways();
      } else {
        toast.error(response.message || "Failed to add gateway");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to add gateway");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ gatewayId, data }: { gatewayId: string; data: any }) =>
      updatePaymentGateway(gatewayId, data),
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success(response.message || "Gateway updated!");
        setShowDialog(false);
        setEditingGateway(null);
        setForm({ ...emptyForm });
        fetchGateways();
      } else {
        toast.error(response.message || "Failed to update gateway");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update gateway");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentGateway,
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success(response.message || "Gateway deleted");
        fetchGateways();
      } else {
        toast.error(response.message || "Failed to delete gateway");
      }
    },
    onError: () => {
      toast.error("Failed to delete gateway");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({
      gatewayId,
      isActive,
    }: {
      gatewayId: string;
      isActive: boolean;
    }) => updatePaymentGateway(gatewayId, { isActive }),
    onSuccess: (response) => {
      if (response.status === 1) {
        fetchGateways();
      } else {
        toast.error(response.message || "Failed to update");
      }
    },
    onError: () => {
      toast.error("Failed to update");
    },
  });

  const settingsMutation = useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success(response.message || "Settings saved!");
      } else {
        toast.error(response.message || "Failed to save settings");
      }
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  // Open add dialog
  const openAddDialog = () => {
    setEditingGateway(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (gw: any) => {
    setEditingGateway(gw);
    setForm({
      type: gw.type,
      displayName: gw.displayName,
      mode: gw.mode,
      isActive: gw.isActive,
      isDefault: gw.isDefault,
      supportedMethods: gw.supportedMethods || [],
      credentials: { keyId: gw.credentials?.keyId || "" },
      userDisplayConfig: gw.userDisplayConfig || {
        label: "",
        description: "",
        iconUrl: "",
      },
    });
    setShowDialog(true);
  };

  // Handle save
  const handleSave = () => {
    if (!form.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    if (editingGateway) {
      updateMutation.mutate({ gatewayId: editingGateway.id, data: form });
    } else {
      addMutation.mutate(form);
    }
  };

  // Handle delete
  const handleDelete = (gw: any) => {
    if (!window.confirm(`Delete gateway "${gw.displayName}"?`)) return;
    deleteMutation.mutate(gw.id);
  };

  // Handle toggle active
  const handleToggleActive = (gw: any) => {
    toggleActiveMutation.mutate({ gatewayId: gw.id, isActive: !gw.isActive });
  };

  // Handle save general settings
  const handleSaveGeneral = () => {
    settingsMutation.mutate(generalSettings);
  };

  // Get current gateway fields
  const currentFields = GATEWAY_REGISTRY[form.type]?.fields || [];

  const isSaving =
    addMutation.isPending ||
    updateMutation.isPending ||
    settingsMutation.isPending;

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <div>
                <p className="font-semibold text-sm">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Allow COD orders
                </p>
              </div>
              <Switch
                checked={generalSettings.codEnabled}
                onCheckedChange={(v) =>
                  setGeneralSettings((p) => ({ ...p, codEnabled: v }))
                }
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <div>
                <p className="font-semibold text-sm">Online Payment</p>
                <p className="text-xs text-muted-foreground">
                  Master toggle for all gateways
                </p>
              </div>
              <Switch
                checked={generalSettings.onlinePaymentEnabled}
                onCheckedChange={(v) =>
                  setGeneralSettings((p) => ({ ...p, onlinePaymentEnabled: v }))
                }
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Currency</Label>
              <Select
                value={generalSettings.currency}
                onValueChange={(v) =>
                  setGeneralSettings((p) => ({ ...p, currency: v }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR — Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minimum Order for Online Payment</Label>
              <Input
                type="number"
                value={generalSettings.orderAmountMin}
                onChange={(e) =>
                  setGeneralSettings((p) => ({
                    ...p,
                    orderAmountMin: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0 = no minimum"
                disabled={!canEdit}
              />
            </div>
          </div>
          {canEdit && (
            <Button onClick={handleSaveGeneral} disabled={isSaving} size="sm">
              {isSaving ? "Saving..." : "Save General Settings"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Gateways List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Payment Gateways</h3>
            <p className="text-xs text-muted-foreground">
              {gateways.length} configured —{" "}
              {gateways.filter((g) => g.isActive).length} active
            </p>
          </div>
          {canEdit && (
            <Button onClick={openAddDialog} size="sm" className="gap-1.5">
              <Plus size={15} /> Add Gateway
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : gateways.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-10 text-center">
            <CreditCard
              size={36}
              className="mx-auto text-muted-foreground/40 mb-3"
            />
            <p className="font-semibold text-muted-foreground">
              No payment gateways configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a gateway to enable online payments
            </p>
            {canEdit && (
              <Button onClick={openAddDialog} className="mt-4" size="sm">
                + Add First Gateway
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {gateways.map((gw) => (
              <Card
                key={gw.id}
                className={`border ${gw.isActive ? "border-border" : "border-dashed border-border/50 opacity-60"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ">
                      <CreditCard size={18} className="text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">
                          {gw.displayName}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {gw.type}
                        </Badge>
                        <Badge
                          variant={
                            gw.mode === "live" ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {gw.mode === "live" ? "🔴 Live" : "🟡 Test"}
                        </Badge>
                        {gw.isDefault && (
                          <Badge className="text-xs bg-green-500/15 text-green-600 border-green-500/30">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {gw.userDisplayConfig?.description ||
                          "Online payment gateway"}
                      </p>
                      {gw.supportedMethods?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {gw.supportedMethods.map((m: string) => (
                            <span
                              key={m}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      {!gw.credentials?.keyId && (
                        <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={11} /> API keys not configured
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ">
                      {canEdit && (
                        <Switch
                          checked={gw.isActive}
                          onCheckedChange={() => handleToggleActive(gw)}
                          title={gw.isActive ? "Deactivate" : "Activate"}
                        />
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(gw)}
                        >
                          <Edit size={15} />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(gw)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGateway ? "Edit Gateway" : "Add Payment Gateway"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Gateway Type */}
            <div>
              <Label>Gateway Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  setForm((p) => ({
                    ...p,
                    type: v,
                    credentials: {},
                    displayName: GATEWAY_REGISTRY[v]?.label || v,
                  }));
                }}
                disabled={!!editingGateway}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gateway" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GATEWAY_REGISTRY).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingGateway && (
                <p className="text-xs text-muted-foreground mt-1">
                  Gateway type cannot be changed after creation.
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <Label>Display Name *</Label>
              <Input
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="e.g. Razorpay India, Stripe USD"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shown to admin — not visible to customers
              </p>
            </div>

            {/* Mode */}
            <div>
              <Label>Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v) => setForm((p) => ({ ...p, mode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    🟡 Test Mode (no real charges)
                  </SelectItem>
                  <SelectItem value="live">
                    🔴 Live Mode (real payments)
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.mode === "live" && (
                <p className="text-xs text-orange-500 mt-1 font-semibold">
                  ⚠️ Live mode — real money will be charged to customers
                </p>
              )}
            </div>

            {/* API Credentials */}
            {currentFields.length > 0 && (
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <Shield size={14} className="text-primary" /> API
                    Credentials
                  </p>
                  {GATEWAY_REGISTRY[form.type]?.docs && (
                    <a
                      href={GATEWAY_REGISTRY[form.type].docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      Docs <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                {currentFields.map((field) => (
                  <div key={field.key}>
                    <Label>{field.label}</Label>
                    {field.secret ? (
                      <PasswordInput
                        value={form.credentials[field.key] || ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            credentials: {
                              ...p.credentials,
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        placeholder={
                          editingGateway
                            ? "Leave empty to keep existing"
                            : field.placeholder || ""
                        }
                      />
                    ) : (
                      <Input
                        value={form.credentials[field.key] || ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            credentials: {
                              ...p.credentials,
                              [field.key]: e.target.value,
                            },
                          }))
                        }
                        placeholder={field.placeholder || ""}
                      />
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield size={11} /> Secret keys are encrypted and never shown
                  after saving
                </p>
              </div>
            )}

            {/* Customer Display Config */}
            <div className="border border-border rounded-xl p-4 space-y-3">
              <p className="font-semibold text-sm">
                Customer Display (shown on checkout)
              </p>
              <div>
                <Label>Label</Label>
                <Input
                  value={form.userDisplayConfig.label}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      userDisplayConfig: {
                        ...p.userDisplayConfig,
                        label: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. Pay Online, UPI & Cards"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={form.userDisplayConfig.description}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      userDisplayConfig: {
                        ...p.userDisplayConfig,
                        description: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. UPI, Cards, Netbanking via Razorpay"
                />
              </div>
            </div>

            {/* Supported Methods */}
            <div>
              <Label>Supported Payment Methods</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUPPORTED_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        supportedMethods: p.supportedMethods.includes(method)
                          ? p.supportedMethods.filter((m) => m !== method)
                          : [...p.supportedMethods, method],
                      }))
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      form.supportedMethods.includes(method)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label>Active (show to users)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isDefault: v }))
                  }
                />
                <Label>Default gateway</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingGateway ? (
                "Update Gateway"
              ) : (
                "Add Gateway"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
