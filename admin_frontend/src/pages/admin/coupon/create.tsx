import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import CouponForm from './_form';

export default function CouponCreate() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to create coupons
  if (!hasPermission("admin/coupons/create")) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Coupon</h1>
        <Button variant="secondary" onClick={() => navigate('/admin/coupons')}>
          Back to Coupons
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponForm isEdit={false} onSuccess={() => navigate('/admin/coupons')} />
        </CardContent>
      </Card>
    </>
  );
}
