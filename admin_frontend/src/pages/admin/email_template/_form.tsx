import { useState, useEffect, forwardRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  getEmailTemplateById,
  updateEmailTemplate,
} from "@/services/email_template.service";
import { toast } from "sonner";

interface EmailTemplateFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

const EmailTemplateForm = forwardRef<any, EmailTemplateFormProps>(
  ({ isEdit, id, onSuccess, onError }, _ref) => {
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const form = useForm({
      defaultValues: { title: "", subject: "", body: "" },
      mode: "onSubmit",
      shouldUnregister: false,
    });

    useEffect(() => {
      if (isEdit && id) {
        fetchEmailTemplate(id);
      }
    }, [id, isEdit]);

    const fetchEmailTemplate = async (templateId: string) => {
      setLoading(true);
      try {
        const template = await getEmailTemplateById(templateId);
        if (template)
          form.reset({
            title: template.title,
            subject: template.subject,
            body: template.body,
          });
      } catch (e) {
        toast.error("Failed to load email template");
        onError && onError();
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (values: {
      title: string;
      subject: string;
      body: string;
    }) => {
      setSubmitting(true);
      try {
        if (isEdit && id) {
          const response = await updateEmailTemplate(id, values);
          if (response?.status === 1) {
            toast.success(
              response.message || "Email template updated successfully",
            );
            onSuccess();
          } else {
            toast.error(response.message || "Failed to update email template");
          }
        }
      } catch (error) {
        toast.error("Failed to update email template");
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
            rules={{ required: "Title is required" }}
            render={({ field, fieldState }) => (
              <FormItem className="mb-4">
                <FormLabel>
                  Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Email template title" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            rules={{ required: "Subject is required" }}
            render={({ field, fieldState }) => (
              <FormItem className="mb-4">
                <FormLabel>
                  Subject <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Email subject" {...field} />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            rules={{ required: "Body is required" }}
            render={({ field, fieldState }) => (
              <FormItem className="mb-4">
                <FormLabel>
                  Body <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    className="w-full min-h-[120px] border rounded p-2"
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
                <div className="text-sm text-muted-foreground mt-1">
                  <strong>Available parameters:</strong> subject, message,
                  app_name
                  <br />
                  Use{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {"{{parameter_name}}"}
                  </code>{" "}
                  syntax (e.g., {"{{subject}}"}, {"{{message}}"},{" "}
                  {"{{app_name}}"})
                </div>
              </FormItem>
            )}
          />
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Update"}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

export default EmailTemplateForm;
