import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function RootNotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        That image or category is not in the current catalog.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium underline"
      >
        Back to gallery
      </Link>
    </main>
  );
}
