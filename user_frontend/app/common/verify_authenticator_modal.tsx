import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";

interface AuthenticatorModalProps {
  onNext: (secretKey: string) => void;
  onClose: () => void;
}

const AuthenticatorModal: React.FC<AuthenticatorModalProps> = ({
  onNext,
  onClose,
}) => {
  const { user } = useAuth();
  const [secretKey, setSecretKey] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQrModal = async () => {
      if (user?.user_id) {
        try {
          const response = await authService.getQrModal(user.user_id);
          if (response.status === 1) {
            setQrCode(response.data.qrCode);
            setSecretKey(response.data.secretKey);
          } else {
            toast.error(response.message || "Failed to load QR code");
            onClose();
          }
        } catch (error: any) {
          toast.error(
            error?.message || "An error occurred while loading QR code",
          );
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQrModal();
  }, [user?.user_id, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    toast.success("Secret key copied");
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-start sm:pt-3 sm:pb-0 px-4 sm:px-0">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-[590px] sm:w-[570px] sm:h-[550px] p-2 sm:p-6 flex flex-col">
        {/* Header */}
        <div className="text-card-foreground text-center py-3 border-b border-border">
          <h5 className="text-xl font-semibold mb-0">
            Set up Authenticator App
          </h5>
        </div>

        {/* Instruction */}
        <div className="px-2 sm:px-4 pt-2 text-sm text-muted-foreground text-center">
          In the Google Authenticator app, tap <strong>+</strong> and choose{" "}
          <strong>Scan a QR code</strong>.
        </div>

        {/* QR Code & Secret */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto my-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Loading QR Code...
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-[200px] h-[200px]"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              <p className="text-muted-foreground font-semibold inline-block px-2 py-2 relative z-10 mt-2">
                OR enter the code manually
              </p>

              <div className="flex mt-3 w-full max-w-110 border border-border rounded overflow-hidden">
                <input
                  type="text"
                  className="flex-1 px-5 py-2 text-sm border-none text-center outline-none bg-background text-foreground"
                  value={secretKey}
                  readOnly
                />

                <button
                  onClick={handleCopy}
                  className="px-4 bg-secondary hover:bg-secondary/80 rounded flex items-center justify-center"
                >
                  <Copy size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 px-0 sm:px-8 mt-5 border-t border-border pt-3">
          <button
            type="button"
            className="px-5 py-2 rounded border border-border text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="px-5 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onNext(secretKey)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthenticatorModal;
