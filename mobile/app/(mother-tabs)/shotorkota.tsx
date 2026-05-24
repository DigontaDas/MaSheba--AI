import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
  Alert
} from "react-native";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type AlertLevel = "NORMAL" | "WARNING" | "EMERGENCY";

export default function ShotorkotaScreen() {
  const [activeTab, setActiveTab] = useState<AlertLevel>("WARNING");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const toggleSpeech = (text: string) => {
    if (playingAudio === text) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(text);
      Alert.alert(
        "অডিও ভয়েস প্লে হচ্ছে",
        `"${text}" - লেখাটি পড়ে শোনানো হচ্ছে।`,
        [{ text: "থামুন", onPress: () => setPlayingAudio(null) }]
      );
    }
  };

  const callEmergency = () => {
    Linking.openURL("tel:16789").catch(() => {
      Alert.alert("কল করা যায়নি", "আপনার ডিভাইসে কল সুবিধা উপলব্ধ নয়।");
    });
  };

  const showRoute = () => {
    Alert.alert("মানচিত্র", "নিকটস্থ ক্লিনিকের রাস্তা ম্যাপে দেখানো হচ্ছে...");
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" color="#54433D" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>স্বাস্থ্য সতর্কতা</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dynamic Alert Banner based on segment selection */}
        {activeTab === "WARNING" && (
          <View style={[styles.alertCard, styles.alertCardWarning]}>
            <Pressable
              onPress={() =>
                toggleSpeech(
                  "সতর্কতা। আপনার লক্ষণগুলো থেকে বোঝা যাচ্ছে আপনার দ্রুত চিকিৎসা পরামর্শ নেওয়া প্রয়োজন।"
                )
              }
              style={styles.speakerButton}
            >
              <Icon name="volume-up" color="#ffffff" size={20} />
            </Pressable>
            <Icon name="warning" color="#8a731d" size={54} style={styles.warningIcon} />
            <Text style={[styles.alertTitle, styles.alertTitleWarning]}>সতর্কতা</Text>
            <Text style={styles.alertDescription}>
              আপনার লক্ষণগুলো থেকে বোঝা যাচ্ছে আপনার দ্রুত চিকিৎসা পরামর্শ নেওয়া প্রয়োজন।
            </Text>
          </View>
        )}

        {activeTab === "NORMAL" && (
          <View style={[styles.alertCard, styles.alertCardNormal]}>
            <Pressable
              onPress={() =>
                toggleSpeech("স্বাভাবিক। আপনার বর্তমান স্বাস্থ্য লক্ষণসমূহ পুরোপুরি স্বাভাবিক রয়েছে।")
              }
              style={styles.speakerButton}
            >
              <Icon name="volume-up" color="#ffffff" size={20} />
            </Pressable>
            <Icon name="check-circle" color="#386652" size={54} style={styles.warningIcon} />
            <Text style={[styles.alertTitle, styles.alertTitleNormal]}>স্বাভাবিক</Text>
            <Text style={styles.alertDescription}>
              আপনার বর্তমান স্বাস্থ্য লক্ষণসমূহ পুরোপুরি স্বাভাবিক রয়েছে। নিয়মিত পুষ্টিকর খাবার ও পর্যাপ্ত বিশ্রাম বজায় রাখুন।
            </Text>
          </View>
        )}

        {activeTab === "EMERGENCY" && (
          <View style={[styles.alertCard, styles.alertCardEmergency]}>
            <Pressable
              onPress={() =>
                toggleSpeech(
                  "জরুরি অবস্থা। আপনার লক্ষণ অত্যন্ত ঝুঁকিপূর্ণ! অবহেলা না করে অবিলম্বে নিকটস্থ হাসপাতালে যান।"
                )
              }
              style={styles.speakerButton}
            >
              <Icon name="volume-up" color="#ffffff" size={20} />
            </Pressable>
            <Icon name="error" color="#8e3e26" size={54} style={styles.warningIcon} />
            <Text style={[styles.alertTitle, styles.alertTitleEmergency]}>জরুরি অবস্থা</Text>
            <Text style={styles.alertDescription}>
              আপনার লক্ষণ অত্যন্ত ঝুঁকিপূর্ণ! অবহেলা না করে অবিলম্বে নিকটস্থ স্বাস্থ্য কেন্দ্র অথবা হাসপাতালে যোগাযোগ করুন।
            </Text>
          </View>
        )}

        {/* Tab Segment Selector */}
        <View style={styles.segmentContainer}>
          <Pressable
            onPress={() => setActiveTab("NORMAL")}
            style={[styles.segmentButton, activeTab === "NORMAL" && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, activeTab === "NORMAL" && styles.segmentTextActive]}>
              স্বাভাবিক
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("WARNING")}
            style={[styles.segmentButton, activeTab === "WARNING" && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, activeTab === "WARNING" && styles.segmentTextActive]}>
              সতর্কতা
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("EMERGENCY")}
            style={[styles.segmentButton, activeTab === "EMERGENCY" && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentText, activeTab === "EMERGENCY" && styles.segmentTextActive]}>
              জরুরি
            </Text>
          </Pressable>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsCardContent}>
            {/* Visual illustration of the details state */}
            <View style={styles.detailsImageContainer}>
              {activeTab === "NORMAL" ? (
                <View style={[styles.detailsIconCircle, { backgroundColor: "#eef8f4" }]}>
                  <Icon name="favorite" color="#386652" size={40} />
                </View>
              ) : activeTab === "EMERGENCY" ? (
                <View style={[styles.detailsIconCircle, { backgroundColor: "#fdf3f0" }]}>
                  <Icon name="healing" color="#8e3e26" size={40} />
                </View>
              ) : (
                <Image
                  source={require("../../assets/images/bp.png")}
                  style={styles.detailsImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Details Copy Text */}
            <View style={styles.detailsTextContainer}>
              <Text style={styles.detailsTitle}>
                {activeTab === "NORMAL"
                  ? "রক্তচাপ স্বাভাবিক"
                  : activeTab === "EMERGENCY"
                  ? "তীব্র রক্তক্ষরণ বা খিঁচুনি"
                  : "উচ্চ রক্তচাপ"}
              </Text>
              <Text style={styles.detailsDescription}>
                {activeTab === "NORMAL"
                  ? "আপনার রক্তচাপ ১২০/৮০ mmHg এর মধ্যে রয়েছে। এটি একটি চমৎকার স্বাস্থ্যকর লক্ষণ।"
                  : activeTab === "EMERGENCY"
                  ? "এটি অত্যন্ত বিপদজনক লক্ষণ। কালক্ষেপণ না করে দ্রুত হাসপাতালে ভর্তি হোন।"
                  : "আপনার রক্তচাপ স্বাভাবিকের চেয়ে বেশি। এটি গর্ভাবস্থায় ঝুঁকির কারণ হতে পারে।"}
              </Text>

              {/* Detail speaker */}
              <Pressable
                onPress={() =>
                  toggleSpeech(
                    activeTab === "NORMAL"
                      ? "রক্তচাপ স্বাভাবিক। আপনার রক্তচাপ ১২০/৮০ এর মধ্যে রয়েছে।"
                      : activeTab === "EMERGENCY"
                      ? "তীব্র রক্তক্ষরণ বা খিঁচুনি। এটি অত্যন্ত বিপদজনক লক্ষণ।"
                      : "উচ্চ রক্তচাপ। আপনার রক্তচাপ স্বাভাবিকের চেয়ে বেশি। এটি গর্ভাবস্থায় ঝুঁকির কারণ হতে পারে।"
                  )
                }
                style={styles.detailSpeaker}
              >
                <Icon name="volume-up" color="#e8896a" size={16} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Action Title */}
        <Text style={styles.actionTitle}>এখন কী করবেন?</Text>

        {/* Next Steps List */}
        <View style={styles.stepsContainer}>
          {activeTab === "NORMAL" ? (
            <>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(1)}</Text>
                </View>
                <Text style={styles.stepText}>প্রতিদিন অন্তত ৮ গ্লাস বিশুদ্ধ পানি পান করুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(2)}</Text>
                </View>
                <Text style={styles.stepText}>আয়রন ও ক্যালসিয়াম সমৃদ্ধ সুষম খাদ্য গ্রহণ করুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(3)}</Text>
                </View>
                <Text style={styles.stepText}>পর্যাপ্ত বিশ্রাম ও স্বাভাবিক হালকা হাঁটাচলা বজায় রাখুন।</Text>
              </View>
            </>
          ) : activeTab === "EMERGENCY" ? (
            <>
              <View style={styles.stepItem}>
                <View style={[styles.stepBadge, { backgroundColor: "#8e3e26" }]}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(1)}</Text>
                </View>
                <Text style={styles.stepText}>সোজা হয়ে শুয়ে পড়ুন এবং মাথায় বাতাস করুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepBadge, { backgroundColor: "#8e3e26" }]}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(2)}</Text>
                </View>
                <Text style={styles.stepText}>দ্রুত অ্যাম্বুলেন্স অথবা নিকটস্থ ক্লিনিকের সাথে যোগাযোগ করুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepBadge, { backgroundColor: "#8e3e26" }]}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(3)}</Text>
                </View>
                <Text style={styles.stepText}>হাসপাতালে পৌঁছানোর পূর্ব পর্যন্ত শান্ত থাকার চেষ্টা করুন।</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(1)}</Text>
                </View>
                <Text style={styles.stepText}>বিশ্রাম নিন এবং শান্ত থাকুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(2)}</Text>
                </View>
                <Text style={styles.stepText}>প্রচুর পরিমাণে বিশুদ্ধ জল পান করুন।</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{toBanglaNumber(3)}</Text>
                </View>
                <Text style={styles.stepText}>আপনার স্বাস্থ্যকর্মীর সাথে যোগাযোগ করুন।</Text>
              </View>
            </>
          )}
        </View>

        {/* Nearest Clinic Card */}
        <View style={styles.clinicCard}>
          <View style={styles.clinicHeaderRow}>
            <View>
              <Text style={styles.clinicTitle}>নিকটস্থ ক্লিনিক</Text>
              <Text style={styles.clinicSubtitle}>মা ও শিশু স্বাস্থ্য কেন্দ্র, ধানমণ্ডি</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>২.৩ কিমি</Text>
            </View>
          </View>

          <Pressable onPress={showRoute} style={styles.routeButton}>
            <Icon name="near-me" color="#8e3e26" size={18} />
            <Text style={styles.routeButtonText}>রাস্তা দেখান</Text>
          </Pressable>
        </View>

        {/* Emergency Call Floating Button */}
        <Pressable onPress={callEmergency} style={styles.callButton}>
          <Icon name="call" color="#ffffff" size={22} />
          <Text style={styles.callButtonText}>এখনই ফোন করুন: ১৬৭৮৯</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fffcfb"
  },
  header: {
    flexDirection: "row",
    height: 60,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f6e8e5",
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b2b27",
    fontFamily: typography.h1.fontFamily
  },
  placeholder: {
    width: 40
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20
  },
  alertCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  alertCardWarning: {
    backgroundColor: "#fdf7e2",
    borderColor: "#ecd16e"
  },
  alertCardNormal: {
    backgroundColor: "#f0f8f4",
    borderColor: "#b8ddbe"
  },
  alertCardEmergency: {
    backgroundColor: "#fff3f0",
    borderColor: "#f9d0c6"
  },
  speakerButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#e8896a",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  warningIcon: {
    marginBottom: 12
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: typography.h1.fontFamily
  },
  alertTitleWarning: {
    color: "#8a731d"
  },
  alertTitleNormal: {
    color: "#386652"
  },
  alertTitleEmergency: {
    color: "#8e3e26"
  },
  alertDescription: {
    fontSize: 15,
    textAlign: "center",
    color: "#54433d",
    lineHeight: 22,
    paddingHorizontal: 10,
    fontFamily: typography.body.fontFamily
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#f7f1f0",
    borderRadius: 28,
    padding: 4,
    height: 52,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ebdcd9"
  },
  segmentButton: {
    flex: 1,
    height: "100%",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  segmentButtonActive: {
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#ebdcd9"
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#54433d",
    fontFamily: typography.body.fontFamily
  },
  segmentTextActive: {
    color: "#e8896a",
    fontWeight: "bold"
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f2e4e1",
    borderRadius: 24,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#e8896a",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  detailsCardContent: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center"
  },
  detailsImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: "#fff6f5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  detailsImage: {
    width: "85%",
    height: "85%"
  },
  detailsIconCircle: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  detailsTextContainer: {
    flex: 1,
    position: "relative",
    paddingRight: 24
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b2b27",
    marginBottom: 4,
    fontFamily: typography.h2.fontFamily
  },
  detailsDescription: {
    fontSize: 14,
    color: "#6e5a55",
    lineHeight: 18,
    fontFamily: typography.body.fontFamily
  },
  detailSpeaker: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#fff0ed",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b2b27",
    marginTop: 8,
    fontFamily: typography.h2.fontFamily
  },
  stepsContainer: {
    gap: 12
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f2e4e1",
    borderRadius: 18,
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#cbdadb",
    alignItems: "center",
    justifyContent: "center"
  },
  stepBadgeText: {
    fontSize: 14,
    color: "#3b5b66",
    fontWeight: "bold"
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#54433d",
    lineHeight: 18,
    fontFamily: typography.body.fontFamily
  },
  clinicCard: {
    backgroundColor: "#fff5f4",
    borderWidth: 1,
    borderColor: "#ffe3df",
    borderRadius: 24,
    padding: 16,
    gap: 16
  },
  clinicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  clinicTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b2b27",
    marginBottom: 4,
    fontFamily: typography.h2.fontFamily
  },
  clinicSubtitle: {
    fontSize: 14,
    color: "#6e5a55",
    fontFamily: typography.body.fontFamily
  },
  distanceBadge: {
    backgroundColor: "#e0d3d1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#54433d"
  },
  routeButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8896a",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  routeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8e3e26",
    fontFamily: typography.body.fontFamily
  },
  callButton: {
    backgroundColor: "#e8896a",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  callButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: typography.body.fontFamily
  }
});
