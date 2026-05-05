import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmailTemplateForm from './_form';
import { useRef } from 'react';

export default function EmailTemplateUpdate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const formRef = useRef<any>(null);

  const handleSuccess = () => {
    if (formRef.current && formRef.current.refetchEmailTemplate) {
      formRef.current.refetchEmailTemplate();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Email Template</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/email-template')}>
          Back to Email Templates
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Email Template Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailTemplateForm ref={formRef} isEdit={true} id={id} onSuccess={handleSuccess} onError={() => navigate('/admin/email-template')} />
        </CardContent>
      </Card>
    </>
  );
}


