import { Alert, Pressable, StyleSheet, Text, View, ImageBackground } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { clearRoleSession } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";
import { copy } from "@/data/stitchCopy.bn";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { callPhoneNumber } from "@/utils/phone";

const imageByIcon = {
  "monitor-heart": require("../../../assets/images/1.png"),
  "restaurant-menu": require("../../../assets/images/2.png"),
  "warning": require("../../../assets/images/3.png"),
  "local-hospital": require("../../../assets/images/4.png")
};

export function MotherDashboard({
  variant = "home",
  week = 24
}: {
  variant?: "home" | "progress";
  week?: number;
}) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      await Promise.all([clearSession(), clearRoleSession()]);
      router.replace("/(auth)/login");
    }
  };

  const showMenu = () => {
    Alert.alert("মেনু", "", [
      { text: "হোম", onPress: () => router.push("/(mother-tabs)/home") },
      { text: "প্রোফাইল", onPress: () => router.push("/(mother-tabs)/profile") },
      { text: "লগ আউট", style: "destructive", onPress: handleLogout },
      { text: "বাতিল", style: "cancel" }
    ]);
  };

  const showNotifications = () => {
    Alert.alert("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);
  };

  const showComingSoon = () => {
    Alert.alert("শীঘ্রই আসছে", "এই বৈশিষ্ট্যটি শীঘ্রই আসছে।", [{ text: "ঠিক আছে" }]);
  };

  const showEmergencyHelp = () => {
    Alert.alert("⚠️ জরুরি সাহায্য", "এখনই সাহায্যের জন্য কল করুন:", [
      { text: "বন্ধ করুন", style: "cancel" },
      { text: "স্বাস্থ্য হটলাইন: ১৬৭৬৭", onPress: () => callPhoneNumber("16767") },
      { text: "জরুরি: ৯৯৯", onPress: () => callPhoneNumber("999") }
    ]);
  };

  const title =
    variant === "progress"
      ? `সপ্তাহ ${toBanglaNumber(week)}: আপনার গর্ভকালীন অগ্রগতি`
      : `সপ্তাহ ${toBanglaNumber(week)}: আপনার শিশুর বৃদ্ধি`;
  const body =
    variant === "progress"
      ? "শান্ত থাকুন এবং সাহায্যের জন্য প্রস্তুত থাকুন। কোনো জরুরি লক্ষণ দেখা দিলে দ্রুত স্বাস্থ্যকর্মীকে জানান।"
      : "এই সপ্তাহে পুষ্টিকর খাবার, বিশ্রাম, ও নিয়মিত চেকআপ চালিয়ে যান। কোনো অস্বস্তি হলে স্বাস্থ্যকর্মীকে জানান।";
  const checklist =
    variant === "progress"
      ? ["প্রসব বেদনা যেকোনো সময় শুরু হতে পারে", "শিশুর নড়াচড়া খেয়াল রাখুন", "আপনার হাসপাতাল ব্যাগ প্রস্তুত রাখুন"]
      : [copy.mother.babySize, copy.mother.babyMovement, copy.mother.checkupFood];

  return (
    <ScreenShell>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="মেনু" accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" />
        </Pressable>
        <View style={styles.brand}>
          <Text style={styles.appName}>{copy.common.appName}</Text>
          <Text style={styles.weekLabel}>সপ্তাহ {toBanglaNumber(week)}</Text>
        </View>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" />
        </Pressable>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.weekRow}>
          <Text style={styles.weekTitle}>সপ্তাহ {toBanglaNumber(week)}</Text>
          <Text style={styles.remaining}>আর {toBanglaNumber(Math.max(0, 40 - week))} সপ্তাহ বাকি</Text>
        </View>
        <ProgressBar value={week} max={40} showMarkers />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Pressable accessibilityLabel="অডিও শুনুন" accessibilityRole="button" onPress={showComingSoon} style={styles.smallIconButton}>
            <Icon name="volume-up" color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.label}>{copy.mother.whatToExpect}</Text>
        {checklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <Icon name="check-circle" color={colors.secondary} size={18} />
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.grid}>
        <ActionCard icon="monitor-heart" title={copy.mother.healthTips} onPress={() => router.push("/(mother-tabs)/progress")} />
        <ActionCard icon="restaurant-menu" title={copy.mother.nutritionAdvice} onPress={() => router.push("/(mother-tabs)/nutrition")} />
        <ActionCard icon="warning" title={copy.mother.warningSigns} onPress={() => router.push("/(mother-tabs)/alerts")} />
        <ActionCard icon="local-hospital" title={copy.mother.emergencyHelp} onPress={showEmergencyHelp} />
      </View>

      <Pressable accessibilityLabel={copy.mother.askAi} accessibilityRole="button" style={styles.askCard} onPress={() => router.push("/(mother-tabs)/chat")}>
        <Icon name="chat-bubble" color={colors.onPrimary} />
        <Text style={styles.askText}>{copy.mother.askAi}</Text>
      </Pressable>
    </ScreenShell>
  );
}

function ActionCard({
  icon,
  title,
  onPress
}: {
  icon: "monitor-heart" | "restaurant-menu" | "warning" | "local-hospital";
  title: string;
  onPress: () => void;
}) {
  const imageSource = imageByIcon[icon];

  return (
    <Pressable accessibilityLabel={title} accessibilityRole="button" style={styles.actionCard} onPress={onPress}>
      <ImageBackground source={imageSource} style={styles.actionCardBackground} imageStyle={styles.actionCardImage}>
        <View style={styles.actionTextOverlay}>
          <Text style={styles.actionCardText} numberOfLines={2}>{title}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  brand: {
    flex: 1
  },
  iconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  smallIconButton: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  appName: {
    ...typography.h2,
    color: colors.onSurface
  },
  weekLabel: {
    ...typography.caption,
    color: colors.secondary
  },
  progressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  weekRow: {
    flexDirection: "row",
    gap: spacing.base,
    justifyContent: "space-between"
  },
  weekTitle: {
    ...typography.h1,
    color: colors.onSurface
  },
  remaining: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.card,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface,
    flex: 1
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  checkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  checkText: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  body: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionCard: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 120,
    borderRadius: radius.card,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#ebdcd9"
  },
  actionCardBackground: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12
  },
  actionCardImage: {
    borderRadius: radius.card
  },
  actionTextOverlay: {
    alignSelf: "flex-start",
    maxWidth: "65%"
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#54433d",
    fontFamily: typography.body.fontFamily,
    lineHeight: 18
  },
  askCard: {
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.base
  },
  askText: {
    ...typography.body,
    color: colors.onPrimary,
    fontFamily: typography.h2.fontFamily
  }
});
