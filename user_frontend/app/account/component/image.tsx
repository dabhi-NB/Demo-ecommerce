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
  currentImage?: string;
  onChange?: (file: File | null) => void;
}
const DEFAULT_AVATAR = AppConfig.DEFULT_IMAGE;

const getImageUrl = (img?: string) => {
  if (!img) return DEFAULT_AVATAR;
  if (img.startsWith("http")) return img;
  return AppConfig.ADMIN_API_URL + "upload/user_profile/" + img;
};

export function ProfileImageUpload({ currentImage, onChange }: Props) {
  const { user, updateUser } = useAuth();

  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<any>(null);

  const [open, setOpen] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const rotateLeft = () => cropperRef.current?.rotate(-90);
  const rotateRight = () => cropperRef.current?.rotate(90);

  const saveImage = async () => {
    if (!cropperRef.current) return;

    setLoading(true);
    try {
      const canvas = cropperRef.current.getCroppedCanvas({
        width: 300,
        height: 300,
      }) as HTMLCanvasElement;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error("Image processing failed"));
            return;
          }
          resolve(blob);
        }, "image/jpeg");
      });

      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const res = await authService.uploadImage(file);

      if (res.status === 1) {
        updateUser({ ...user!, image: res.data.image });
        onChange?.(file);
        toast.success("Avatar updated");
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async () => {
    if (!user?.image) return;

    setLoading(true);
    const res = await authService.deleteImage();

    if (res.status === 1) {
      updateUser({ ...user, image: "" });
      onChange?.(null);
      toast.success("Image deleted");
      setOpen(false);
    } else toast.error(res.message);

    setLoading(false);
  };

  return (
    <div className="flex gap-6 p-6 border rounded  w-full">
      <img
        src={getImageUrl(currentImage || user?.image)}
        className="w-24 h-24 rounded border object-cover"
        alt="Avatar"
      />

      <div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            asChild
            className="md:hidden  px-6 py-2 rounded shadow-md transition-transform active:scale-95"
          >
            <Button>
              <Upload size={20} strokeWidth={2.5} />
            </Button>
          </DialogTrigger>

          <DialogTrigger asChild className="hidden md:flex  w-full sm:w-auto">
            <Button>Upload new photo</Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Change Avatar</DialogTitle>
              <DialogDescription>
                Upload and crop your profile image
              </DialogDescription>
            </DialogHeader>

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

            <div className="mt-3">
              <img
                ref={imgRef}
                src={getImageUrl(user?.image)}
                className="mx-auto"
                alt=""
              />
            </div>

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
