import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabaseAuth";

const ACCESS_TOKEN_KEY = "maasheba.access_token";
const REFRESH_TOKEN_KEY = "maasheba.refresh_token";
const CHW_ID_KEY = "maasheba.chw_id";

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  chwId: string;
};

// Pure JS base64 decoder that runs robustly in Hermes, JSC, Node, and browser runtimes.
function decodeBase64(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  const cleaned = str.replace(/=+$/, "");
  for (let bc = 0, bs = 0, idx = 0; idx < cleaned.length; idx++) {
    const char = cleaned.charAt(idx);
    const p = chars.indexOf(char);
    if (p === -1) continue;
    bs = bc % 4 ? bs * 64 + p : p;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

// Decodes a standard JWT payload to evaluate token expiry.
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    
    // Normalize base64url characters to standard base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decodedStr = decodeBase64(base64);
    const decoded = JSON.parse(decodedStr);
    
    // Deem expired if current time is within 5 minutes (300 seconds) of expiration limit
    return Date.now() / 1000 >= (decoded.exp ?? 0) - 300;
  } catch {
    return true;
  }
}

// Uses refresh token to retrieve a fresh auth session and persist it.
export async function refreshAndSaveSession(refreshToken: string): Promise<StoredSession | null> {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: "",
      refresh_token: refreshToken
    });

    if (error || !data.session) return null;

    const session: StoredSession = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      chwId: data.session.user.id
    };

    await saveSession(session);
    return session;
  } catch {
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
  await SecureStore.setItemAsync(CHW_ID_KEY, session.chwId);
}

export async function getSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, chwId] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(CHW_ID_KEY)
  ]);

  if (!accessToken || !refreshToken || !chwId) {
    return null;
  }

  return { accessToken, refreshToken, chwId };
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(CHW_ID_KEY)
  ]);
}
