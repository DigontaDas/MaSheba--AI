import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "maasheba.access_token";
const REFRESH_TOKEN_KEY = "maasheba.refresh_token";
const CHW_ID_KEY = "maasheba.chw_id";

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  chwId: string;
};

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
