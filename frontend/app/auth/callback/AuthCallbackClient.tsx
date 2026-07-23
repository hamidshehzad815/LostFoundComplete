"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken, setUser } from "@/lib/auth";
import "../../auth.css";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuthToken(token);
        setUser(user);
        router.push("/dashboard");
      } catch (error) {
        console.error("Error processing auth callback:", error);
        router.push("/login?error=auth_failed");
      }
    } else {
      router.push("/login?error=missing_credentials");
    }
  }, [searchParams, router]);

  return (
    <div className="verify-wrap">
      <div className="verify-card">
        <div className="spinner" style={{ margin: "0 auto" }} />
        <h1>Signing you in</h1>
        <p>Finishing authentication…</p>
      </div>
    </div>
  );
}
