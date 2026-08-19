import { requireUser } from "@bommastock/auth/next";
import type { ReactNode } from "react";
import { auth } from "../../../auth";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser(() => auth());
  return children;
}
