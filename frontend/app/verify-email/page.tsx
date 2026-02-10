import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="verify-page">
          <div className="verify-container">
            <div className="spinner"></div>
            <h2>Loading...</h2>
          </div>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
