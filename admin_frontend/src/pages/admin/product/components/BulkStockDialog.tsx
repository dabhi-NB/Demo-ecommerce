import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ajax } from "@/helper/ajax";

interface BulkStockDialogProps {
  selectedProducts: Array<{
    id: string;
    name: string;
    stock: number;
    variants?: any[];
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkStockDialog({
  selectedProducts,
  onClose,
  onSuccess,
}: BulkStockDialogProps) {
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Initialize stocks from selectedProducts on mount
  useEffect(() => {
    const initialStocks: Record<string, number> = {};
    selectedProducts.forEach((p) => {
      initialStocks[p.id] = p.stock;
    });
    setStocks(initialStocks);
  }, [selectedProducts]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates = Object.entries(stocks).map(([productId, stock]) => ({
        productId,
        stock,
      }));

      await Ajax.post("/admin/products/bulk-stock", { updates });

      toast.success(`${selectedProducts.length} products updated!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating bulk stock:", error);
      toast.error(error?.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Bulk Stock Update ({selectedProducts.length} products)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto py-2">
          {selectedProducts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 border border-border rounded-xl"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {p.stock}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">New Stock:</Label>
                <Input
                  type="number"
                  value={stocks[p.id] ?? p.stock}
                  onChange={(e) =>
                    setStocks((prev) => ({
                      ...prev,
                      [p.id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-24 h-9"
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Updating..."
              : `Update ${selectedProducts.length} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
