import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageForm from './_form';
import { useRef } from 'react';

export default function PageUpdate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  const handleSuccess = () => {
    if (formRef.current && formRef.current.refetchPage) {
      formRef.current.refetchPage();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Page</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/pages')}>
          Back to Pages
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PageForm ref={formRef} isEdit={true} id={id} onSuccess={handleSuccess} onError={() => navigate('/admin/pages')} />
        </CardContent>
      </Card>
    </>
  );
}
