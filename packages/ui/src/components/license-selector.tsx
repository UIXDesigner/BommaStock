import { PriceDisplay } from "./price-display";
import { cn } from "../lib/utils";

export type LicenseOption = {
  id: string;
  name: string;
  pricePaise: number;
};

export type LicenseSelectorProps = {
  name?: string;
  options: LicenseOption[];
  defaultValue?: string;
  className?: string;
};

export function LicenseSelector({
  name = "licenseId",
  options,
  defaultValue,
  className,
}: LicenseSelectorProps) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      <legend className="text-sm font-medium">License</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-foreground"
        >
          <input
            type="radio"
            name={name}
            value={option.id}
            defaultChecked={option.id === defaultValue}
            className="accent-foreground"
          />
          <span className="flex flex-1 items-center justify-between gap-3">
            <span>{option.name}</span>
            <PriceDisplay paise={option.pricePaise} className="text-sm" />
          </span>
        </label>
      ))}
    </fieldset>
  );
}
