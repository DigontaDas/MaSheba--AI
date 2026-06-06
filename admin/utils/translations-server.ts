import { Language } from "./translations";

export async function getServerLanguage(): Promise<Language> {
  return "en";
}
