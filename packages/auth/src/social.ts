export const SOCIAL_PROVIDER_IDS = [
  "google",
  "microsoft-entra-id",
  "apple",
] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDER_IDS)[number];

export type SocialProviderStatus = {
  id: SocialProviderId;
  label: string;
  configured: boolean;
};

const SOCIAL_LABELS: Record<SocialProviderId, string> = {
  google: "Google",
  "microsoft-entra-id": "Outlook",
  apple: "Apple",
};

export function isSocialProviderId(value: unknown): value is SocialProviderId {
  return (
    typeof value === "string" &&
    (SOCIAL_PROVIDER_IDS as readonly string[]).includes(value)
  );
}

export function socialProviderLabel(id: SocialProviderId): string {
  return SOCIAL_LABELS[id];
}

function envValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export type SocialProviderEnv = {
  google: { clientId?: string; clientSecret?: string };
  microsoft: { clientId?: string; clientSecret?: string; issuer?: string };
  apple: { clientId?: string; clientSecret?: string };
};

export function getSocialProviderEnv(): SocialProviderEnv {
  const tenant = envValue(
    "AUTH_MICROSOFT_TENANT_ID",
    "AUTH_AZURE_AD_TENANT_ID",
  );
  const issuer =
    envValue(
      "AUTH_MICROSOFT_ISSUER",
      "AUTH_MICROSOFT_ENTRA_ID_ISSUER",
      "AUTH_AZURE_AD_ISSUER",
    ) ??
    (tenant ? `https://login.microsoftonline.com/${tenant}/v2.0` : undefined);

  return {
    google: {
      clientId: envValue("AUTH_GOOGLE_ID"),
      clientSecret: envValue("AUTH_GOOGLE_SECRET"),
    },
    microsoft: {
      clientId: envValue(
        "AUTH_MICROSOFT_ID",
        "AUTH_MICROSOFT_ENTRA_ID_ID",
        "AUTH_AZURE_AD_CLIENT_ID",
        "AUTH_AZURE_AD_ID",
      ),
      clientSecret: envValue(
        "AUTH_MICROSOFT_SECRET",
        "AUTH_MICROSOFT_ENTRA_ID_SECRET",
        "AUTH_AZURE_AD_CLIENT_SECRET",
        "AUTH_AZURE_AD_SECRET",
      ),
      issuer,
    },
    apple: {
      clientId: envValue("AUTH_APPLE_ID"),
      clientSecret: envValue("AUTH_APPLE_SECRET"),
    },
  };
}

function hasCredentials(
  clientId: string | undefined,
  clientSecret: string | undefined,
): boolean {
  return Boolean(clientId && clientSecret);
}

export function getSocialProviderStatus(): SocialProviderStatus[] {
  const env = getSocialProviderEnv();
  return [
    {
      id: "google",
      label: SOCIAL_LABELS.google,
      configured: hasCredentials(env.google.clientId, env.google.clientSecret),
    },
    {
      id: "microsoft-entra-id",
      label: SOCIAL_LABELS["microsoft-entra-id"],
      configured: hasCredentials(
        env.microsoft.clientId,
        env.microsoft.clientSecret,
      ),
    },
    {
      id: "apple",
      label: SOCIAL_LABELS.apple,
      configured: hasCredentials(env.apple.clientId, env.apple.clientSecret),
    },
  ];
}

export function getAuthCallbackErrorMessage(
  error: string | undefined,
): string | undefined {
  if (!error) {
    return undefined;
  }

  switch (error) {
    case "OAuthAccountNotLinked":
      return "This email is already used with a different sign-in method.";
    case "AccessDenied":
      return "This account cannot sign in to the storefront.";
    case "Configuration":
      return "This sign-in method is not configured.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Could not complete social sign-in. Try email and password, or another provider.";
    default:
      return "Could not sign in. Try again.";
  }
}
