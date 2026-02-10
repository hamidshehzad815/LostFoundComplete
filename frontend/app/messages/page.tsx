import { Suspense } from "react";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading messages...</div>}>
      <MessagesClient />
    </Suspense>
  );
}
