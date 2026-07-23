import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="page messages-page">
          <div className="loading-state">
            <div className="spinner" />
            <p className="muted">Loading messages...</p>
          </div>
        </main>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
