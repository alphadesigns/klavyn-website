import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container not-found">
      <div>
        <h1>This page doesn’t exist</h1>
        <p>The link may be old, or the address may have a typo.</p>
        <div className="btn-row">
          <Link href="/" className="btn btn--primary">
            Go to the home page
          </Link>
          <Link href="/security" className="btn btn--secondary">
            Read the security model
          </Link>
        </div>
      </div>
    </div>
  );
}
