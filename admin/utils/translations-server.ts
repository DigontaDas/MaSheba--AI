import { cookies } from "next/headers";
import { Language } from "./translations";

export async function getServerLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get("maasheba_lang")?.value;
    if (lang === "bn" || lang === "en") {
      return lang;
    }
  } catch (e) {
    // Fallback if not in a server request environment
  }
  return "en";
}
