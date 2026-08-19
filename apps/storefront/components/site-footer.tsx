import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { listRootCategories } from "../lib/catalog/catalog";

export async function SiteFooter() {
  const categories = await listRootCategories();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 md:px-6">
        <div>
          <Link
            href="/"
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            A premium marketplace for Indian cultural imagery, Hindu devotional
            artwork, and high-resolution printable assets.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Explore
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li>
              <Link
                href="/explore"
                className="text-muted-foreground hover:text-foreground"
              >
                Explore
              </Link>
            </li>
            <li>
              <Link
                href="/new"
                className="text-muted-foreground hover:text-foreground"
              >
                New
              </Link>
            </li>
            <li>
              <Link
                href="/categories"
                className="text-muted-foreground hover:text-foreground"
              >
                Categories
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Account
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li>
              <Link
                href="/account"
                className="text-muted-foreground hover:text-foreground"
              >
                Account
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="text-muted-foreground hover:text-foreground"
              >
                Create account
              </Link>
            </li>
            <li>
              <Link
                href="/favorites"
                className="text-muted-foreground hover:text-foreground"
              >
                Favorites
              </Link>
            </li>
            <li>
              <Link
                href="/cart"
                className="text-muted-foreground hover:text-foreground"
              >
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Legal
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li>
              <Link
                href="/license"
                className="text-muted-foreground hover:text-foreground"
              >
                License
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground"
              >
                Terms and Conditions
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Bommastock. All prices shown are
          GST-inclusive in INR.
        </p>
      </div>
    </footer>
  );
}
