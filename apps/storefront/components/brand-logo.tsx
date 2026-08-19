export function BrandLogo({
  className = "h-6 w-auto",
}: {
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt="Bommastock"
      width={285}
      height={40}
      className={className}
      decoding="async"
    />
  );
}
