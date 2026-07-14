import { headers } from "next/headers";

export type DeviceHint = {
  isMobile: boolean;
  isIOS: boolean;
  isTablet: boolean;
};

export function detectDevice(ua: string): DeviceHint {
  const isMobile = /iPhone|Android.*Mobile|Mobile.*Android/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isIOS = /iPhone|iPad/i.test(ua);
  return { isMobile, isIOS, isTablet };
}

export async function getDeviceHint(): Promise<DeviceHint> {
  const ua = (await headers()).get("user-agent") ?? "";
  return detectDevice(ua);
}
