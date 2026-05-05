import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import ProductForm from "./_form";
import { useRef } from "react";

export default function ProductUpdate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  // Check if user has permission to update products
  if (!hasPermission("admin/products/update")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Product</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/products")}>
          Back to Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={(data) => data && navigate(`/admin/products/view/${id}`)}
            onError={() => navigate("/admin/products")}
          />
        </CardContent>
      </Card>
    </>
  );
}
