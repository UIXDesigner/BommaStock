import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "../lib/favorites/actions";
import { cn } from "@bommastock/ui";

export function FavoriteButton({
  assetId,
  favorited,
  compact = false,
}: {
  assetId: string;
  favorited: boolean;
  compact?: boolean;
}) {
  return (
    <form action={toggleFavoriteAction}>
      <input type="hidden" name="assetId" value={assetId} />
      <button
        type="submit"
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border bg-background/95 shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "size-9" : "h-10 gap-2 px-3",
        )}
      >
        <Heart
          className={cn(
            "size-4",
            favorited ? "fill-foreground text-foreground" : "text-foreground",
          )}
        />
        {compact ? null : (
          <span className="text-sm">{favorited ? "Saved" : "Save"}</span>
        )}
      </button>
    </form>
  );
}
