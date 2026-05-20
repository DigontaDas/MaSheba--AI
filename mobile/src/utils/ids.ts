import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "maasheba.device_id";

export function createUuid(): string {
  if (typeof Crypto.randomUUID === "function") {
    const generated = Crypto.randomUUID();
    if (generated) {
      return generated;
    }
  }

  const bytes = Crypto.getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function getDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }

  const deviceId = `device-${createUuid()}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function createIdempotencyKey(deviceId: string): string {
  return `${deviceId}:${Date.now()}:${createUuid()}`;
}
