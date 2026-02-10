import { Suspense } from "react";
import PostClient from "./PostClient";

export const dynamic = "force-dynamic";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading...
        </div>
      }
    >
      <PostClient />
    </Suspense>
  );
}
