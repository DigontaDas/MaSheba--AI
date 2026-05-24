import React from "react";
import { Alert } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import PatientDashboardScreen from "../app/(tabs)/patients";
import NutritionScreen from "../app/(mother-tabs)/nutrition";
import ProfileScreen from "../app/(mother-tabs)/profile";
import { MotherDashboard } from "@/features/mother/MotherDashboard";
import { copy } from "@/data/stitchCopy.bn";

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn()
};
const mockCallPhoneNumber = jest.fn();
const mockGetCurrentMotherProfile = jest.fn();
const mockClearSession = jest.fn();
const mockClearRoleSession = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetPatients = jest.fn();
const mockGetOutboxSummary = jest.fn();
const mockRunOutboxSync = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: mockRouter,
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, [callback]);
    }
  };
});

jest.mock("expo-image", () => ({
  Image: (props: Record<string, unknown>) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, props);
  }
}));

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("@/components/risk/RiskGauge", () => ({
  RiskGauge: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, "risk-gauge");
  }
}));

jest.mock("@/utils/phone", () => ({
  callPhoneNumber: (number: string) => mockCallPhoneNumber(number)
}));

jest.mock("@/auth/secureSession", () => ({
  clearSession: () => mockClearSession()
}));

jest.mock("@/auth/roleSession", () => ({
  clearRoleSession: () => mockClearRoleSession(),
  getCurrentMotherProfile: () => mockGetCurrentMotherProfile()
}));

jest.mock("@/auth/supabaseAuth", () => ({
  supabase: {
    auth: {
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      resetPasswordForEmail: (email: string) => mockResetPasswordForEmail(email)
    }
  }
}));

jest.mock("@/db/patients", () => ({
  getPatients: () => mockGetPatients()
}));

jest.mock("@/db/outbox", () => ({
  getOutboxSummary: () => mockGetOutboxSummary()
}));

jest.mock("@/sync/backgroundSync", () => ({
  runOutboxSync: () => mockRunOutboxSync()
}));

jest.mock("expo-network", () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true })
}));

const patient = {
  id: "patient-1",
  chw_id: "chw-1",
  name: "রহিমা খাতুন",
  age: 26,
  gestational_age_weeks: 28,
  last_risk_level: "LOW" as const,
  created_at: "2026-05-23T00:00:00.000Z",
  updated_at: "2026-05-23T00:00:00.000Z"
};

async function renderTree(node: React.ReactElement) {
  let tree: ReactTestRenderer | null = null;
  await act(async () => {
    tree = create(node);
    await Promise.resolve();
  });
  return tree as unknown as ReactTestRenderer;
}

describe("mobile interactive elements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    mockRouter.canGoBack.mockReturnValue(true);
    mockGetCurrentMotherProfile.mockResolvedValue({ name: "মা", gestationalAgeWeeks: 28 });
    mockSignOut.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
    mockClearRoleSession.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ data: { session: { user: { email: "mother@example.com" } } } });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockGetPatients.mockResolvedValue([patient]);
    mockGetOutboxSummary.mockResolvedValue({ pending: 0, failed: 0, lastSyncedAt: null });
    mockRunOutboxSync.mockResolvedValue(undefined);
  });

  it("wires mother dashboard menu, notification, audio, and emergency actions", async () => {
    const tree = await renderTree(<MotherDashboard week={24} />);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "মেনু" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("মেনু", "", expect.any(Array));

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "নোটিফিকেশন" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "অডিও শুনুন" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("শীঘ্রই আসছে", "এই বৈশিষ্ট্যটি শীঘ্রই আসছে।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.mother.emergencyHelp }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("⚠️ জরুরি সাহায্য", "এখনই সাহায্যের জন্য কল করুন:", expect.any(Array));
  });

  it("wires profile settings rows and password reset flow", async () => {
    const tree = await renderTree(<ProfileScreen />);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.profile.language }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("ভাষা পরিবর্তন", "বর্তমানে শুধু বাংলা ভাষা উপলব্ধ।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.profile.security }).props.onPress();
    });

    const passwordAlert = (Alert.alert as jest.Mock).mock.calls.find(([title]) => title === "পাসওয়ার্ড পরিবর্তন");
    expect(passwordAlert).toBeTruthy();
    await act(async () => {
      await passwordAlert?.[2][1].onPress();
    });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("mother@example.com");
    expect(Alert.alert).toHaveBeenCalledWith("সফল", "ইমেইল পাঠানো হয়েছে।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.profile.help }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("সাহায্য ও সাপোর্ট", "স্বাস্থ্য সেবা হটলাইন: ১৬৭৬৭\nজরুরি: ৯৯৯", expect.any(Array));
  });

  it("wires nutrition filters, menu, notification, and card info alerts", async () => {
    const tree = await renderTree(<NutritionScreen />);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "মেনু" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("মেনু", "", expect.any(Array));

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "নোটিফিকেশন" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.nutrition.drinks }).props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain(copy.nutrition.milk);
    expect(JSON.stringify(tree.toJSON())).not.toContain(copy.nutrition.spinach);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.nutrition.milk }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith(copy.nutrition.milk, `${copy.nutrition.milkAmount}\n${copy.nutrition.calcium}`, [{ text: "ঠিক আছে" }]);
  });

  it("wires CHW dashboard menu, notification, and clinic call action", async () => {
    const tree = await renderTree(<PatientDashboardScreen />);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "মেনু" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("মেনু", "", expect.any(Array));

    act(() => {
      tree.root.findByProps({ accessibilityLabel: "নোটিফিকেশন" }).props.onPress();
    });
    expect(Alert.alert).toHaveBeenCalledWith("নোটিফিকেশন", "কোনো নতুন নোটিফিকেশন নেই।", [{ text: "ঠিক আছে" }]);

    act(() => {
      tree.root.findByProps({ accessibilityLabel: copy.dashboard.clinic }).props.onPress();
    });
    expect(mockCallPhoneNumber).toHaveBeenCalledWith("16789");

    act(() => {
      tree.unmount();
    });
  });
});
