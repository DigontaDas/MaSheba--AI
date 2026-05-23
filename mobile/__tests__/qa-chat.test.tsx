import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";
import { QaChatScreen } from "@/features/qa/QaChatScreen";
import { copy } from "@/data/stitchCopy.bn";

const mockCategories = ["সাধারণ প্রশ্ন", "পুষ্টি"];
const mockQuestions = [
  {
    id: "q-1",
    trimester: "T3" as const,
    week_range: "28-30",
    topic: "সাধারণ প্রশ্ন",
    question_bn: "আমার সকাল থেকে একটু মাথা ঘুরছে।",
    answer_bn: "এটি গুরুত্বপূর্ণ লক্ষণ হতে পারে।",
    severity: "HIGH" as const,
    see_doctor: true,
    emergency: false
  }
];

const mockEmergencyAnswers = [
  {
    id: "e-1",
    trimester: "ALL" as const,
    week_range: "",
    topic: "",
    question_bn: "",
    answer_bn: copy.qa.highRiskBody,
    severity: "HIGH" as const,
    see_doctor: true,
    emergency: true
  }
];

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("@/db/offlineQa", () => ({
  getOfflineQaCategories: () => mockCategories,
  getOfflineQaByTopic: jest.fn(async () => mockQuestions),
  getEmergencyOfflineQa: jest.fn(async () => mockEmergencyAnswers),
  trimesterFromWeeks: jest.fn(() => "T3")
}));

function getText(tree: ReturnType<typeof create>, text: string) {
  return tree.root.findAllByType(Text).find((node) => (node.children ?? []).join("") === text);
}

describe("QaChatScreen", () => {
  async function renderTree() {
    let tree: ReactTestRenderer | null = null;
    await act(async () => {
      tree = create(<QaChatScreen />);
    });
    return tree as unknown as ReactTestRenderer;
  }

  it("loads offline categories and shows the emergency banner", async () => {
    const tree = await renderTree();

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain("সাধারণ প্রশ্ন");
    expect(snapshot).toContain(copy.qa.highRiskTitle);
    expect(snapshot).toContain(copy.qa.sms);
  });

  it("loads questions for the selected category and appends the selected answer", async () => {
    const tree = await renderTree();
    const questionNode = tree.root.findByProps({ accessibilityLabel: "আমার সকাল থেকে একটু মাথা ঘুরছে।" });

    await act(async () => {
      questionNode.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain("এটি গুরুত্বপূর্ণ লক্ষণ হতে পারে।");
  });
});
