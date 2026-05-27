import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, Animated, Dimensions } from "react-native";
import { router } from "expo-router";
import { Icon } from "./Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { useLanguage } from "@/context/LanguageContext";

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function MenuModal({ visible, onClose, onLogout }: MenuModalProps) {
  const { language } = useLanguage();
  const [scaleAnim] = React.useState(new Animated.Value(0.95));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (path: string) => {
    onClose();
    // Wait briefly for modal slide-out to trigger router push smoothly
    setTimeout(() => {
      router.push(path as any);
    }, 150);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Card Handle Ornament */}
          <View style={styles.sheetHandle} />

          <View style={styles.header}>
            <Icon name="apps" color={colors.primary} size={24} />
            <Text style={styles.title}>{language === "en" ? "Main menu" : "প্রধান মেনু"}</Text>
          </View>

          <View style={styles.menuList}>
            {/* Item 1: Home */}
            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => handleNavigate("/(mother-tabs)/home")}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: "#FFF0ED" }]}>
                  <Icon name="home" color={colors.primary} size={20} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{language === "en" ? "Home screen" : "হোম স্ক্রিন"}</Text>
                  <Text style={styles.rowSubTitle}>{language === "en" ? "Pregnancy overview and services" : "গর্ভকালীন বিবরণী ও সেবা"}</Text>
                </View>
              </View>
              <Icon name="chevron-right" color={colors.outlineVariant} size={20} />
            </Pressable>

            {/* Item 2: Nutrition */}
            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => handleNavigate("/(mother-tabs)/nutrition")}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: "#F0F7EE" }]}>
                  <Icon name="restaurant" color={colors.secondary} size={20} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{language === "en" ? "Nutrition and care" : "পুষ্টি ও যত্ন"}</Text>
                  <Text style={styles.rowSubTitle}>{language === "en" ? "Food list and tools" : "খাদ্য তালিকা ও ক্যালকুলেটর"}</Text>
                </View>
              </View>
              <Icon name="chevron-right" color={colors.outlineVariant} size={20} />
            </Pressable>

            {/* Item 3: Alerts & Safety */}
            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => handleNavigate("/(mother-tabs)/shotorkota")}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: "#FFF9E1" }]}>
                  <Icon name="warning" color="#E57A58" size={20} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{language === "en" ? "Pregnancy warnings" : "গর্ভকালীন সতর্কতা"}</Text>
                  <Text style={styles.rowSubTitle}>{language === "en" ? "Danger signs and help" : "জরুরি লক্ষণ ও সাহায্য"}</Text>
                </View>
              </View>
              <Icon name="chevron-right" color={colors.outlineVariant} size={20} />
            </Pressable>

            {/* Item 4: Profile */}
            <Pressable 
              style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
              onPress={() => handleNavigate("/(mother-tabs)/profile")}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconWrap, { backgroundColor: "#EEF4F7" }]}>
                  <Icon name="person" color={colors.tertiary} size={20} />
                </View>
                <View>
                  <Text style={styles.rowTitle}>{language === "en" ? "Your profile" : "আপনার প্রোফাইল"}</Text>
                  <Text style={styles.rowSubTitle}>{language === "en" ? "Personal info and language" : "ব্যক্তিগত তথ্য ও ভাষা"}</Text>
                </View>
              </View>
              <Icon name="chevron-right" color={colors.outlineVariant} size={20} />
            </Pressable>
          </View>

          {/* Redesigned Logout Segment */}
          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            onPress={() => {
              onClose();
              setTimeout(onLogout, 150);
            }}
          >
            <View style={styles.logoutLeft}>
              <View style={styles.logoutIconWrap}>
                <Icon name="logout" color={colors.error} size={18} />
              </View>
              <Text style={styles.logoutText}>{language === "en" ? "Log out of account" : "অ্যাকাউন্ট থেকে লগ আউট"}</Text>
            </View>
            <Icon name="arrow-forward" color={colors.error} size={18} />
          </Pressable>

          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{language === "en" ? "Close" : "বন্ধ করুন"}</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(39, 24, 24, 0.42)", // Translucent frosted backdrop shade
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFF9F6", // Warm premium cream tone matching MaaSheba
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: "#271818",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "#dac1ba",
    borderRadius: 4,
    height: 4,
    width: 38,
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: 20,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: "bold",
  },
  menuList: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    overflow: "hidden",
    marginBottom: 16,
    paddingVertical: 4,
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#FBF7F5",
  },
  menuRowPressed: {
    backgroundColor: "#FFF5F2",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: typography.h2.fontFamily,
    fontWeight: "700",
    color: "#4A3E39",
  },
  rowSubTitle: {
    fontSize: 12,
    fontFamily: typography.caption.fontFamily,
    color: "#A08E88",
    marginTop: 2,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FCEBE5", // Soft premium terracotta outline card
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#F5D4CA",
    marginBottom: 20,
  },
  logoutButtonPressed: {
    backgroundColor: "#F8DDD2",
  },
  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutIconWrap: {
    backgroundColor: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    fontFamily: typography.h2.fontFamily,
    fontWeight: "bold",
    color: colors.error,
  },
  closeBtn: {
    alignItems: "center",
    backgroundColor: "#70605A", // Dark elegant clay tone
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontFamily: typography.h2.fontFamily,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
