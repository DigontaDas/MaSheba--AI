import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";
import RiskAssessmentScreen from "../app/assessment/[patientId]";
import { copy } from "@/data/stitchCopy.bn";

const mockGetSession = jest.fn();
const mockGetPatient = jest.fn();
const mockInsertVisit = jest.fn();
const mockPredict = jest.fn();
const mockGetDeviceId = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ patientId: "patient-1" })
}));

jest.mock("expo-image", () => ({
  Image: (props: Record<string, unknown>) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, props);
  }
}));

jest.mock("expo-network", () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true })
}));

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("@/auth/secureSession", () => ({
  getSession: () => mockGetSession()
}));

jest.mock("@/db/patients", () => ({
  getPatient: (...args: unknown[]) => mockGetPatient(...args)
}));

jest.mock("@/db/visits", () => ({
  insertVisit: (...args: unknown[]) => mockInsertVisit(...args)
}));

jest.mock("@/model/riskModel", () => ({
  riskModel: {
    predict: (...args: unknown[]) => mockPredict(...args)
  }
}));

jest.mock("@/utils/ids", () => ({
  getDeviceId: () => mockGetDeviceId()
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({ accessToken: "access", refreshToken: "refresh", chwId: "chw-1" });
  mockGetPatient.mockResolvedValue({
    id: "patient-1",
    chw_id: "chw-1",
    name: "রহিমা খাতুন",
    age: 26,
    gestational_age_weeks: 28,
    last_risk_level: "LOW",
    created_at: "2026-05-23T00:00:00.000Z",
    updated_at: "2026-05-23T00:00:00.000Z"
  });
  mockPredict.mockResolvedValue({ risk_level: "LOW", score: 0.22, reasons: ["Vitals are within expected range"] });
  mockGetDeviceId.mockResolvedValue("device-1");
  mockInsertVisit.mockResolvedValue({ visit: { id: "visit-1" }, idempotency_key: "device-1:1:uuid" });
});

async function renderTree() {
  let tree: ReactTestRenderer | null = null;
  await act(async () => {
    tree = create(<RiskAssessmentScreen />);
  });
  return tree as unknown as ReactTestRenderer;
}

describe("RiskAssessmentScreen", () => {
  it("loads the patient, requires vital inputs, and saves a visit once complete", async () => {
    const tree = await renderTree();

    expect(JSON.stringify(tree.toJSON())).toContain("রহিমা খাতুন");
    expect(tree.root.findByProps({ accessibilityLabel: copy.assessment.saveVisit }).props.accessibilityState).toMatchObject({ disabled: true });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpSystolic }).props.onChangeText("118");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpDiastolic }).props.onChangeText("76");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.weight }).props.onChangeText("58");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.hemoglobin }).props.onChangeText("10.5");
      await Promise.resolve();
    });

    expect(JSON.stringify(tree.toJSON())).toContain("নিম্ন");
    expect(tree.root.findByProps({ accessibilityLabel: copy.assessment.saveVisit }).props.accessibilityState).toMatchObject({ disabled: false });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: copy.assessment.saveVisit }).props.onPress();
      await Promise.resolve();
    });

    expect(mockInsertVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        chwId: "chw-1",
        deviceId: "device-1",
        patient: expect.objectContaining({ id: "patient-1" }),
        input: expect.objectContaining({
          bp_systolic: 118,
          bp_diastolic: 76,
          weight_kg: 58,
          hemoglobin: 10.5,
          swelling_present: false
        }),
        prediction: expect.objectContaining({ risk_level: "LOW" })
      })
    );
  });

  it("blocks submission when a required vital is missing", async () => {
    const tree = await renderTree();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpSystolic }).props.onChangeText("118");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpDiastolic }).props.onChangeText("76");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.weight }).props.onChangeText("58");
      await Promise.resolve();
    });

    expect(tree.root.findByProps({ accessibilityLabel: copy.assessment.saveVisit }).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("shows the blood pressure image card when systolic pressure is high", async () => {
    const tree = await renderTree();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpSystolic }).props.onChangeText("150");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.bpDiastolic }).props.onChangeText("95");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.weight }).props.onChangeText("58");
      tree.root.findByProps({ accessibilityLabel: copy.assessment.hemoglobin }).props.onChangeText("10.5");
      await Promise.resolve();
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: copy.assessment.saveVisit }).props.onPress();
      await Promise.resolve();
    });

    expect(tree.root.findByProps({ accessibilityLabel: "high-bp-visual-card" })).toBeTruthy();
  });
});
