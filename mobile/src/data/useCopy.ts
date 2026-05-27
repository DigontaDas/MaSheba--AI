import { useLanguage } from "@/context/LanguageContext";
import { copy } from "./stitchCopy.bn";
import { copyEn } from "./stitchCopy.en";

export function getCopy(language: "bn" | "en") {
  return language === "en" ? copyEn : copy;
}

export function useCopy() {
  const { language } = useLanguage();
  return getCopy(language);
}
