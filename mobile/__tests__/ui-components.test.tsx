import React from "react";
import renderer, { act, type ReactTestRenderer } from "react-test-renderer";
import { StyleSheet, Text } from "react-native";
import { colors } from "@/theme";
import { RiskBadge } from "@/components/risk/RiskBadge";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { EmergencyBanner } from "@/components/emergency/EmergencyBanner";
import { VitalInputField } from "@/components/form/VitalInputField";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { PatientCard } from "@/components/patient/PatientCard";

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("expo-network", () => ({
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true })
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const createMock = (name: string) => (props: Record<string, unknown>) => React.createElement(name, props, props.children);
  return {
    __esModule: true,
    default: createMock("Svg"),
    Circle: createMock("Circle"),
    Defs: createMock("Defs"),
    LinearGradient: createMock("LinearGradient"),
    Stop: createMock("Stop"),
    Text: createMock("SvgText")
  };
});

describe("shared mobile UI", () => {
  async function renderTree(node: React.ReactElement) {
    let tree: ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(node);
    });
    return tree as unknown as ReactTestRenderer;
  }

  it("renders risk badge labels and colors for each level", async () => {
    const cases = [
      { level: "LOW" as const, label: "নিম্ন", backgroundColor: colors.secondaryContainer, textColor: colors.onSecondaryFixed },
      { level: "MODERATE" as const, label: "মধ্যম", backgroundColor: colors.tertiaryFixed, textColor: colors.onTertiaryFixedVariant },
      { level: "HIGH" as const, label: "উচ্চ", backgroundColor: colors.errorContainer, textColor: colors.onErrorContainer }
    ];

    for (const testCase of cases) {
      const tree = await renderTree(<RiskBadge level={testCase.level} />);
      const badge = tree.root.findByProps({ accessibilityLabel: `ঝুঁকি ${testCase.label}` });
      expect(StyleSheet.flatten(badge.props.style)).toMatchObject({ backgroundColor: testCase.backgroundColor });

      const textNode = badge.findAllByType(Text).at(-1);
      expect(JSON.stringify(tree.toJSON())).toContain(testCase.label);
      expect(StyleSheet.flatten(textNode?.props.style)).toMatchObject({ color: testCase.textColor });
    }
  });

  it("renders the risk gauge for every risk level without crashing", async () => {
    await renderTree(<RiskGauge score={0.2} level="LOW" />);
    await renderTree(<RiskGauge score={0.5} level="MODERATE" />);
    await renderTree(<RiskGauge score={0.9} level="HIGH" />);
  });

  it("shows and hides the offline banner based on offline state", async () => {
    const hidden = await renderTree(<OfflineBanner isOffline={false} />);
    expect(hidden.toJSON()).toBeNull();

    const visible = (await renderTree(<OfflineBanner isOffline pendingCount={0} />)).toJSON();
    expect(JSON.stringify(visible)).toContain("ইন্টারনেট ছাড়াও কাজ করে");
    expect(JSON.stringify(visible)).toContain("• 0");
  });

  it("renders an alert banner with an action button", async () => {
    const tree = await renderTree(<EmergencyBanner title="জরুরি" message="এখনই সাহায্য নিন" actionLabel="ফোন করুন" onAction={jest.fn()} />);
    expect(JSON.stringify(tree.toJSON())).toContain("ফোন করুন");
    expect(JSON.stringify(tree.toJSON())).toContain("এখনই সাহায্য নিন");
  });

  it("shows the error state for a vital input field", async () => {
    const tree = await renderTree(<VitalInputField label="রক্তচাপ" value="" unit="mmHg" error="এই ক্ষেত্রটি প্রয়োজন" onChangeText={jest.fn()} />);
    expect(JSON.stringify(tree.toJSON())).toContain("এই ক্ষেত্রটি প্রয়োজন");

    const input = tree.root.findByProps({ accessibilityLabel: "রক্তচাপ" });
    expect(input.props.accessibilityState).toMatchObject({ invalid: true });
  });

  it("aligns chat bubbles by role and keeps warning content intact", async () => {
    const aiTree = (await renderTree(<ChatBubble role="ai" text="এআই বার্তা" timestamp="১০:৩০ এএম" />)).root;
    const aiWrap = aiTree.findByProps({ accessibilityLabel: "এআইয়ের বার্তা: এআই বার্তা" });
    expect(StyleSheet.flatten(aiWrap.props.style)).toMatchObject({ alignItems: "flex-start" });

    const userTree = (await renderTree(<ChatBubble role="user" text="ব্যবহারকারীর বার্তা" timestamp="১০:৩২ এএম" />)).root;
    const userWrap = userTree.findByProps({ accessibilityLabel: "ব্যবহারকারীর বার্তা: ব্যবহারকারীর বার্তা" });
    expect(StyleSheet.flatten(userWrap.props.style)).toMatchObject({ alignItems: "flex-end" });
  });

  it("renders a tappable patient card with the selected risk badge", async () => {
    const patient = {
      id: "patient-1",
      chw_id: "chw-1",
      name: "রহিমা খাতুন",
      age: 26,
      gestational_age_weeks: 28,
      last_risk_level: "HIGH" as const,
      created_at: "2026-05-23T00:00:00.000Z",
      updated_at: "2026-05-23T00:00:00.000Z"
    };

    const tree = await renderTree(<PatientCard patient={patient} riskLevel="HIGH" nextAction="জরুরি রেফার" onPress={jest.fn()} />);
    expect(JSON.stringify(tree.toJSON())).toContain("উচ্চ");
    expect(JSON.stringify(tree.toJSON())).toContain("রহিমা খাতুন");
    expect(JSON.stringify(tree.toJSON())).toContain("জরুরি রেফার");
  });
});