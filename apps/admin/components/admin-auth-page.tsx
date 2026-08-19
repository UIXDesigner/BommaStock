import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bommastock/ui";
import type { ReactNode } from "react";

export function AdminAuthPage({
  title,
  description,
  configured,
  children,
}: {
  title: string;
  description: string;
  configured: boolean;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16"
    >
      <p className="mb-6 text-center text-lg font-semibold tracking-tight">
        Bommastock Admin
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {configured ? null : (
            <p className="text-sm text-muted-foreground" role="status">
              Authentication is not configured. Set DATABASE_URL and AUTH_SECRET
              to enable sign-in.
            </p>
          )}
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
