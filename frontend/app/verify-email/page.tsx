import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";
import "../auth.css";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="verify-wrap">
          <div className="verify-card">
            <div className="spinner" style={{ margin: "0 auto" }} />
            <h1>Loading</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
