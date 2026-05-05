import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import ProductForm from "./_form";

export default function ProductCreate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to create products
  if (!hasPermission("admin/products/create")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
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
            isEdit={false}
            onSuccess={(data) =>
              data && navigate(`/admin/products/view/${data._id}`)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
