"use client";

import { Button, Input, Label, cn } from "@bommastock/ui";
import Link from "next/link";
import { useActionState, type ComponentProps, type ReactNode } from "react";

export function AuthLegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function AuthSubmitButton({
  pending,
  children,
  className,
}: {
  pending: boolean;
  children: string;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      className={cn("w-full", className)}
      disabled={pending}
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}

const fieldControlClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function TextField({
  label,
  hint,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  id: string;
  hint?: string;
}) {
  const hintId = hint ? `${props.id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{label}</Label>
      <Input aria-describedby={hintId} {...props} />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function ReadOnlyField({
  id,
  label,
  value,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        value={value}
        readOnly
        disabled
        aria-describedby={hintId}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  id,
  hint,
  children,
  className,
  ...props
}: ComponentProps<"select"> & { label: string; id: string; hint?: string }) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        aria-describedby={hintId}
        className={cn(fieldControlClass, className)}
        {...props}
      >
        {children}
      </select>
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  id,
  name,
  label,
  required,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: ReactNode;
  required?: boolean;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        value="on"
        required={required}
        defaultChecked={defaultChecked}
        aria-required={required}
        className="mt-1 h-4 w-4 shrink-0 rounded border border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Label htmlFor={id} className="font-normal leading-5">
        {label}
      </Label>
    </div>
  );
}

export { useActionState };
