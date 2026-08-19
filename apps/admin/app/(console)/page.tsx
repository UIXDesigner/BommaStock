import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PriceDisplay,
} from "@bommastock/ui";
import { getDashboardOverview } from "../../lib/mock-dashboard";

export default function AdminDashboardPage() {
  const overview = getDashboardOverview();

  const stats = [
    {
      label: "Total assets",
      value: overview.totalAssets.toLocaleString("en-IN"),
    },
    { label: "Published", value: overview.published.toLocaleString("en-IN") },
    { label: "Draft", value: overview.draft.toLocaleString("en-IN") },
    { label: "Archived", value: overview.archived.toLocaleString("en-IN") },
    { label: "Processing", value: overview.processing.toLocaleString("en-IN") },
    {
      label: "Failed processing",
      value: overview.failedProcessing.toLocaleString("en-IN"),
    },
    { label: "Orders", value: overview.orders.toLocaleString("en-IN") },
    { label: "Customers", value: overview.customers.toLocaleString("en-IN") },
    { label: "Downloads", value: overview.downloads.toLocaleString("en-IN") },
  ];

  return (
    <main
      id="main-content"
      className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:px-8"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Overview structure for assets, processing, orders, and customers.
          Figures are mock data until the database is connected.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-semibold tabular-nums">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Revenue (PAID)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-semibold tabular-nums">
              <PriceDisplay paise={overview.revenuePaise} />
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
