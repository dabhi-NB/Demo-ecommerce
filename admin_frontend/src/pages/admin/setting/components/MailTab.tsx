import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { saveSmtpSettings, sendTestEmail, type SmtpSettings } from '@/services/setting.service';

interface MailTabProps {
  form: SmtpSettings;
  setForm: (form: SmtpSettings) => void;
  refetch: () => void;
}

export function MailTab({ form, setForm, refetch }: MailTabProps) {
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const smtpMutation = useMutation({
    mutationFn: saveSmtpSettings,
    onSuccess: (response) => {
      if (response.status === 1) {
        refetch();
        setTimeout(() => toast.success(response.message || 'SMTP settings saved successfully'), 100);
      } else {
        toast.error(response.message || 'Failed to save SMTP settings');
      }
    },
    onError: () => toast.error('Failed to save SMTP settings')
  });

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (response) => {
      if (response.status === 1) {
        toast.success(response.message || 'Test email sent successfully');
        setTestEmailOpen(false);
        setTestEmail('');
      } else {
        toast.error(response.message || 'Failed to send test email');
      }
    },
    onError: () => toast.error('Failed to send test email')
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); smtpMutation.mutate(form); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="smtp_host">Host <span className="text-red-500">*</span></Label>
          <Input id="smtp_host" value={form['mail.mailers.smtp.host']} onChange={(e) => setForm({ ...form, 'mail.mailers.smtp.host': e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_encryption">Encryption</Label>
          <Select value={form['mail.mailers.smtp.encryption']} onValueChange={(value: 'ssl' | 'tls') => setForm({ ...form, 'mail.mailers.smtp.encryption': value })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select encryption" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value="tls">TLS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_port">Port <span className="text-red-500">*</span></Label>
          <Input id="smtp_port" value={form['mail.mailers.smtp.port']} onChange={(e) => setForm({ ...form, 'mail.mailers.smtp.port': e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_username">Username <span className="text-red-500">*</span></Label>
          <Input id="smtp_username" value={form['mail.mailers.smtp.username']} onChange={(e) => setForm({ ...form, 'mail.mailers.smtp.username': e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_password">Password <span className="text-red-500">*</span></Label>
          <Input id="smtp_password" type="password" value={form['mail.mailers.smtp.password']} onChange={(e) => setForm({ ...form, 'mail.mailers.smtp.password': e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mail_from_name">Mail From Name <span className="text-red-500">*</span></Label>
          <Input id="mail_from_name" value={form['mail.from.name']} onChange={(e) => setForm({ ...form, 'mail.from.name': e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mail_from_address">Mail From Address <span className="text-red-500">*</span></Label>
          <Input id="mail_from_address" type="email" value={form['mail.from.address']} onChange={(e) => setForm({ ...form, 'mail.from.address': e.target.value })} required />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={smtpMutation.isPending}>
          {smtpMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit'}
        </Button>
        <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">Send Test Email</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>Enter an email address to send a test email</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); testEmailMutation.mutate(testEmail); }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test_email">Email <span className="text-red-500">*</span></Label>
                  <Input id="test_email" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} required />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
                  <Button type="button" disabled={testEmailMutation.isPending} onClick={() => testEmailMutation.mutate(testEmail)}>
                    {testEmailMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}


