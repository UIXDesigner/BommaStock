import { Button } from "@bommastock/ui";
import { addToCartAction } from "../lib/cart/actions";

export function AddToCartButton({
  assetId,
  assetLicenseId,
  label = "Add to cart",
  size = "sm",
  variant = "outline",
}: {
  assetId: string;
  assetLicenseId?: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "outline" | "default";
}) {
  return (
    <form action={addToCartAction}>
      <input type="hidden" name="assetId" value={assetId} />
      {assetLicenseId ? (
        <input type="hidden" name="assetLicenseId" value={assetLicenseId} />
      ) : null}
      <Button type="submit" size={size} variant={variant}>
        {label}
      </Button>
    </form>
  );
}
