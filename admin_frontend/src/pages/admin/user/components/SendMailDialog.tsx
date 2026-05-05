import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { sendMail } from '@/services/user.service';

interface SendMailDialogProps {
  userEmail: string;
  children: React.ReactNode;
}

export function SendMailDialog({ userEmail, children }: SendMailDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!subject.trim() || !message.trim()) {
    toast.error('Please fill in all fields');
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await sendMail({
      to: userEmail,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (response.status === 1) {
      toast.success(response.message); // ✅ shows success icon
      setSubject('');
      setMessage('');
      setOpen(false);
    } else {
      toast.error(response.message || 'Failed to send mail'); // ❌ error icon
    }
  } catch (error) {
    toast.error('Failed to send mail');
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>Send Mail to User</DialogTitle>
          <DialogDescription>
            Send an email to {userEmail}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Mail'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
