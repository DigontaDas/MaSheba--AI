import * as Network from "expo-network";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com";

export interface ChatResponse {
  answer: string;
  is_emergency: boolean;
  source: string;
  emergency_text: string | null;
}

export async function askOnline(question: string): Promise<ChatResponse | null> {
  try {
    const network = await Network.getNetworkStateAsync();
    if (!network.isConnected || network.isInternetReachable === false) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as ChatResponse;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
}
