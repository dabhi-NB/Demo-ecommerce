"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, CheckCircle } from "lucide-react";
import { authService } from "../../services/auth.service";

type OtpModalProps = {
  secretKey: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const OtpModal: React.FC<OtpModalProps> = ({
  secretKey,
  onClose,
  onSuccess,
}) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalData, setModalData] = useState<{
    secretKey: string;
    id: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [nextAction, setNextAction] = useState<string | null>(null);

  useEffect(() => {
    const fetchModalData = async () => {
      try {
        const response = await authService.verifyOtpModal(secretKey);
        if (response.status === 1) {
          setModalData(response.data);
        } else {
          toast.error(response.message || "Failed to load verification modal");
          onClose();
        }
      } catch (error) {
        toast.error("An error occurred while loading verification modal");
        onClose();
      } finally {
        setModalLoading(false);
      }
    };

    fetchModalData();
  }, [secretKey, onClose]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await authService.optVerifyProcess({
        otp: otp,
        id: modalData?.id || "", // Use the ID from modal data
        secretKey: secretKey, // Include the secretKey in the payload
      });

      if (response.status === 1) {
        setSuccessMessage(response.message || "OTP verified successfully");
        setNextAction(response.next || null);
        setShowSuccess(true);
        setShowConfirm(false);
        setLoading(false);
      } else {
        setErrorMessage(response.message || "Verification failed.");
        setShowFailed(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Verify fail.");
      setShowFailed(true);
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-start pt-10 px-4 sm:px-0">
      {!showConfirm && !showFailed && (
        <div className="bg-card rounded-xl shadow-xl w-full max-w-[510px] p-10 px-15 flex flex-col relative z-50">
          <h5 className="text-center text-xl mb-4 text-card-foreground">
            Verify OTP
          </h5>
          <p className="text-muted-foreground text-center mb-4">
            Enter the 6-digit code from your authenticator app.
          </p>
          <label htmlFor="" className="pb-1 text-card-foreground">
            OTP Code <span className="text-destructive text-[13px]">*</span>
          </label>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" value={secretKey} />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full text-center border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
            <div className="flex justify-between gap-3">
              <button
                type="button"
                className="flex px-5 py-2 border border-border rounded text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex px-5 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 px-4">
          <div className="bg-card rounded-md shadow-xl w-full max-w-[500px] p-10 flex flex-col items-center justify-center relative z-50">
            <div
              className="text-orange-300 mb-4 transform transition-all"
              style={{
                animation: "confirmPop 3s ease forwards",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-25 h-25"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="1" />
                <line
                  x1="12"
                  y1="7"
                  x2="12"
                  y2="13"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="0.8" fill="currentColor" />
              </svg>
            </div>

            <h5 className="text-xl font-semibold mb-2 text-center text-card-foreground">
              Confirm OTP
            </h5>
            <p className="text-muted-foreground mb-4 text-center">
              Do you want to verify this OTP code?
            </p>

            <div className="flex gap-3">
              <button
                className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Yes"}
              </button>
              <button
                className="px-6 py-2 border border-border rounded text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 px-4">
          <div className="bg-card rounded-md shadow-xl w-full max-w-[500px] p-10 flex flex-col items-center relative z-50">
            <div
              className="text-green-500 mb-4 transform transition-all"
              style={{
                animation: "successPop 3s ease forwards",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-25 h-25"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="1" />
                <path
                  d="M9 12l2 2 4-4"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h5 className="text-[30px] font-semibold mb-2 text-center text-card-foreground">
              Success
            </h5>
            <p className="text-muted-foreground mb-4 text-[20px] text-center">
              {successMessage}
            </p>

            <button
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={() => {
                setShowSuccess(false);
                onClose();
                if (nextAction === "refresh") window.location.reload();
                if (onSuccess) onSuccess();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showFailed && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 px-4">
          <div className="bg-card rounded-md shadow-xl w-full max-w-[500px] p-10 flex flex-col items-center relative z-50">
            <div
              className="border-4 border-destructive rounded-full p-3 mb-10 flex items-center justify-center transform transition-all"
              style={{
                animation: "wigglePop2 3s ease forwards",
              }}
            >
              <X size={48} className="text-destructive" />
            </div>

            <h5 className="text-[30px] font-semibold mb-2 text-center text-card-foreground">
              Failed
            </h5>
            <p className="text-muted-foreground mb-4 text-[20px] text-center">
              {errorMessage}
            </p>

            <button
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={() => setShowFailed(false)}
            >
              OK
            </button>
          </div>

          <style>
            {`
        @keyframes confirmPop {
          0% { transform: scale(0.5) translateX(0); opacity: 0; }
          15% { transform: scale(1.2) translateX(-6px); opacity: 1; }
          30% { transform: scale(1) translateX(6px); }
          45% { transform: scale(1) translateX(-4px); }
          60% { transform: scale(1) translateX(4px); }
          75% { transform: scale(1) translateX(-2px); }
          100% { transform: scale(1) translateX(0); }
        }
        @keyframes successPop {
          0% { transform: scale(0.5) rotate(-10deg) translateY(0); opacity: 0; }
          15% { transform: scale(1.2) rotate(5deg) translateY(-6px); opacity: 1; }
          30% { transform: scale(1) rotate(-5deg) translateY(6px); }
          45% { transform: scale(1) rotate(3deg) translateY(-4px); }
          60% { transform: scale(1) rotate(-2deg) translateY(2px); }
          75% { transform: scale(1) rotate(1deg) translateY(-1px); }
          100% { transform: scale(1) rotate(0deg) translateY(0); }
        }
        @keyframes wigglePop2 {
          0% { transform: scale(0.5) rotate(-15deg) translateX(0); opacity: 0; }
          15% { transform: scale(1.3) rotate(10deg) translateX(6px); opacity: 1; }
          30% { transform: scale(1) rotate(-10deg) translateX(-6px); }
          45% { transform: scale(1) rotate(8deg) translateX(4px); }
          60% { transform: scale(1) rotate(-5deg) translateX(-2px); }
          75% { transform: scale(1) rotate(3deg) translateX(1px); }
          100% { transform: scale(1) rotate(0deg) translateX(0); }
        }
      `}
          </style>
        </div>
      )}
    </div>
  );
};

export default OtpModal;
