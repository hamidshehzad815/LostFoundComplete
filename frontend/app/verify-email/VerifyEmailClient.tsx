"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import "../auth.css";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/api/verify-email?token=${token}`,
      );
      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully.");
        setTimeout(() => router.push("/login?verified=true"), 3000);
      } else {
        setStatus("error");
        setMessage(data.message || "Verification failed");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "Failed to verify email");
    }
  };

  return (
    <div className="verify-wrap">
      <div className="verify-card">
        {status === "loading" && (
          <>
            <div className="spinner" style={{ margin: "0 auto" }} />
            <h1>Verifying email</h1>
            <p>One moment while we confirm your address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="badge badge-found" style={{ margin: "0 auto" }}>
              Verified
            </div>
            <h1>You&apos;re all set</h1>
            <p>{message}</p>
            <p className="muted">Redirecting to login…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="badge badge-lost" style={{ margin: "0 auto" }}>
              Failed
            </div>
            <h1>Verification failed</h1>
            <p>{message}</p>
            <button className="btn btn-primary" onClick={() => router.push("/login")}>
              Go to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
