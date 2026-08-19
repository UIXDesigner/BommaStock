export const INDIA_COUNTRY_CODE = "IN";

export const INDIA_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndiaState = (typeof INDIA_STATES)[number];

const INDIA_STATE_SET = new Set<string>(INDIA_STATES);

export function isIndiaState(value: string): value is IndiaState {
  return INDIA_STATE_SET.has(value);
}

export function normalizeIndianMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let national = digits;
  if (national.length === 12 && national.startsWith("91")) {
    national = national.slice(2);
  } else if (national.length === 11 && national.startsWith("0")) {
    national = national.slice(1);
  }
  if (national.length === 10 && /^[6-9]/.test(national)) {
    return `+91${national}`;
  }
  return null;
}
