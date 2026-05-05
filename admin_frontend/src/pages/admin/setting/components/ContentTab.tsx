import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { saveContentSettings, type ContentSettings } from '@/services/setting.service';

interface ContentTabProps {
  form: ContentSettings;
  setForm: (form: ContentSettings) => void;
  refetch: () => void;
}

export function ContentTab({ form, setForm, refetch }: ContentTabProps) {
  const contentMutation = useMutation({
    mutationFn: saveContentSettings,
    onSuccess: (response) => response.status === 1 ? (toast.success(response.message || 'Content settings saved successfully'), refetch()) : toast.error(response.message || 'Failed to save content settings'),
    onError: () => toast.error('Failed to save content settings')
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); contentMutation.mutate(form); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="header_content">Header</Label>
          <Textarea 
            id="header_content" 
            rows={8} 
            value={form['setting.header_content']} 
            onChange={(e) => setForm({ ...form, 'setting.header_content': e.target.value })} 
            placeholder="Header content" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footer_content">Footer</Label>
          <Textarea 
            id="footer_content" 
            rows={8} 
            value={form['setting.footer_content']} 
            onChange={(e) => setForm({ ...form, 'setting.footer_content': e.target.value })} 
            placeholder="Footer content" 
          />
        </div>
      </div>
      <Button type="submit" disabled={contentMutation.isPending}>
        {contentMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit'}
      </Button>
    </form>
  );
}
