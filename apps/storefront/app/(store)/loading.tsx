import { ImageGridSkeleton } from "@bommastock/ui";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-6">
      <p className="sr-only">Loading images</p>
      <ImageGridSkeleton />
    </div>
  );
}
