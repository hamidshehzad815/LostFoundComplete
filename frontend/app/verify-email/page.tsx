"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import "./verify.css";

export default function VerifyEmail() {
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
        setMessage(data.message || "Email verified successfully!");

        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
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
    <div className="verify-page">
      <div className="verify-container">
        {status === "loading" && (
          <>
            <div className="spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <p className="redirect-text">Redirecting to login page...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <button
              className="btn-primary"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
