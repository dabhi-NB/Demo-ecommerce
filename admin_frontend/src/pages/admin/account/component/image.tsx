import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

import { authService } from "@/services/auth.service";
import AppConfig from "@/appConfig";
import { toast } from "sonner";
import { Upload } from "lucide-react";

declare global {
  interface Window {
    Cropper: any;
  }
}

interface Props {
  onChange?: (file: File | null) => void;
}

const DEFAULT_AVATAR = `${AppConfig.DEFAULT_IMAGE}`;

// Builds URL from backend filename
const getImageUrl = (filename?: string) => {
  if (!filename) return DEFAULT_AVATAR;
  if (filename.startsWith("http")) return filename;
  return `${AppConfig.API_URL.replace(/\/$/, "")}/upload/profile/${filename}`;
};

export function ProfileImageUpload({ onChange }: Props) {
  const { user, updateUser } = useAuth();

  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<any>(null);

  const [open, setOpen] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [loading, setLoading] = useState(false);

  /* LOAD CROPPER CDN */
  useEffect(() => {
    if (!open) return;

    setFileSelected(false);
    cropperRef.current?.destroy();
    cropperRef.current = null;

    if (!window.Cropper) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href =
        "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css";
      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js";
      document.body.appendChild(script);
    }
  }, [open]);

  /* FILE SELECT */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imgRef.current) return;

    imgRef.current.src = URL.createObjectURL(file);

    const waitForCropper = setInterval(() => {
      if (!window.Cropper) return;

      clearInterval(waitForCropper);

      cropperRef.current?.destroy();
      cropperRef.current = new window.Cropper(imgRef.current!, {
        viewMode: 1,
        autoCropArea: 1,
      });

      setFileSelected(true);
    }, 100);
  };

  /* ROTATE */
  const rotateLeft = () => cropperRef.current?.rotate(-90);
  const rotateRight = () => cropperRef.current?.rotate(90);

  /* SAVE */
  const saveImage = async () => {
    if (!cropperRef.current || !user) return;

    setLoading(true);
    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 300,
        height: 300,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => {
          if (!b) reject(new Error("Image processing failed"));
          else resolve(b);
        }, "image/jpeg");
      });

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      // pass the File to the upload API (was passing filename by mistake)
      const res = await authService.uploadImage(file, user.user_id);

      if (res.status === 1) {
        // ✅ Use backend file name returned
        updateUser({ ...user, image: res.data.image });
        onChange?.(file);
        toast.success("Image uploaded successfully");
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* DELETE */
  const deleteImage = async () => {
    if (!user?.image) return;

    setLoading(true);
    try {
      if (!user?.user_id) throw new Error("User ID missing");
      const res = await authService.deleteImage(user.user_id);

      if (res.status === 1) {
        updateUser({ ...user, image: "" });
        onChange?.(null);
        toast.success("Image deleted");
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 p-6 border rounded bg-card w-full">
      {/* Avatar */}
      <img
        src={getImageUrl(user?.image)}
        className="w-24 h-24 rounded border object-cover"
        alt="Avatar"
      />

      <div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload size={20} strokeWidth={2.5} /> Upload new photo
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Change Avatar</DialogTitle>
              <DialogDescription>
                Upload and crop your profile image
              </DialogDescription>
            </DialogHeader>

            {/* Choose file */}
            <input
              type="file"
              hidden
              id="avatarFile"
              accept="image/png, image/gif, image/jpeg, image/webp, image/jpg"
              onChange={onFileChange}
            />

            <Button
              variant="secondary"
              onClick={() => document.getElementById("avatarFile")?.click()}
            >
              Choose File
            </Button>

            {/* IMAGE */}
            <div className="mt-3">
              <img
                ref={imgRef}
                src={getImageUrl(user?.image)}
                className="mx-auto max-h-[350px]"
                alt=""
              />
            </div>

            {/* ROTATE */}
            {fileSelected && (
              <div className="flex justify-center gap-3 mt-1">
                <Button variant="outline" onClick={rotateLeft}>
                  Rotate Left
                </Button>
                <Button variant="outline" onClick={rotateRight}>
                  Rotate Right
                </Button>
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-between mt-6">
              <Button
                variant="destructive"
                disabled={!user?.image || loading}
                onClick={deleteImage}
              >
                Delete Image
              </Button>
              <Button disabled={!fileSelected || loading} onClick={saveImage}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-sm text-muted-foreground mt-1">
          Allowed JPG, GIF or PNG.
        </div>
      </div>
    </div>
  );
}
