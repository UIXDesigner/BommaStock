import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "../lib/utils";

export type SearchBarProps = {
  action?: string;
  name?: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  size?: "default" | "sm";
  showSubmitButton?: boolean;
  suggestions?: ReactNode;
  className?: string;
};

export function SearchBar({
  action = "/search",
  name = "q",
  id,
  defaultValue,
  placeholder = "Search images, categories, or codes",
  label = "Search images",
  size = "default",
  showSubmitButton = true,
  suggestions,
  className,
}: SearchBarProps) {
  const fieldId = id ?? name;
  const compact = size === "sm";

  return (
    <div className={cn("w-full", className)}>
      <form
        action={action}
        method="get"
        role="search"
        className="flex w-full items-center gap-2"
      >
        <Label htmlFor={fieldId} className="sr-only">
          {label}
        </Label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={fieldId}
            name={name}
            type="search"
            defaultValue={defaultValue}
            placeholder={placeholder}
            autoComplete="off"
            className={cn("rounded-md pr-3 pl-10", compact ? "h-10" : "h-12")}
          />
        </div>
        {showSubmitButton ? (
          <Button type="submit" className={compact ? "h-10 px-4" : "h-12 px-5"}>
            Search
          </Button>
        ) : (
          <button type="submit" className="sr-only">
            Search
          </button>
        )}
      </form>
      {suggestions}
    </div>
  );
}
