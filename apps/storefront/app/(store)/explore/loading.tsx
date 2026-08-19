import { ImageGridSkeleton } from "@bommastock/ui";

export default function ExploreLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="mb-10 h-10 w-48 rounded-md bg-secondary" />
      <ImageGridSkeleton />
    </main>
  );
}
