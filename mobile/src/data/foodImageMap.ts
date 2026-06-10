export const FOOD_IMAGES: Record<string, any> = {
  milk: require("../../assets/images/milk.webp"),
  gorom_dudh: require("../../assets/images/milk.webp"),
  dudh: require("../../assets/images/milk.webp"),
  moshur: require("../../assets/images/moshur.webp"),
  moshur_dal: require("../../assets/images/moshur.webp"),
  masoor: require("../../assets/images/moshur.webp"),
  palong: require("../../assets/images/palong.webp"),
  palong_shak: require("../../assets/images/palong.webp"),
  shak: require("../../assets/images/palong.webp"),
  dalim: require("../../assets/images/dalim.webp"),
  pomegranate: require("../../assets/images/dalim.webp"),
  rice_roti: require("../../assets/images/rice_roti.webp"),
  water: require("../../assets/images/water_glass.webp"),
  blood_pressure: require("../../assets/images/Manual_Blood_Pressure.webp"),
  dim: require("../../assets/images/dim.webp"),
  choto_mach: require("../../assets/images/choto_mach.webp"),
  halka_nasta: require("../../assets/images/halka_nasta.webp")
};

export function getFoodImage(nameBn: string, nameEn: string): any | null {
  const lowerBn = nameBn.toLowerCase();
  const lowerEn = nameEn.toLowerCase();

  if (lowerBn.includes("দুধ") || lowerEn.includes("milk")) {
    return FOOD_IMAGES.milk;
  }
  if (
    lowerBn.includes("ডিম") ||
    lowerEn.includes("egg")
  ) {
    return FOOD_IMAGES.dim;
  }
  if (
    lowerBn.includes("মাছ") ||
    lowerEn.includes("fish")
  ) {
    return FOOD_IMAGES.choto_mach;
  }
  if (
    lowerBn.includes("নাস্তা") ||
    lowerBn.includes("মুড়ি") ||
    lowerBn.includes("চিঁড়া") ||
    lowerBn.includes("মুড়ি") ||
    lowerEn.includes("snack") ||
    lowerEn.includes("muri") ||
    lowerEn.includes("chira")
  ) {
    return FOOD_IMAGES.halka_nasta;
  }
  if (
    lowerBn.includes("মসুর") ||
    lowerBn.includes("ডাল") ||
    lowerEn.includes("lentil") ||
    lowerEn.includes("dal")
  ) {
    return FOOD_IMAGES.moshur;
  }
  if (
    lowerBn.includes("পালং") ||
    lowerBn.includes("শাক") ||
    lowerEn.includes("spinach") ||
    lowerEn.includes("leafy") ||
    lowerEn.includes("greens")
  ) {
    return FOOD_IMAGES.palong;
  }
  if (
    lowerBn.includes("ডালিম") ||
    lowerBn.includes("ফল") ||
    lowerEn.includes("pomegranate") ||
    lowerEn.includes("fruit")
  ) {
    return FOOD_IMAGES.dalim;
  }
  if (
    lowerBn.includes("ভাত") ||
    lowerBn.includes("রুটি") ||
    lowerEn.includes("rice") ||
    lowerEn.includes("roti") ||
    lowerEn.includes("bread")
  ) {
    return FOOD_IMAGES.rice_roti;
  }
  if (
    lowerBn.includes("পানি") ||
    lowerBn.includes("জল") ||
    lowerEn.includes("water")
  ) {
    return FOOD_IMAGES.water;
  }

  return null;
}

