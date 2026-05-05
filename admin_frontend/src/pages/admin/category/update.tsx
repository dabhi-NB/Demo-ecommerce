import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import CategoryForm from "./_form";
import { useRef } from "react";

export default function CategoryUpdate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  // Check if user has permission to update categories
  if (!hasPermission("admin/categories/update")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  const handleSuccess = (data?: any) => {
    if (data) {
      navigate(`/admin/categories/view/${data}`);
    } else if (formRef.current) {
      // Handle refetch if needed
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Category</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/categories")}>
          Back to Categories
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => navigate("/admin/categories")}
          />
        </CardContent>
      </Card>
    </>
  );
}
