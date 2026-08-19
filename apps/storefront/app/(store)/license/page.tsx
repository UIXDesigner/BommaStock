import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "License",
};

export default function LicensePage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-2xl px-4 py-16 md:px-6"
    >
      <h1 className="text-3xl font-semibold tracking-tight">License</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Bommastock sells license-based digital images. Catalog prices are
        GST-inclusive in INR. The Standard license is seeded for MVP. Additional
        licenses appear from catalog data, not from hard-coded UI.
      </p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        A purchase entitles the authenticated customer to a short-lived download
        of the private master file. Previews on this site are watermarked and
        are not a substitute for a licensed download.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to the library
        </Link>
      </p>
    </main>
  );
}
