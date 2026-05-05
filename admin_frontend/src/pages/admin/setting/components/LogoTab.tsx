import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveLogo } from '@/services/setting.service';
import AppConfig from '@/appConfig';

interface LogoTabProps {
  logoPreview: string;
  faviconPreview: string;
  setLogoPreview: (preview: string) => void;
  setFaviconPreview: (preview: string) => void;
  refetch: () => void;
}

export const LogoTab: React.FC<LogoTabProps> = ({
  logoPreview,
  faviconPreview,
  setLogoPreview,
  setFaviconPreview,
  refetch,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const apiBase = (AppConfig.API_URL || '').replace(/\/$/, '');

  // Mutation for uploading logo/favicons
  const uploadMutation = useMutation({
    mutationFn: ({ key, file }: { key: string; file: File }) => saveLogo(key, file),
    onSuccess: (response, variables) => {
      if (response.success && response.data?.value) {
        toast.success(response.message || 'Uploaded successfully');
        refetch();

        const fileUrl = `${apiBase}/upload/setting/${response.data.value}`;
        if (variables.key === 'setting.app_logo') setLogoPreview(fileUrl);
        if (variables.key === 'setting.app_favicon') setFaviconPreview(fileUrl);
      } else {
        toast.error(response.message || 'Upload failed');
      }
    },
    onError: () => toast.error('Upload failed'),
  });

  useEffect(() => {
    if (logoPreview && !logoPreview.startsWith('http') && !logoPreview.startsWith('data:')) {
      const cleanPath = logoPreview.replace(/^\/+/, '').replace(/^upload\//, ''); // Remove leading slashes and upload/
      setLogoPreview(`${apiBase}/upload/${cleanPath}`);
    } else if (!logoPreview) {
      const logoFileName = (window as any)?.appSettings?.['setting.app_logo'];
      if (logoFileName) {
        const cleanPath = logoFileName.replace(/^\/+/, '').replace(/^upload\//, '');
        setLogoPreview(`${apiBase}/upload/${cleanPath}`);
      }
    }
    if (faviconPreview && !faviconPreview.startsWith('http') && !faviconPreview.startsWith('data:')) {
      const cleanPath = faviconPreview.replace(/^\/+/, '').replace(/^upload\//, '');
      setFaviconPreview(`${apiBase}/upload/${cleanPath}`);
    } else if (!faviconPreview) {
      const faviconFileName = (window as any)?.appSettings?.['setting.app_favicon'];
      if (faviconFileName) {
        const cleanPath = faviconFileName.replace(/^\/+/, '').replace(/^upload\//, '');
        setFaviconPreview(`${apiBase}/upload/${cleanPath}`);
      }
    }
  }, [logoPreview, faviconPreview, apiBase]);

  // Handle file selection for logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle file selection for favicon
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload logo
  const handleLogoSave = () => {
    if (logoFile) uploadMutation.mutate({ key: 'setting.app_logo', file: logoFile });
  };

  // Upload favicon
  const handleFaviconSave = () => {
    if (faviconFile) uploadMutation.mutate({ key: 'setting.app_favicon', file: faviconFile });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* Logo */}
      <div className="space-y-4">
        <Label>
          App Logo <span className="text-red-500">*</span>
        </Label>
        {logoPreview && (
          <div className="w-32 h-32 border rounded-lg overflow-hidden">
            <img src={logoPreview} alt="App Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <Input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          disabled={uploadMutation.isPending}
        />
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleLogoSave}
          disabled={!logoFile || uploadMutation.isPending}
        >
          Save Logo
        </button>
      </div>

      {/* Favicon */}
      <div className="space-y-4">
        <Label>
          App Favicon <span className="text-red-500">*</span>
        </Label>
        {faviconPreview && (
          <div className="w-32 h-32 border rounded-lg overflow-hidden">
            <img src={faviconPreview} alt="App Favicon" className="w-full h-full object-contain" />
          </div>
        )}
        <Input
          ref={faviconInputRef}
          type="file"
          accept="image/*"
          onChange={handleFaviconChange}
          disabled={uploadMutation.isPending}
        />
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleFaviconSave}
          disabled={!faviconFile || uploadMutation.isPending}
        >
          Save Favicon
        </button>
      </div>
    </div>
  );
}
