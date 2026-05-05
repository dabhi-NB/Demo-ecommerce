import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, CheckCircle } from 'lucide-react';

interface SetupAuthenticatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  qrCodeUrl?: string;
  secretKey?: string;
  title?: string;
  description?: string;
}

export function SetupAuthenticatorModal({
  open,
  onOpenChange,
  onSuccess,
  qrCodeUrl,
  secretKey,
  title = "Setup Authenticator",
  description = "Scan the QR code with your authenticator app or enter the code manually."
}: SetupAuthenticatorModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCode('');
      setCopied(false);
    }
  }, [open]);

  const handleCopySecret = async () => {
    if (secretKey) {
      try {
        await navigator.clipboard.writeText(secretKey);
        setCopied(true);
        toast.success('Secret key copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy secret key');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // You can implement the actual verification API call here
      // For now, this is a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast.success('Authenticator setup completed successfully');
      onSuccess?.();
      onOpenChange(false);
      setCode('');
    } catch (error: any) {
      toast.error(error?.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCode('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Section */}
          {qrCodeUrl && (
            <div className="text-center">
              <Card className="p-4 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for Authenticator"
                  className="w-48 h-48 mx-auto"
                />
              </Card>
            </div>
          )}

          {/* Manual Entry Section */}
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md inline-block">
                OR enter the code manually
              </div>
            </div>

            {secretKey && (
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-sm font-medium">
                  Secret Key
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secretKey"
                    type="text"
                    value={secretKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySecret}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Verification Code Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authenticator-code">Verification Code</Label>
              <Input
                id="authenticator-code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                }}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                autoFocus
              />
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || code.length !== 6}>
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SetupAuthenticatorModal;
