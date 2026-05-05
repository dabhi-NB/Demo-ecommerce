import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AdminForm from "./_form";

export default function AdminCreate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to create admin
  if (!hasPermission("admin/admin/create")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Admin</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/admin")}>
          Back to Admins
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            isEdit={false}
            onSuccess={(data) =>
              data && navigate(`/admin/admin/view/${data._id}`)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
