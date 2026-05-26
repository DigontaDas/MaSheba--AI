import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { MEDICINE_SOURCE_LABEL, searchMedicines, type MedicineSearchResult } from "@/data/medicineData";
import { colors, radius, spacing, typography } from "@/theme";

function safetyCopy(level: MedicineSearchResult["safetyLevel"]) {
  if (level === "safe") return { text: "নিরাপদ", icon: "check-circle" as const, color: "#386652", bg: "#EAF6EE" };
  if (level === "avoid") return { text: "সতর্কতা", icon: "cancel" as const, color: "#B3261E", bg: "#FCEBE5" };
  return { text: "ডাক্তারের পরামর্শ নিন", icon: "warning" as const, color: "#8A5A00", bg: "#FFF4D6" };
}

export default function MedicineVerifyScreen() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const results = useMemo(() => searchMedicines(submittedQuery, submittedQuery ? 30 : 12), [submittedQuery]);
  const hasSearched = submittedQuery.trim().length > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>ওষুধ</Text>
        <Text style={styles.headerSub}>CHW medicine database</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="medication" color="#FFFFFF" size={44} />
          </View>
          <Text style={styles.title}>ওষুধের তথ্য যাচাই করুন</Text>
          <Text style={styles.subtitle}>নাম, জেনেরিক, ডোজ ফর্ম বা কোম্পানি দিয়ে তথ্য খুঁজুন।</Text>
          <Text style={styles.source}>Source: {MEDICINE_SOURCE_LABEL}</Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchInputRow}>
            <Icon name="search" color="#A08E88" size={20} />
            <TextInput
              onChangeText={setQuery}
              onSubmitEditing={() => setSubmittedQuery(query)}
              placeholder="ওষুধের নাম লিখুন..."
              placeholderTextColor="#A08E88"
              style={styles.searchInput}
              value={query}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setSubmittedQuery(query)} style={styles.searchButton}>
            <Icon name="search" color="#FFFFFF" size={18} />
            <Text style={styles.searchButtonText}>সার্চ</Text>
          </Pressable>
        </View>

        {hasSearched && !results.length ? (
          <View style={styles.emptyCard}>
            <Icon name="info" color={colors.primary} />
            <Text style={styles.emptyText}>এই ওষুধ সম্পর্কে তথ্য পাওয়া যায়নি। ডাক্তারের পরামর্শ নিন।</Text>
          </View>
        ) : null}

        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>{hasSearched ? "সার্চ ফলাফল" : "নমুনা ওষুধ"}</Text>
          <Text style={styles.resultCount}>{results.length} results</Text>
        </View>

        {results.map((medicine) => (
          <MedicineResultCard key={`${medicine.id}-${medicine.strength}`} medicine={medicine} />
        ))}
      </ScrollView>
    </View>
  );
}

function MedicineResultCard({ medicine }: { medicine: MedicineSearchResult }) {
  const safety = safetyCopy(medicine.safetyLevel);

  return (
    <View style={[styles.resultCard, medicine.safetyLevel === "avoid" && styles.resultCardDanger]}>
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleWrap}>
          <Text style={styles.brandName}>{medicine.brandName}</Text>
          <Text style={styles.genericName}>{medicine.genericName}</Text>
        </View>
        <View style={[styles.safetyBadge, { backgroundColor: safety.bg }]}>
          <Icon name={safety.icon} color={safety.color} size={16} />
          <Text style={[styles.safetyText, { color: safety.color }]}>{safety.text}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaChip}>{medicine.category}</Text>
        {medicine.strength ? <Text style={styles.metaChip}>{medicine.strength}</Text> : null}
      </View>

      <Text style={styles.blockLabel}>ব্যবহার</Text>
      {medicine.uses.map((use) => (
        <Text key={use} style={styles.bodyLine}>• {use}</Text>
      ))}

      <Text style={styles.blockLabel}>ডোজ / ফর্ম</Text>
      <Text style={styles.bodyLine}>{medicine.dose}</Text>

      <Text style={styles.blockLabel}>সতর্কতা</Text>
      {medicine.warnings.map((warning) => (
        <Text key={warning} style={styles.warningLine}>• {warning}</Text>
      ))}

      <Text style={styles.manufacturer}>{medicine.manufacturer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FFF9F6",
    flex: 1
  },
  topBar: {
    backgroundColor: "#FFF9F6",
    borderBottomColor: "#F5ECE9",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 52, android: 56, default: 16 }),
    paddingBottom: 14
  },
  headerTitle: {
    color: "#70605A",
    fontSize: 22,
    fontWeight: "bold"
  },
  headerSub: {
    color: "#A08E88",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40
  },
  hero: {
    alignItems: "center",
    gap: 10
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: "#E57A58",
    borderRadius: 45,
    height: 90,
    justifyContent: "center",
    width: 90
  },
  title: {
    color: "#4A3E39",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center"
  },
  subtitle: {
    color: "#70605A",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  source: {
    color: "#A08E88",
    fontSize: 11,
    textAlign: "center"
  },
  searchCard: {
    gap: 12
  },
  searchInputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    height: 52,
    paddingHorizontal: 16
  },
  searchInput: {
    color: "#4A3E39",
    flex: 1,
    fontSize: 15,
    marginLeft: 10
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#8C4A32",
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center"
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold"
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  emptyText: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: "#4A3E39",
    fontSize: 20,
    fontWeight: "bold"
  },
  resultCount: {
    color: "#A08E88",
    fontSize: 12,
    fontWeight: "600"
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F5ECE9",
    borderLeftColor: "#4A6047",
    borderLeftWidth: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  resultCardDanger: {
    borderLeftColor: "#B3261E"
  },
  resultHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  resultTitleWrap: {
    flex: 1
  },
  brandName: {
    color: "#4A3E39",
    fontSize: 18,
    fontWeight: "bold"
  },
  genericName: {
    color: "#70605A",
    fontSize: 13,
    marginTop: 2
  },
  safetyBadge: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  safetyText: {
    fontSize: 11,
    fontWeight: "bold"
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metaChip: {
    backgroundColor: "#FCEBE5",
    borderRadius: 14,
    color: "#70605A",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  blockLabel: {
    color: "#4A3E39",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 4
  },
  bodyLine: {
    color: "#70605A",
    fontSize: 13,
    lineHeight: 19
  },
  warningLine: {
    color: "#8A5A00",
    fontSize: 13,
    lineHeight: 19
  },
  manufacturer: {
    color: "#A08E88",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4
  }
});
