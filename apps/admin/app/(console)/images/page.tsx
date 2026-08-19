import { Badge, Button, Card, EmptyState } from "@bommastock/ui";
import type { Metadata } from "next";
import { listAdminAssetRows } from "../../../lib/mock-dashboard";

export const metadata: Metadata = {
  title: "Images",
};

function processingTone(status: string) {
  if (status === "READY") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "PROCESSING") return "warning" as const;
  return "neutral" as const;
}

function productTone(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "warning" as const;
}

export default function AdminImagesPage() {
  const rows = listAdminAssetRows();

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Images</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Catalog management structure. Upload, processing, and publish
            actions are not wired in this slice.
          </p>
        </div>
        <Button disabled>Upload image</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title="No images yet"
          description="Uploaded masters will appear here after processing jobs complete."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/60 text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Processing</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.code}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {row.code}
                    </td>
                    <td className="px-4 py-3">{row.title}</td>
                    <td className="px-4 py-3">
                      <Badge tone={processingTone(row.processingStatus)}>
                        {row.processingStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={productTone(row.productStatus)}>
                        {row.productStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}
