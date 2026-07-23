import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";
import "../../auth.css";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="verify-wrap">
          <div className="verify-card">
            <div className="spinner" style={{ margin: "0 auto" }} />
            <h1>Signing you in</h1>
            <p>Finishing authentication…</p>
          </div>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
