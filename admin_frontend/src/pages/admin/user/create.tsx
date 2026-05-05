import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import UserForm from "./_form";

export default function UserCreate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to create users
  if (!hasPermission("admin/user/create")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create User</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/users")}>
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            isEdit={false}
            onSuccess={(data) =>
              data && navigate(`/admin/user/view/${data._id}`)
            }
          />
        </CardContent>
      </Card>
    </>
  );
}
