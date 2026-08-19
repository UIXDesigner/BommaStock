/**
 * Isolated admin dashboard figures for the shell until PostgreSQL
 * aggregations are wired. Replace `getDashboardOverview()` with repository
 * counts from Asset, Order, Payment, User, and Download.
 */
export type DashboardOverview = {
  totalAssets: number;
  published: number;
  draft: number;
  archived: number;
  processing: number;
  failedProcessing: number;
  orders: number;
  revenuePaise: number;
  customers: number;
  downloads: number;
};

export function getDashboardOverview(): DashboardOverview {
  return {
    totalAssets: 48,
    published: 32,
    draft: 12,
    archived: 4,
    processing: 2,
    failedProcessing: 1,
    orders: 19,
    revenuePaise: 2_485_000,
    customers: 86,
    downloads: 142,
  };
}

export type AdminAssetRow = {
  code: string;
  title: string;
  processingStatus: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  productStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export function listAdminAssetRows(): AdminAssetRow[] {
  return [
    {
      code: "BS-20260815-000001",
      title: "Ornate Ganesha in Sanctum Light",
      processingStatus: "READY",
      productStatus: "PUBLISHED",
    },
    {
      code: "BS-20260815-000002",
      title: "Goddess Durga on a Golden Throne",
      processingStatus: "PROCESSING",
      productStatus: "DRAFT",
    },
    {
      code: "BS-20260814-000003",
      title: "Hanuman Blessing Against Blue Sky",
      processingStatus: "FAILED",
      productStatus: "DRAFT",
    },
    {
      code: "BS-20260813-000004",
      title: "Untitled Asset",
      processingStatus: "UPLOADED",
      productStatus: "DRAFT",
    },
  ];
}
