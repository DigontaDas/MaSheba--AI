export const fontFamily = {
  regular: "HindSiliguri-Regular",
  medium: "HindSiliguri-Medium",
  semiBold: "HindSiliguri-SemiBold",
  bold: "HindSiliguri-Bold"
} as const;

export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600" as const
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const
  }
} as const;
