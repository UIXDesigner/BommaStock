import { getPrisma } from "@bommastock/database";
import { publicUrl } from "@bommastock/storage";
import type { CatalogAsset, CatalogCategory } from "./types";

function lineageActive(
  categoriesById: Map<
    string,
    { id: string; parentId: string | null; status: string }
  >,
  categoryId: string | null,
): boolean {
  let currentId = categoryId;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const category = categoriesById.get(currentId);
    if (!category || category.status !== "ACTIVE") {
      return false;
    }
    currentId = category.parentId;
  }
  return Boolean(categoryId);
}

export async function loadPrismaCatalog(): Promise<{
  categories: CatalogCategory[];
  assets: CatalogAsset[];
} | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!publicBaseUrl) {
    return { categories: [], assets: [] };
  }

  const prisma = getPrisma();
  const [categoryRows, assetRows] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.asset.findMany({
      where: {
        productStatus: "PUBLISHED",
        processingStatus: "READY",
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        files: {
          where: {
            fileClass: { in: ["THUMBNAIL", "WATERMARKED_PREVIEW"] },
          },
        },
        licenses: {
          where: { isActive: true },
          include: { license: true },
        },
      },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const categoriesById = new Map(
    categoryRows.map((category) => [category.id, category]),
  );

  const categories: CatalogCategory[] = categoryRows
    .filter((category) => category.status === "ACTIVE")
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parentId: category.parentId,
    }));

  const assets: CatalogAsset[] = [];
  for (const row of assetRows) {
    if (
      !row.category ||
      !row.categoryId ||
      !row.width ||
      !row.height ||
      !row.format ||
      !row.orientation ||
      !row.publishedAt ||
      row.title === "Untitled Asset" ||
      !lineageActive(categoriesById, row.categoryId)
    ) {
      continue;
    }

    const thumbnail = row.files.find((file) => file.fileClass === "THUMBNAIL");
    const preview = row.files.find(
      (file) => file.fileClass === "WATERMARKED_PREVIEW",
    );
    if (!thumbnail || !preview) {
      continue;
    }

    const licenses = row.licenses
      .filter((item) => item.license.status === "ACTIVE")
      .map((item) => ({
        id: item.id,
        code: item.license.code,
        name: item.license.name,
        pricePaise: item.pricePaise,
        isDefault: item.isDefault,
      }));
    const defaultLicense = licenses.find((item) => item.isDefault);
    if (!defaultLicense) {
      continue;
    }

    assets.push({
      id: row.id,
      code: row.code,
      title: row.title,
      slug: row.slug,
      description: row.description ?? "",
      categoryId: row.categoryId,
      categoryName: row.category.name,
      categorySlug: row.category.slug,
      width: row.width,
      height: row.height,
      format: row.format,
      orientation: row.orientation,
      tags: row.tags.map((item) => item.tag.name),
      licenses,
      thumbnailPublicUrl: publicUrl(publicBaseUrl, thumbnail.storageKey),
      previewPublicUrl: publicUrl(publicBaseUrl, preview.storageKey),
      defaultLicenseName: defaultLicense.name,
      pricePaise: defaultLicense.pricePaise,
      publishedAt: row.publishedAt.toISOString(),
    });
  }

  return { categories, assets };
}
