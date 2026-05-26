import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Icon } from "@/components/ui/Icon";
import { router } from "expo-router";

export default function MedicineVerifyScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const historyItems = [
    { id: 1, name: "ফলিক অ্যাসিড", time: "যাচাই করা হয়েছে: ২ ঘণ্টা আগে", valid: true },
    { id: 2, name: "বি-কমপ্লেক্স সিরাপ", time: "যাচাই করা হয়েছে: গতকাল", valid: false },
    { id: 3, name: "জিঙ্ক ট্যাবলেট", time: "যাচাই করা হয়েছে: ২ দিন আগে", valid: true }
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setActiveFilter(null);
      return;
    }
    const q = searchQuery.toLowerCase();
    if (q.includes("para") || q.includes("প্যারা") || q.includes("bn9821")) {
      setActiveFilter("valid");
    } else if (q.includes("iron") || q.includes("আয়রন") || q.includes("fe4420")) {
      setActiveFilter("warning");
    } else if (q.includes("calc") || q.includes("ক্যাল") || q.includes("ca7712")) {
      setActiveFilter("expired");
    } else {
      setActiveFilter(null);
      Alert.alert("🔎 ওষুধ খুঁজে পাওয়া যায়নি", "অনুগ্রহ করে সঠিক ব্যাচ নম্বর (যেমন: BN9821, FE4420) লিখুন।");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      {/* Header Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" color="#70605A" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>ওষুধের মেয়াদ যাচাই</Text>
        <Pressable style={styles.historyBtn} onPress={() => Alert.alert("⌛ ইতিহাস", "মেয়াদ যাচাইকরণের সম্পূর্ণ ইতিহাস শীঘ্রই আসবে।")}>
          <Icon name="history" color="#70605A" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Pill Illustration */}
        <View style={styles.illustrationSection}>
          <View style={styles.pillCircle}>
            <Icon name="medication" color="#FFFFFF" size={54} />
          </View>
          <Text style={styles.titleText}>ওষুধের বৈধতা যাচাই করুন</Text>
          <Text style={styles.subtitleText}>
            নিরাপদ থাকুন, ওষুধের ব্যাচ নম্বর বা বারকোড দিয়ে আসল নকল পরখ করুন।
          </Text>
        </View>

        {/* Search Input Container */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputRow}>
            <Icon name="search" color="#A08E88" size={20} />
            <TextInput
              onChangeText={(text) => {
                setSearchQuery(text);
                if (!text) setActiveFilter(null);
              }}
              onSubmitEditing={handleSearch}
              placeholder="ওষুধের নাম বা ব্যাচ নম্বর..."
              placeholderTextColor="#A08E88"
              style={styles.searchInput}
              value={searchQuery}
            />
            <Pressable onPress={() => Alert.alert("🎤 ভয়েস ইনপুট", "ভয়েস সার্চ চালু হচ্ছে...")}>
              <Icon name="mic" color="#E57A58" size={20} />
            </Pressable>
          </View>

          <Pressable onPress={handleSearch} style={styles.searchButton}>
            <Icon name="search" color="#FFFFFF" size={18} />
            <Text style={styles.searchButtonText}>সার্চ</Text>
          </Pressable>
        </View>

        {/* Verification Results Panel */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionKicker}>যাচাইয়ের ফলাফল (নমুনা)</Text>

          {/* Valid Card */}
          {(!activeFilter || activeFilter === "valid") && (
            <View style={[styles.resultCard, styles.cardValid]}>
              <View style={styles.iconCircleValid}>
                <Icon name="check-circle" color="#4A6047" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.validTitle}>বৈধ ওষুধ (VALID)</Text>
                <Text style={styles.cardDesc}>প্যারাসিটামল ৫০০ মিগ্রা। ব্যাচ: BN9821</Text>
                <Text style={styles.validExpiry}>মেয়াদ শেষ হবে: ১৫ আগস্ট ২০২৫</Text>
              </View>
            </View>
          )}

          {/* Warning Card */}
          {(!activeFilter || activeFilter === "warning") && (
            <View style={[styles.resultCard, styles.cardWarning]}>
              <View style={styles.iconCircleWarning}>
                <Icon name="warning" color="#3B5B66" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.warningTitle}>দ্রুত ব্যবহার করুন</Text>
                <Text style={styles.cardDesc}>আয়রন ট্যাবলেট। ব্যাচ: FE4420</Text>
                <Text style={styles.warningExpiry}>মেয়াদ শেষ হবে: ৩০ জুন ২০২৪ (১ মাস বাকি)</Text>
              </View>
            </View>
          )}

          {/* Expired Card */}
          {(!activeFilter || activeFilter === "expired") && (
            <View style={[styles.resultCard, styles.cardExpired]}>
              <View style={styles.iconCircleExpired}>
                <Icon name="cancel" color="#B3261E" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.expiredTitle}>মেয়াদোত্তীর্ণ (EXPIRED)</Text>
                <Text style={styles.cardDesc}>ক্যালসিয়াম ডি৩। ব্যাচ: CA7712</Text>
                <Text style={styles.expiredWarning}>সতর্কতা: এই ওষুধটি সেবন করাবেন না এবং নষ্ট করে ফেলুন।</Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent History Panel */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>সাম্প্রতিক ইতিহাস</Text>
            <Pressable onPress={() => Alert.alert("সব ইতিহাস", "সম্পূর্ণ তালিকা দেখতে এখানে ট্যাপ করুন।")}>
              <Text style={styles.seeAllText}>সব দেখুন</Text>
            </Pressable>
          </View>

          <View style={styles.historyCardContainer}>
            {historyItems.map((item, index) => (
              <View key={item.id}>
                <Pressable
                  onPress={() => {
                    setSearchQuery(item.name);
                    if (item.id === 1) setActiveFilter("valid");
                    if (item.id === 2) setActiveFilter("expired");
                    if (item.id === 3) setActiveFilter("valid");
                  }}
                  style={styles.historyItemRow}
                >
                  <View style={styles.historyLeft}>
                    <View style={[styles.statusDot, { backgroundColor: item.valid ? "#4A6047" : "#B3261E" }]} />
                    <View style={styles.historyTextWrap}>
                      <Text style={styles.historyName}>{item.name}</Text>
                      <Text style={styles.historyTime}>{item.time}</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" color="#A08E88" size={18} />
                </Pressable>
                {index < historyItems.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6", // Cream background
    flex: 1
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "#FFF9F6",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE9"
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#70605A"
  },
  historyBtn: {
    padding: 4
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 24
  },

  // Top Illustration
  illustrationSection: {
    alignItems: "center",
    gap: 14
  },
  pillCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E57A58",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  subtitleText: {
    fontSize: 13,
    color: "#70605A",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16
  },

  // Search input and button
  searchSection: {
    gap: 12
  },
  searchInputRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
    elevation: 1,
    shadowColor: "#E57A58",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#4A3E39",
    marginLeft: 10,
    marginRight: 10,
    padding: 0
  },
  searchButton: {
    backgroundColor: "#8C4A32", // Rich terracotta-brown
    borderRadius: 28,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF"
  },

  // Results Section
  resultsSection: {
    gap: 12
  },
  sectionKicker: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#70605A",
    marginBottom: 4
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  cardContent: {
    flex: 1,
    gap: 4
  },
  cardDesc: {
    fontSize: 13,
    color: "#4A3E39",
    fontWeight: "600"
  },

  // Valid Card
  cardValid: {
    backgroundColor: "#EBF5EB",
    borderColor: "#C4D6C4"
  },
  iconCircleValid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(74, 96, 71, 0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  validTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A6047"
  },
  validExpiry: {
    fontSize: 12,
    color: "#4A6047",
    fontWeight: "bold"
  },

  // Warning Card
  cardWarning: {
    backgroundColor: "#EBF3F5",
    borderColor: "#A3BDC4"
  },
  iconCircleWarning: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59, 91, 102, 0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B5B66"
  },
  warningExpiry: {
    fontSize: 12,
    color: "#3B5B66",
    fontWeight: "bold"
  },

  // Expired Card
  cardExpired: {
    backgroundColor: "#FCEBE5",
    borderColor: "#E8C1B7"
  },
  iconCircleExpired: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(179, 38, 30, 0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B3261E"
  },
  expiredWarning: {
    fontSize: 12,
    color: "#B3261E",
    fontWeight: "bold",
    lineHeight: 16
  },

  // Recent History section
  historySection: {
    gap: 12
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#E57A58"
  },
  historyCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5ECE9",
    paddingVertical: 6,
    paddingHorizontal: 14
  },
  historyItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  historyTextWrap: {
    gap: 2
  },
  historyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A3E39"
  },
  historyTime: {
    fontSize: 11,
    color: "#A08E88",
    fontWeight: "600"
  },
  divider: {
    height: 1,
    backgroundColor: "#F5ECE9"
  }
});
