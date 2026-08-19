import { ImageGrid } from "./image-grid";
import { Skeleton } from "./skeleton";

export function ImageGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading images">
      <ImageGrid>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-[3/2] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </ImageGrid>
    </div>
  );
}
