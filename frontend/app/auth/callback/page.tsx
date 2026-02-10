import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)",
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            Completing sign in...
          </p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
