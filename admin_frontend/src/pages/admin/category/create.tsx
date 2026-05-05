import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import CategoryForm from "./_form";

export default function CategoryCreate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to create categories
  if (!hasPermission("admin/categories/create")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Category</h1>
        <Button
          variant="secondary"
          onClick={() => navigate("/admin/categories")}
        >
          Back to Categories
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            isEdit={false}
            onSuccess={(data) =>
              data && navigate(`/admin/categories/view/${data._id}`)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
