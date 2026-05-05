import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SeoMetaForm from './_form';

export default function SeoMetaCreate() {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create SEO Meta</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/seo/meta')}>
          Back to SEO Meta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Meta Information</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoMetaForm isEdit={false} onSuccess={() => navigate('/admin/seo/meta')} />
        </CardContent>
      </Card>
    </>
  );
}
