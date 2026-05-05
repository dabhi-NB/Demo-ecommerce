import { useState, useEffect, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getPageById, updatePage} from '@/services/page.service';
import { toast } from 'sonner';

interface PageFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

const PageForm = forwardRef<any, PageFormProps>(({ isEdit, id, onSuccess, onError }, _ref) => {
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({
    defaultValues: { title: '', body: '' },
    mode: 'onSubmit',
    shouldUnregister: false,
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchPage(id);
    }
  }, [id, isEdit]);

  const fetchPage = async (pageId: string) => {
    setLoading(true);
    try {
      const page = await getPageById(pageId);
      if (page) form.reset({ title: page.title, body: page.body });
    } catch (e) {
      toast.error('Failed to load page');
      onError && onError();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: { title: string;  body: string }) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        const response = await updatePage(id, values);
        if (response?.status === 1) {
          toast.success(response.message || 'Page updated successfully');
          onSuccess();
        } else {
          toast.error(response.message || 'Failed to update page');
        }
      }
    } catch (error) {
      toast.error('Failed to update page');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField 
          control={form.control}
          name="title"
          rules={{ required: 'Title is required' }}
          render={({ field, fieldState }) => (
            <FormItem className="mb-4" >
              <FormLabel>
                Title <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Page title" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          rules={{ required: 'Body is required' }}
          render={({ field, fieldState }) => (
            <FormItem className="mb-4">
              <FormLabel>Body <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <textarea {...field} className="w-full min-h-[120px] border rounded p-2" />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
        <div className="flex gap-2 mt-4">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
        </div>
      </form>
    </Form>
  );
});

export default PageForm;
