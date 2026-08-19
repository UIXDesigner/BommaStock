import { formatInrFromPaise } from "../lib/money";
import { cn } from "../lib/utils";

export type PriceDisplayProps = {
  paise: number;
  className?: string;
};

export function PriceDisplay({ paise, className }: PriceDisplayProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {formatInrFromPaise(paise)}
    </span>
  );
}
