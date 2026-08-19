import { afterEach, describe, expect, it } from "vitest";
import { getSocialProviderStatus, isSocialProviderId } from "./social";

const SOCIAL_ENV_KEYS = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_MICROSOFT_ID",
  "AUTH_MICROSOFT_SECRET",
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "AUTH_AZURE_AD_CLIENT_ID",
  "AUTH_AZURE_AD_CLIENT_SECRET",
  "AUTH_APPLE_ID",
  "AUTH_APPLE_SECRET",
] as const;

const previous = new Map<string, string | undefined>();

function setEnv(vars: Record<string, string | undefined>): void {
  for (const key of SOCIAL_ENV_KEYS) {
    if (!previous.has(key)) {
      previous.set(key, process.env[key]);
    }
    const value = vars[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  for (const [key, value] of previous) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  previous.clear();
});

describe("getSocialProviderStatus", () => {
  it("shows all providers as unconfigured when env is empty", () => {
    setEnv({});
    const status = getSocialProviderStatus();
    expect(status.map((provider) => provider.id)).toEqual([
      "google",
      "microsoft-entra-id",
      "apple",
    ]);
    expect(status.every((provider) => provider.configured)).toBe(false);
    expect(
      status.find((provider) => provider.id === "microsoft-entra-id")?.label,
    ).toBe("Outlook");
  });

  it("marks Google configured only when both id and secret are set", () => {
    setEnv({ AUTH_GOOGLE_ID: "id" });
    expect(
      getSocialProviderStatus().find((provider) => provider.id === "google")
        ?.configured,
    ).toBe(false);

    setEnv({ AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "secret" });
    expect(
      getSocialProviderStatus().find((provider) => provider.id === "google")
        ?.configured,
    ).toBe(true);
  });

  it("accepts AUTH_MICROSOFT_* aliases", () => {
    setEnv({
      AUTH_MICROSOFT_ID: "ms-id",
      AUTH_MICROSOFT_SECRET: "ms-secret",
    });
    expect(
      getSocialProviderStatus().find(
        (provider) => provider.id === "microsoft-entra-id",
      )?.configured,
    ).toBe(true);
  });
});

describe("isSocialProviderId", () => {
  it("accepts only storefront social providers", () => {
    expect(isSocialProviderId("google")).toBe(true);
    expect(isSocialProviderId("credentials")).toBe(false);
  });
});
