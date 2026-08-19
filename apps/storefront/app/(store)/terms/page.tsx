import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

export default function TermsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-2xl px-4 py-16 md:px-6"
    >
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms and Conditions
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated 19 August 2026. These terms apply to customer accounts on
        the Bommastock storefront.
      </p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            1. Bommastock
          </h2>
          <p className="mt-2">
            Bommastock is a digital image marketplace for Indian cultural and
            devotional artwork, illustrations, and printable assets. By creating
            an account you agree to these terms and to the{" "}
            <Link
              href="/license"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              License
            </Link>{" "}
            that governs purchased files.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            2. Accounts
          </h2>
          <p className="mt-2">
            You must provide an accurate email and keep your password private.
            Email is your sign-in identity and cannot be changed from the
            account screens in this version of the product. You may update your
            display name, mobile number, billing address, and invoice details.
            We may disable accounts that are abused or used to attack the
            service.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            3. Previews and masters
          </h2>
          <p className="mt-2">
            Gallery thumbnails and watermarked previews are for discovery only.
            High-resolution master files stay private. A purchase entitles the
            signed-in customer to a short-lived download of the master. You must
            not attempt to remove watermarks, scrape the library, or obtain
            masters without a paid entitlement.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            4. Licenses and use
          </h2>
          <p className="mt-2">
            Each purchase is a license to use that image under the license you
            select at checkout, not a transfer of copyright. Catalog prices are
            GST-inclusive in Indian rupees. License scope is described on the
            License page and on the image you buy. Do not redistribute masters
            as stock, claim authorship of Bommastock originals, or use an image
            beyond the license you paid for.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            5. Payments
          </h2>
          <p className="mt-2">
            Checkout amounts are calculated on the server from live catalog
            prices. Payment is processed by Razorpay. Card numbers, PAN, and CVV
            are entered on Razorpay Checkout and are not stored in Bommastock
            databases. You may save a billing name, India address, and optional
            GSTIN for invoices. Download access exists only after the order is
            paid and the payment is captured.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            6. Your data
          </h2>
          <p className="mt-2">
            We keep account, order, and download records needed to run the
            marketplace. Address and GSTIN are used for billing. We do not sell
            customer lists. Password hashes are never shown in the product.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            7. Acceptable use
          </h2>
          <p className="mt-2">
            Do not use Bommastock to harm others, violate Indian law, attack our
            systems, or resell access to the library. Automated harvesting of
            the catalog is not allowed.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            8. Changes
          </h2>
          <p className="mt-2">
            We may update these terms as the product grows. The date above will
            change when we do. Continued use of your account after an update
            means you accept the revised terms. New customers must accept these
            terms to register.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            9. Governing law
          </h2>
          <p className="mt-2">
            These terms are governed by the laws of India. They are written for
            Bommastock customers and are not copied from another stock library.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/register" className="underline-offset-4 hover:underline">
          Create an account
        </Link>
        {" · "}
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to the library
        </Link>
      </p>
    </main>
  );
}
