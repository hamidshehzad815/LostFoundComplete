import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
            background: "var(--yellow)",
            paddingTop: "6rem",
          }}
        >
          <p style={{ fontWeight: 800 }}>Loading login...</p>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
