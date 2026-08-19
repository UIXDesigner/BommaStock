import Link from "next/link";
import { POPULAR_SEARCHES } from "../lib/catalog/popular-searches";

export function PopularSearches({ className }: { className?: string }) {
  return (
    <p className={className}>
      <span className="text-xs tracking-wide uppercase">Popular</span>
      {POPULAR_SEARCHES.map((term) => (
        <Link
          key={term}
          href={`/search?q=${encodeURIComponent(term)}`}
          className="ml-3 text-sm underline-offset-4 hover:underline"
        >
          {term}
        </Link>
      ))}
    </p>
  );
}
