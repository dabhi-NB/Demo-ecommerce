import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserForm from "./_form";
import { useRef } from "react";

export default function UserUpdate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  console.log("UserUpdate component rendered, id:", id);

  const handleSuccess = (data?: any) => {
    console.log("handleSuccess called");
    if (data) {
      navigate(`/admin/user/view/${data}`);
    } else if (formRef.current) {
      formRef.current.refetchUser();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update User</h1>
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
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => navigate("/admin/users")}
          />
        </CardContent>
      </Card>
    </>
  );
}
