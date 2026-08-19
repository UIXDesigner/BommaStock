export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip");
  return ip || null;
}
