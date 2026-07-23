import { Suspense } from "react";
import PostClient from "./PostClient";

export const dynamic = "force-dynamic";

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="page-narrow empty-state" role="status">
            <div className="spinner" aria-hidden />
            <p>Loading post form...</p>
          </div>
        </main>
      }
    >
      <PostClient />
    </Suspense>
  );
}
