import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SeoMetaForm from "./_form";
import { useRef } from "react";

export default function SeoMetaUpdate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  console.log("SeoMetaUpdate component rendered, id:", id);

  const handleSuccess = () => {
    console.log("handleSuccess called");
    if (formRef.current) {
      formRef.current.refetchSeoMeta();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update SEO Meta</h1>
        <Button variant="secondary" onClick={() => navigate("/admin/seo/meta")}>
          Back to SEO Meta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Meta Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoMetaForm
            ref={formRef}
            isEdit={true}
            id={id}
            onSuccess={handleSuccess}
            onError={() => navigate("/admin/seo/meta")}
          />
        </CardContent>
      </Card>
    </>
  );
}
