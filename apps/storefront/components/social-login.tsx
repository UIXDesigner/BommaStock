"use client";

import type { SocialProviderId, SocialProviderStatus } from "@bommastock/auth";
import { Button, buttonVariants, cn } from "@bommastock/ui";
import Link from "next/link";
import type { ReactNode } from "react";
import { socialSignInAction } from "../lib/auth-actions";

export const stadiumClass =
  "h-[52px] w-full rounded-full text-[15px] font-semibold shadow-none";

export const googleFillClass =
  "border-transparent bg-[#4285F4] text-white hover:bg-[#3367D6] hover:text-white focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 disabled:opacity-[0.85] disabled:hover:bg-[#4285F4]";

export const emailFillClass =
  "border-transparent bg-[#FF4D8D] text-white hover:bg-[#F43F8C] hover:text-white focus-visible:ring-[#FF4D8D] focus-visible:ring-offset-2";

export const brandFillClass = emailFillClass;

export const guestFillClass =
  "border-transparent bg-[#E8E8E8] font-medium text-[#6B7280] hover:bg-[#DDDDDD] hover:text-[#4B5563]";

const FALLBACK_GOOGLE: SocialProviderStatus = {
  id: "google",
  label: "Google",
  configured: false,
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.26-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function OutlookMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4">
      <path fill="#F35325" d="M1 1h7.5v7.5H1z" />
      <path fill="#81BC06" d="M9.5 1H17v7.5H9.5z" />
      <path fill="#05A6F0" d="M1 9.5h7.5V17H1z" />
      <path fill="#FFBA08" d="M9.5 9.5H17V17H9.5z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      className="size-4"
      fill="currentColor"
    >
      <path d="M13.02 9.4c.02-1.68 1.37-2.48 1.43-2.52-0.78-1.14-2-1.3-2.43-1.32-1.04-.1-2.02.61-2.55.61-.52 0-1.33-.6-2.2-.58-1.13.02-2.17.66-2.75 1.67-1.17 2.03-.3 5.04.84 6.69.56.81 1.22 1.72 2.09 1.69.84-.03 1.16-.54 2.17-.54 1.02 0 1.3.54 2.2.52.91-.02 1.48-.82 2.03-1.64.64-.93.9-1.83.92-1.88-.02-.01-1.75-.67-1.75-2.7ZM11.5 4.3c.46-.56.77-1.33.68-2.1-.66.03-1.46.44-1.93 1-.42.49-.79 1.28-.69 2.04.73.06 1.48-.37 1.94-.94Z" />
    </svg>
  );
}

const PROVIDER_ICONS: Record<SocialProviderId, () => ReactNode> = {
  google: GoogleMark,
  "microsoft-entra-id": OutlookMark,
  apple: AppleMark,
};

function SocialSubmitButton({
  provider,
  callbackUrl,
  enabled,
  className,
  children,
  fullWidth = false,
  "aria-label": ariaLabel,
}: {
  provider: SocialProviderStatus;
  callbackUrl: string;
  enabled: boolean;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
  "aria-label": string;
}) {
  const unavailableTitle = !enabled
    ? `${provider.label} sign-in is not configured in this environment.`
    : undefined;

  return (
    <form
      action={socialSignInAction}
      className={fullWidth ? "w-full" : undefined}
    >
      <input type="hidden" name="provider" value={provider.id} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <span
        className={cn("inline-flex", fullWidth && "w-full")}
        title={unavailableTitle}
      >
        <Button
          type="submit"
          disabled={!enabled}
          aria-label={ariaLabel}
          className={className}
        >
          {children}
        </Button>
      </span>
    </form>
  );
}

export function GoogleAuthButton({
  callbackUrl,
  providers,
  authConfigured,
  label,
}: {
  callbackUrl: string;
  providers: SocialProviderStatus[];
  authConfigured: boolean;
  label: string;
}) {
  const google =
    providers.find((provider) => provider.id === "google") ?? FALLBACK_GOOGLE;
  const enabled = authConfigured && google.configured;

  return (
    <SocialSubmitButton
      provider={google}
      callbackUrl={callbackUrl}
      enabled={enabled}
      fullWidth
      aria-label={label}
      className={cn(stadiumClass, googleFillClass, "w-full")}
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-white">
        <GoogleMark />
      </span>
      {label}
    </SocialSubmitButton>
  );
}

export function AlternateSocialRow({
  callbackUrl,
  providers,
  authConfigured,
  verb,
}: {
  callbackUrl: string;
  providers: SocialProviderStatus[];
  authConfigured: boolean;
  verb: "Sign up" | "Continue";
}) {
  const alternates = providers.filter((provider) => provider.id !== "google");

  if (alternates.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      <span className="text-xs text-muted-foreground">Also</span>
      {alternates.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.id];
        const enabled = authConfigured && provider.configured;
        const label = `${verb} with ${provider.label}`;
        return (
          <SocialSubmitButton
            key={provider.id}
            provider={provider}
            callbackUrl={callbackUrl}
            enabled={enabled}
            aria-label={label}
            className="size-9 rounded-full border border-transparent bg-[#F3F4F6] p-0 text-foreground hover:bg-[#E5E7EB] disabled:opacity-60"
          >
            <Icon />
          </SocialSubmitButton>
        );
      })}
    </div>
  );
}

export function AuthOrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#E5E7EB]" aria-hidden="true" />
      <span className="text-[13px] text-[#9CA3AF]">Or</span>
      <span className="h-px flex-1 bg-[#E5E7EB]" aria-hidden="true" />
    </div>
  );
}

export function GuestContinueLink() {
  return (
    <Link
      href="/explore"
      className={cn(
        buttonVariants({ variant: "secondary" }),
        stadiumClass,
        guestFillClass,
      )}
    >
      Continue as a Guest
    </Link>
  );
}

export function EmailAuthLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "default" }),
        stadiumClass,
        emailFillClass,
      )}
    >
      {children}
    </Link>
  );
}
