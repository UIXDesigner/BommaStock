"use client";

import { Button, Input, Label } from "@bommastock/ui";
import { useActionState, type ComponentProps } from "react";

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
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

export function TextField({
  label,
  ...props
}: ComponentProps<typeof Input> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{label}</Label>
      <Input {...props} />
    </div>
  );
}

export { useActionState };
