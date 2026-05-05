import { useNavigate, useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import CouponForm from './_form';

export default function CouponUpdate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Check if user has permission to update coupons
  if (!hasPermission("admin/coupons/update")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Update Coupon</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/coupons')}>
          Back to Coupons
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm isEdit={true} id={id} onSuccess={() => navigate('/admin/coupons')} onError={() => navigate('/admin/coupons')} />
        </CardContent>
      </Card>
    </>
  );
}

