export const FOOD_IMAGES: Record<string, any> = {
  milk: require("../../assets/images/milk.jpg"),
  gorom_dudh: require("../../assets/images/milk.jpg"),
  dudh: require("../../assets/images/milk.jpg"),
  moshur: require("../../assets/images/moshur.jpg"),
  moshur_dal: require("../../assets/images/moshur.jpg"),
  masoor: require("../../assets/images/moshur.jpg"),
  palong: require("../../assets/images/palong.jpg"),
  palong_shak: require("../../assets/images/palong.jpg"),
  shak: require("../../assets/images/palong.jpg"),
  dalim: require("../../assets/images/dalim.jpg"),
  pomegranate: require("../../assets/images/dalim.jpg"),
  rice_roti: require("../../assets/images/rice_roti.png"),
  water: require("../../assets/images/water_glass.png"),
  blood_pressure: require("../../assets/images/Manual_Blood_Pressure.jpg")
};

export function getFoodImage(nameBn: string, nameEn: string): any | null {
  const lowerBn = nameBn.toLowerCase();
  const lowerEn = nameEn.toLowerCase();

  if (lowerBn.includes("দুধ") || lowerEn.includes("milk")) {
    return FOOD_IMAGES.milk;
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
