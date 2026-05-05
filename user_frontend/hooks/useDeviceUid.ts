import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Custom hook to manage device UID from URL params or localStorage
 * Consolidates duplicate device UID logic from login, register, and OTP flows
 */
export function useDeviceUid() {
  const searchParams = useSearchParams();
  const [deviceUid, setDeviceUid] = useState("");

  useEffect(() => {
    const paramUid = (searchParams.get("device_uid") || "").trim();
    const storedUid = (localStorage.getItem("device_uid") || "").trim();

    // Priority: URL param > localStorage > generate new
    const resolvedUid = paramUid || storedUid || generateDeviceId(32);

    localStorage.setItem("device_uid", resolvedUid);
    setDeviceUid(resolvedUid);
  }, [searchParams]);

  return deviceUid;
}

/**
 * Generate a random device ID
 */
function generateDeviceId(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
