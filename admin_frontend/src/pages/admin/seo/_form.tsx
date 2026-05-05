import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import General from "@/helper/general";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createSeoMeta,
  updateSeoMeta,
  getSeoMetaById,
} from "@/services/seo.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SeoMetaFormProps {
  isEdit: boolean;
  id?: string;
  onSuccess: () => void;
  onError?: () => void;
}

const SeoMetaForm = forwardRef<any, SeoMetaFormProps>(
  ({ isEdit, id, onSuccess }, ref) => {
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);

    const form = useForm({
      defaultValues: {
        url: "",
        title: "",
        keyword: "",
        description: "",
        last_modified: General.currentTime("YYYY-MM-DDTHH:mm"),
        change_frequency: "Select Frequency",
        priority: 1,
        sitemap_enable: 1,
      },
      mode: "onSubmit",
    });

    const sitemapEnabled = form.watch("sitemap_enable");

    useEffect(() => {
      if (isEdit && id) {
        fetchSeoMeta(id);
      }
    }, [id, isEdit]);

    const fetchSeoMeta = async (seoMetaId: string) => {
      try {
        setLoading(true);
        const seoMeta = await getSeoMetaById(seoMetaId);

        form.reset({
          url: seoMeta.url ?? "",
          title: seoMeta.title ?? "",
          keyword: seoMeta.keyword ?? "",
          description: seoMeta.description ?? "",
          last_modified: seoMeta.last_modified ?? "",
          change_frequency: seoMeta.change_frequency ?? "Select Frequency",
          priority: seoMeta.priority ?? 1,
          sitemap_enable: seoMeta.sitemap_enable ?? 1,
        });
      } catch (error: any) {
        console.error("Error fetching SEO meta:", error.message);
        toast.error(error.message || "Failed to load SEO meta data");
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refetchSeoMeta: () => {
        if (id) {
          fetchSeoMeta(id);
        }
      },
    }));

    const onSubmit = async (values: any) => {
      try {
        setSubmitting(true);

        const formData = new FormData();
        formData.append("url", values.url);
        formData.append("title", values.title);
        formData.append("keyword", values.keyword || "");
        formData.append("description", values.description || "");
        formData.append("last_modified", values.last_modified || "");
        formData.append("change_frequency", values.change_frequency);
        formData.append("priority", String(values.priority));
        formData.append("sitemap_enable", String(values.sitemap_enable));

        console.log("FormData being sent:", Object.fromEntries(formData));

        let response;
        if (isEdit && id) {
          response = await updateSeoMeta(id, formData);
        } else {
          response = await createSeoMeta(formData as any);
        }

        if (response?.status === 1) {
          toast.success(
            response.message ||
              `SEO Meta ${isEdit ? "updated" : "created"} successfully`,
          );
          onSuccess();
        } else {
          toast.error(
            response.message ||
              `Failed to ${isEdit ? "update" : "create"} SEO meta`,
          );
        }
      } catch (error: any) {
        console.error(
          `Error ${isEdit ? "updating" : "creating"} SEO meta:`,
          error,
        );
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEdit ? "update" : "create"} SEO meta`;
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    if (loading) {
      return <div className="text-center py-10">Loading...</div>;
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="url"
                rules={{ required: "URL is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      URL <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., /home" {...field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field, fieldState }) => (
                  <FormItem>
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
            </div>

            <FormField
              control={form.control}
              name="keyword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SEO keywords (comma separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Meta description for search engines"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          {/* Sitemap Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground border-b pb-2">
              Sitemap Settings
            </h3>

            <FormField
              control={form.control}
              name="sitemap_enable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitemap Enable</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Enabled</SelectItem>
                      <SelectItem value="0">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={`space-y-4 mt-4 p-4 bg-muted rounded-lg border transition-all duration-200 ${sitemapEnabled === 1 ? "opacity-100" : "d-none opacity-0 pointer-events-none"}`}
            >
              <h4 className="text-md font-medium text-muted-foreground">
                Sitemap Configuration
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  rules={{
                    required:
                      sitemapEnabled === 1 ? "Priority is required" : false,
                    min: {
                      value: 0,
                      message: "Priority must be between 0 and 1",
                    },
                    max: {
                      value: 1,
                      message: "Priority must be between 0 and 1",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Priority{" "}
                        {sitemapEnabled === 1 && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          placeholder="0.5"
                          disabled={sitemapEnabled !== 1}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_modified"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Last Modified</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          disabled={sitemapEnabled !== 1}
                          {...field}
                          value={
                            field.value ||
                            General.currentTime("YYYY-MM-DDTHH:mm")
                          }
                        />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="change_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={sitemapEnabled !== 1}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Select Frequency">
                            Select Frequency
                          </SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={submitting} className="px-8">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update SEO Meta"
              ) : (
                "Create SEO Meta"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  },
);

SeoMetaForm.displayName = "SeoMetaForm";

export default SeoMetaForm;
