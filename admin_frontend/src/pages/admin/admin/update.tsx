import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import AdminForm from "./_form";
import { useRef } from "react";

export default function AdminUpdate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  // Check if user has permission to update admin
  if (!hasPermission("admin/admin/update")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  const handleSuccess = (id?: string) => {
    console.log("handleSuccess called");
    if (id) {
      navigate(`/admin/admin/view/${id}`);
    } else if (formRef.current) {
      formRef.current.refetchAdmin();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Admin</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/admin")}>
          Back to Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Information</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => navigate("/admin/admin")}
          />
        </CardContent>
      </Card>
    </>
  );
}
