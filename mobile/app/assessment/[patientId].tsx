import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RiskBadge } from "@/components/RiskBadge";
import { SYMPTOM_OPTIONS } from "@/db/schema";
import { getPatient } from "@/db/patients";
import { insertVisit } from "@/db/visits";
import { getSession } from "@/auth/secureSession";
import { riskModel } from "@/model/riskModel";
import type { Patient, RiskPrediction, SymptomFlags, VisitInput } from "@/types/schema";
import { getDeviceId } from "@/utils/ids";

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

export default function RiskAssessmentScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      return;
    }
    getPatient(patientId).then(setPatient).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load patient");
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
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (key: string) => {
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
      setError("Complete all vital fields before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const session = await getSession();
      if (!session) {
        throw new Error("Login session is missing.");
      }
      const deviceId = await getDeviceId();
      await insertVisit({
        patient,
        chwId: session.chwId,
        deviceId,
        input: parsedInput,
        prediction
      });
      router.replace("/(tabs)/patients");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save visit");
    } finally {
      setSaving(false);
    }
  };

  if (!patient) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <OfflineBanner />
      <Text style={styles.name}>{patient.name}</Text>
      <Text style={styles.readonly}>Gestational age: {patient.gestational_age_weeks} weeks</Text>
      <NumberInput label="Systolic BP" value={form.bp_systolic} onChangeText={(value) => updateField("bp_systolic", value)} />
      <NumberInput label="Diastolic BP" value={form.bp_diastolic} onChangeText={(value) => updateField("bp_diastolic", value)} />
      <NumberInput label="Weight kg" value={form.weight_kg} onChangeText={(value) => updateField("weight_kg", value)} />
      <NumberInput label="Hemoglobin" value={form.hemoglobin} onChangeText={(value) => updateField("hemoglobin", value)} />

      <Pressable
        style={[styles.toggle, form.swelling_present && styles.toggleActive]}
        onPress={() => updateField("swelling_present", !form.swelling_present)}
      >
        <Text style={form.swelling_present ? styles.toggleTextActive : styles.toggleText}>
          Swelling present
        </Text>
      </Pressable>

      <View style={styles.symptoms}>
        {SYMPTOM_OPTIONS.map((symptom) => {
          const active = Boolean(form.symptom_flags[symptom.key]);
          return (
            <Pressable
              key={symptom.key}
              style={[styles.symptom, active && styles.symptomActive]}
              onPress={() => toggleSymptom(symptom.key)}
            >
              <Text style={active ? styles.symptomTextActive : styles.symptomText}>{symptom.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {prediction ? (
        <View style={styles.prediction}>
          <Text style={styles.predictionLabel}>Inferred risk</Text>
          <RiskBadge level={prediction.risk_level} />
          <Text style={styles.reason}>{prediction.reasons?.join(", ")}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save visit</Text>}
      </Pressable>
    </ScrollView>
  );
}

function NumberInput({
  label,
  value,
  onChangeText
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput keyboardType="numeric" value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#f8fafc",
    flex: 1
  },
  content: {
    gap: 14,
    padding: 16
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  name: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800"
  },
  readonly: {
    color: "#475569",
    fontSize: 15
  },
  inputGroup: {
    gap: 6
  },
  label: {
    color: "#334155",
    fontWeight: "700"
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    color: "#0f172a",
    minHeight: 46,
    paddingHorizontal: 12
  },
  toggle: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    padding: 12
  },
  toggleActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#047857"
  },
  toggleText: {
    color: "#334155",
    fontWeight: "700"
  },
  toggleTextActive: {
    color: "#047857",
    fontWeight: "800"
  },
  symptoms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  symptom: {
    backgroundColor: "#fff",
    borderColor: "#cbd5e1",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  symptomActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0284c7"
  },
  symptomText: {
    color: "#334155"
  },
  symptomTextActive: {
    color: "#0369a1",
    fontWeight: "700"
  },
  prediction: {
    gap: 8,
    paddingVertical: 4
  },
  predictionLabel: {
    color: "#334155",
    fontWeight: "700"
  },
  reason: {
    color: "#64748b"
  },
  button: {
    alignItems: "center",
    backgroundColor: "#047857",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 48
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  error: {
    color: "#be123c"
  }
});
