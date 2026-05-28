import { EmergencyBanner } from "./emergency/EmergencyBanner";
import type { OfflineQa } from "@/types/schema";

export function EmergencyQaBanner({ item }: { item: OfflineQa }) {
  if (!item.emergency && !item.see_doctor) {
    return null;
  }

  return (
    <EmergencyBanner
      title={item.emergency ? "জরুরি: এখনই হাসপাতালে যান" : "সতর্কতা: স্বাস্থ্যকর্মীকে জানান"}
      message={item.answer_bn}
    />
  );
}
