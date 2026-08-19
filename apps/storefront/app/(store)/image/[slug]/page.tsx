import { redirect } from "next/navigation";

export default async function ImageAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/images/${slug}`);
}
