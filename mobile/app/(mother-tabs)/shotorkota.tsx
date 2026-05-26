import { useState, useMemo } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { colors, radius, spacing, typography } from "@/theme";
import { toBanglaNumber } from "@/utils/banglaNumerals";
import { copy } from "@/data/stitchCopy.bn";
import { SYMPTOM_GUIDANCE } from "@/data/nutritionData";
import { OFFLINE_QA_SEED } from "@/data/offlineQaSeed.bn";
import { clearRoleSession, getCurrentMotherProfile } from "@/auth/roleSession";
import { clearSession } from "@/auth/secureSession";
import { supabase } from "@/auth/supabaseAuth";

type AlertLevel = "NORMAL" | "WARNING" | "EMERGENCY";

const EMERGENCY_SIGNS = [
  "অতিরিক্ত রক্তপাত",
  "তীব্র মাথাব্যথা ও চোখে ঝাপসা দেখা",
  "হাত-মুখ অতিরিক্ত ফুলে যাওয়া",
  "শিশুর নড়াচড়া হঠাৎ বন্ধ হয়ে যাওয়া",
  "তীব্র পেটে ব্যথা",
  "জ্বর ১০১°F এর বেশি",
  "খিঁচুনি বা অজ্ঞান হয়ে যাওয়া"
];

export default function ShotorkotaScreen() {
  const [mainTab, setMainTab] = useState<"STATUS" | "FAQ">("STATUS");
  const [activeTab, setActiveTab] = useState<AlertLevel>("WARNING");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [expandedSymptom, setExpandedSymptom] = useState<string | null>(null);
  const [expandedQa, setExpandedQa] = useState<string | null>(null);

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
      { text: "পুষ্টি", onPress: () => router.push("/(mother-tabs)/nutrition") },
      { text: "প্রোফাইল", onPress: () => router.push("/(mother-tabs)/profile") },
      { text: "লগ আউট", style: "destructive", onPress: handleLogout },
      { text: "বাতিল", style: "cancel" }
    ]);
  };

  const showNotifications = () => {
    Alert.alert("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);
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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Uniform Top Header Bar */}
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="মেনু" accessibilityRole="button" onPress={showMenu} style={styles.iconButton}>
          <Icon name="menu" color="#70605A" size={24} />
        </Pressable>
        <Text style={styles.appName}>{copy.common.appName}</Text>
        <Pressable accessibilityLabel="নোটিফিকেশন" accessibilityRole="button" onPress={showNotifications} style={styles.iconButton}>
          <Icon name="notifications" color="#70605A" size={24} />
        </Pressable>
      </View>

      {/* Header Title Block */}
      <View style={styles.headerTitleBlock}>
        <Text style={styles.title}>স্বাস্থ্য ও সতর্কতা</Text>
      </View>

      {/* Top Segment Switcher for Main Tabs */}
      <View style={styles.mainTabContainer}>
        <Pressable
          onPress={() => setMainTab("STATUS")}
          style={[styles.mainTabButton, mainTab === "STATUS" && styles.mainTabButtonActive]}
        >
          <Text style={[styles.mainTabText, mainTab === "STATUS" && styles.mainTabTextActive]}>
            স্বাস্থ্য অবস্থা
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMainTab("FAQ")}
          style={[styles.mainTabButton, mainTab === "FAQ" && styles.mainTabButtonActive]}
        >
          <Text style={[styles.mainTabText, mainTab === "FAQ" && styles.mainTabTextActive]}>
            জিজ্ঞাসা ও সমাধান
          </Text>
        </Pressable>
      </View>

      {mainTab === "STATUS" ? (
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
                    source={require("../../assets/images/Manual_Blood_Pressure.jpg")}
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
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Emergency Warning Banner */}
          <View style={styles.faqEmergencyCard}>
            <View style={styles.faqEmergencyHeader}>
              <Icon name="error" color="#B91C1C" size={24} />
              <Text style={styles.faqEmergencyTitle}>জরুরি সতর্কতা</Text>
            </View>
            <Text style={styles.faqEmergencySub}>নিচের যেকোনো লক্ষণ দেখা দিলে এখনই হাসপাতালে যান।</Text>
            <Pressable
              onPress={() => Linking.openURL("tel:16767")}
              style={styles.faqCallButton}
            >
              <Text style={styles.faqCallButtonText}>১৬৭৬৭ কল করুন</Text>
            </Pressable>
          </View>

          {/* Emergency Signs Grid */}
          <View style={styles.faqSection}>
            <Text style={styles.faqSectionTitle}>জরুরি লক্ষণসমূহ</Text>
            <View style={styles.gridContainer}>
              {EMERGENCY_SIGNS.map((sign) => (
                <View key={sign} style={styles.gridCard}>
                  <Icon name="warning" color="#D97706" size={16} />
                  <Text style={styles.gridCardText}>{sign}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Symptom Accordion list */}
          <View style={styles.faqSection}>
            <Text style={styles.faqSectionTitle}>উপসর্গ অনুযায়ী পরামর্শ</Text>
            {SYMPTOM_GUIDANCE.map((symptom) => {
              const isExpanded = expandedSymptom === symptom.id;
              return (
                <View key={symptom.id} style={styles.accordionContainer}>
                  <Pressable
                    onPress={() => setExpandedSymptom(isExpanded ? null : symptom.id)}
                    style={styles.accordionHeader}
                  >
                    <Text style={styles.accordionTitle}>{symptom.symptom_bn}</Text>
                    <Icon name={isExpanded ? "expand-less" : "expand-more"} color="#70605A" size={24} />
                  </Pressable>
                  {isExpanded && (
                    <View style={styles.accordionBody}>
                      {symptom.recommendations.map((recommendation, idx) => (
                        <Text key={idx} style={styles.accordionBulletText}>
                          • {recommendation.bn}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Off-line Q&As */}
          <View style={styles.faqSection}>
            <Text style={styles.faqSectionTitle}>জিজ্ঞাসা ও উত্তর (FAQ)</Text>
            {OFFLINE_QA_SEED.filter((item) => item.severity === "HIGH").slice(0, 6).map((item) => {
              const isExpanded = expandedQa === item.id;
              return (
                <View key={item.id} style={styles.accordionContainer}>
                  <Pressable
                    onPress={() => setExpandedQa(isExpanded ? null : item.id)}
                    style={styles.accordionHeader}
                  >
                    <Text style={styles.accordionTitle}>{item.question_bn}</Text>
                    <Icon name={isExpanded ? "expand-less" : "expand-more"} color="#70605A" size={24} />
                  </Pressable>
                  {isExpanded && (
                    <View style={styles.accordionBody}>
                      <Text style={styles.faqAnswerText}>{item.answer_bn}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9F6" // Sleek off-white cream background!
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3EAE6"
  },
  iconButton: {
    padding: 8,
    borderRadius: 8
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E57A58"
  },
  headerTitleBlock: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#70605A" // Sleek, clinical grey-brown!
  },
  mainTabContainer: {
    flexDirection: "row",
    backgroundColor: "#FCEBE5", // Soft peach color matching style guidelines!
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
    height: 48,
    alignItems: "center"
  },
  mainTabButton: {
    flex: 1,
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  mainTabButtonActive: {
    backgroundColor: "#E57A58", // Active terracotta accent!
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#70605A"
  },
  mainTabTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    backgroundColor: "#E57A58",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  warningIcon: {
    marginBottom: 12
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8
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
    color: "#70605A",
    lineHeight: 22,
    paddingHorizontal: 10
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#F3EAE6",
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
    color: "#70605A"
  },
  segmentTextActive: {
    color: "#E57A58",
    fontWeight: "bold"
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3EAE6",
    borderRadius: 24,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#E57A58"
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
    backgroundColor: "#FFF9F6",
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
    flex: 1
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#70605A",
    marginBottom: 4
  },
  detailsDescription: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 18
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#70605A",
    marginTop: 8
  },
  stepsContainer: {
    gap: 12
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F3EAE6",
    borderRadius: 18,
    padding: 14,
    gap: 12
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
    color: "#70605A",
    lineHeight: 18
  },
  clinicCard: {
    backgroundColor: "#FFF5F2",
    borderWidth: 1,
    borderColor: "#FFE5DE",
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
    color: "#70605A",
    marginBottom: 4
  },
  clinicSubtitle: {
    fontSize: 14,
    color: "#70605A"
  },
  distanceBadge: {
    backgroundColor: "#FFE5DE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A"
  },
  routeButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E57A58",
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
    color: "#E57A58"
  },
  callButton: {
    backgroundColor: "#E57A58",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  callButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold"
  },

  // FAQ Tab specific premium styling
  faqEmergencyCard: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 10
  },
  faqEmergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  faqEmergencyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#991B1B"
  },
  faqEmergencySub: {
    fontSize: 14,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 20
  },
  faqCallButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6
  },
  faqCallButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14
  },
  faqSection: {
    gap: 12
  },
  faqSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#70605A",
    marginTop: 8
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  gridCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3EAE6",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  gridCardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#70605A",
    flex: 1,
    lineHeight: 16
  },
  accordionContainer: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F3EAE6",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden"
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#70605A",
    flex: 1,
    lineHeight: 20
  },
  accordionBody: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#FFF9F6",
    backgroundColor: "#FFF9F6"
  },
  accordionBulletText: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 22,
    marginVertical: 4
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#70605A",
    lineHeight: 22
  }
});
