import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { OfflineBanner } from "@/components/OfflineBanner";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { VitalInputField } from "@/components/form/VitalInputField";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Icon } from "@/components/ui/Icon";
import { getSession } from "@/auth/secureSession";
import { copy } from "@/data/stitchCopy.bn";
import { SYMPTOM_OPTIONS } from "@/db/schema";
import { getPatient } from "@/db/patients";
import { insertVisit } from "@/db/visits";
import { riskModel } from "@/model/riskModel";
import { colors, radius, spacing, typography } from "@/theme";
import type { Patient, RiskPrediction, SymptomFlags, VisitInput } from "@/types/schema";
import { getDeviceId } from "@/utils/ids";
import { toBanglaNumber } from "@/utils/banglaNumerals";

type FormState = {
  bp_systolic: string;
  bp_diastolic: string;
  weight_kg: string;
  hemoglobin: string;
  swelling_present: boolean;
  symptom_flags: SymptomFlags;
};

const initialForm: FormState = {
  bp_systolic: "",
  bp_diastolic: "",
  weight_kg: "",
  hemoglobin: "",
  swelling_present: false,
  symptom_flags: {}
};

const symptomLabels: Record<string, string> = {
  headache: "মাথাব্যথা",
  severe_headache: "তীব্র মাথাব্যথা",
  blurred_vision: "চোখ ঝাপসা",
  dizziness: "মাথা ঘোরা",
  fatigue: "ক্লান্তি",
  abdominal_pain: "পেটে ব্যথা"
};

export default function RiskAssessmentScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      return;
    }
    getPatient(patientId).then(setPatient).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "রোগী লোড করা যায়নি");
    });
  }, [patientId]);

  const parsedInput = useMemo<VisitInput | null>(() => {
    const input = {
      bp_systolic: Number(form.bp_systolic),
      bp_diastolic: Number(form.bp_diastolic),
      weight_kg: Number(form.weight_kg),
      hemoglobin: Number(form.hemoglobin),
      swelling_present: form.swelling_present,
      symptom_flags: form.symptom_flags
    };

    if (
      !Number.isFinite(input.bp_systolic) ||
      !Number.isFinite(input.bp_diastolic) ||
      !Number.isFinite(input.weight_kg) ||
      !Number.isFinite(input.hemoglobin)
    ) {
      return null;
    }

    return input;
  }, [form]);

  useEffect(() => {
    if (!patient || !parsedInput) {
      setPrediction(null);
      return;
    }

    riskModel
      .predict({ ...parsedInput, gestational_age_weeks: patient.gestational_age_weeks })
      .then(setPrediction)
      .catch(() => setPrediction(null));
  }, [patient, parsedInput]);

  const updateField = (key: keyof FormState, value: string | boolean | SymptomFlags) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (key: string) => {
    setSaved(false);
    setForm((current) => ({
      ...current,
      symptom_flags: {
        ...current.symptom_flags,
        [key]: !current.symptom_flags[key]
      }
    }));
  };

  const save = async () => {
    if (!patient || !parsedInput || !prediction) {
      setError("সব তথ্য পূরণ করুন");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const session = await getSession();
      if (!session) {
        throw new Error("লগইন সেশন নেই");
      }
      const deviceId = await getDeviceId();
      await insertVisit({
        patient,
        chwId: session.chwId,
        deviceId,
        input: parsedInput,
        prediction
      });
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ভিজিট সংরক্ষণ করা যায়নি");
    } finally {
      setSaving(false);
    }
  };

  if (!patient) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenShell>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>{patient.name}</Text>
        <Text style={styles.subtitle}>
          {copy.dashboard.pregnancy}: {toBanglaNumber(patient.gestational_age_weeks)} সপ্তাহ
        </Text>
        <ProgressBar value={patient.gestational_age_weeks} max={40} showMarkers />
      </View>

      {!saved ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{copy.assessment.formTitle}</Text>
          <VitalInputField label={copy.assessment.bpSystolic} unit="mmHg" value={form.bp_systolic} onChangeText={(value) => updateField("bp_systolic", value)} />
          <VitalInputField label={copy.assessment.bpDiastolic} unit="mmHg" value={form.bp_diastolic} onChangeText={(value) => updateField("bp_diastolic", value)} />
          <VitalInputField label={copy.assessment.weight} unit="kg" value={form.weight_kg} onChangeText={(value) => updateField("weight_kg", value)} />
          <VitalInputField label={copy.assessment.hemoglobin} unit="g/dL" value={form.hemoglobin} onChangeText={(value) => updateField("hemoglobin", value)} />

          <Pressable
            onPress={() => updateField("swelling_present", !form.swelling_present)}
            style={[styles.toggle, form.swelling_present && styles.toggleActive]}
          >
            <Icon name={form.swelling_present ? "check-circle" : "radio-button-unchecked"} color={form.swelling_present ? colors.secondary : colors.outline} />
            <Text style={styles.toggleText}>{copy.assessment.swelling}</Text>
          </Pressable>

          <Text style={styles.label}>{copy.assessment.symptoms}</Text>
          <View style={styles.symptoms}>
            {SYMPTOM_OPTIONS.map((symptom) => {
              const active = Boolean(form.symptom_flags[symptom.key]);
              return (
                <Pressable
                  key={symptom.key}
                  style={[styles.symptom, active && styles.symptomActive]}
                  onPress={() => toggleSymptom(symptom.key)}
                >
                  <Text style={[styles.symptomText, active && styles.symptomTextActive]}>
                    {symptomLabels[symptom.key] ?? symptom.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {prediction ? (
            <View style={styles.preview}>
              <Text style={styles.label}>{copy.assessment.result}</Text>
              <RiskBadge level={prediction.risk_level} />
              <RiskGauge score={prediction.score ?? riskScoreForLevel(prediction.risk_level)} level={prediction.risk_level} />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={copy.assessment.saveVisit} loading={saving} disabled={!prediction} onPress={save} />
        </View>
      ) : prediction ? (
        <RiskResult patient={patient} prediction={prediction} />
      ) : null}
    </ScreenShell>
  );
}

function RiskResult({ patient, prediction }: { patient: Patient; prediction: RiskPrediction }) {
  const high = prediction.risk_level === "HIGH";
  return (
    <View style={styles.result}>
      <View style={styles.warningCard}>
        <View style={styles.warningHeader}>
          <Icon name="warning" color={colors.primary} />
          <Text style={styles.warningLabel}>{copy.assessment.warning}</Text>
        </View>
        <Text style={styles.warningMessage}>{copy.assessment.riskMessage}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.resultTop}>
          <View style={styles.resultText}>
            <Text style={styles.sectionTitle}>{copy.assessment.highBp}</Text>
            <Text style={styles.subtitle}>{copy.assessment.highBpDescription}</Text>
          </View>
          <RiskBadge level={prediction.risk_level} />
        </View>
        <RiskGauge score={prediction.score ?? riskScoreForLevel(prediction.risk_level)} level={prediction.risk_level} />
        {prediction.reasons?.length ? <Text style={styles.subtitle}>{prediction.reasons.join(", ")}</Text> : null}
      </View>

      {high ? (
        <EmergencyBanner
          title={copy.assessment.title}
          message={copy.assessment.riskMessage}
          actionLabel={copy.assessment.callNow}
          onAction={() => Linking.openURL("tel:16789")}
        />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{copy.assessment.nextSteps}</Text>
        {[copy.assessment.stepRest, copy.assessment.stepWater, copy.assessment.stepChw].map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{toBanglaNumber(index + 1)}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.clinicCard}>
        <Image
          source={require("../../assets/stitch/a_simple_clean_mobile_map_interface_showing_a_location_pin_in_a_residential.png")}
          style={styles.map}
          contentFit="cover"
        />
        <Text style={styles.sectionTitle}>{copy.assessment.nearestClinic}</Text>
        <Text style={styles.subtitle}>{copy.assessment.clinicName}</Text>
        <Text style={styles.label}>{copy.assessment.clinicDistance}</Text>
        <PrimaryButton label={copy.assessment.callNow} iconName="call" onPress={() => Linking.openURL("tel:16789")} />
      </View>
    </View>
  );
}

function riskScoreForLevel(level: RiskPrediction["risk_level"]): number {
  if (level === "HIGH") {
    return 0.86;
  }
  if (level === "MODERATE") {
    return 0.58;
  }
  return 0.24;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  },
  header: {
    gap: spacing.sm
  },
  title: {
    ...typography.h1,
    color: colors.onSurface
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.base,
    padding: spacing.cardPadding
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.onSurface
  },
  label: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  toggle: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.base
  },
  toggleActive: {
    backgroundColor: colors.secondaryContainer,
    borderColor: colors.secondaryFixedDim
  },
  toggleText: {
    ...typography.body,
    color: colors.onSurface
  },
  symptoms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  symptom: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.outlineVariant,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm
  },
  symptomActive: {
    backgroundColor: colors.primaryFixed,
    borderColor: colors.primaryContainer
  },
  symptomText: {
    ...typography.label,
    color: colors.onSurfaceVariant
  },
  symptomTextActive: {
    color: colors.primary
  },
  preview: {
    alignItems: "center",
    gap: spacing.sm
  },
  error: {
    ...typography.label,
    color: colors.error
  },
  result: {
    gap: spacing.base
  },
  warningCard: {
    backgroundColor: colors.warningCard,
    borderColor: colors.primaryContainer,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.cardPadding
  },
  warningHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  warningLabel: {
    ...typography.h2,
    color: colors.onPrimaryContainer
  },
  warningMessage: {
    ...typography.body,
    color: colors.onSurfaceVariant
  },
  resultTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  resultText: {
    flex: 1,
    gap: spacing.xs
  },
  stepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.full,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  stepNumberText: {
    ...typography.label,
    color: colors.onPrimaryFixed
  },
  stepText: {
    ...typography.body,
    color: colors.onSurface,
    flex: 1
  },
  clinicCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: "hidden",
    padding: spacing.cardPadding
  },
  map: {
    aspectRatio: 1.9,
    borderRadius: radius.lg,
    width: "100%"
  }
});
