import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { QaChatScreen } from "@/features/qa/QaChatScreen";

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

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("@/features/qa/offlineQaStore", () => ({
  getQaCategories: () => mockCategories.map((label) => ({ label, topic: label.replace(/\s+/g, "_") })),
  getQaByTopic: jest.fn(async () => mockQuestions)
}));

describe("QaChatScreen", () => {
  async function renderTree() {
    let tree: ReactTestRenderer | null = null;
    await act(async () => {
      tree = create(<QaChatScreen />);
    });
    return tree as unknown as ReactTestRenderer;
  }

  it("loads offline categories and does not show placeholder SMS text", async () => {
    const tree = await renderTree();

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain("সাধারণ প্রশ্ন");
    expect(snapshot).not.toContain("16789");
    expect(snapshot).not.toContain("SMS-এও কাজ করে");
  });

  it("loads questions for the selected category and appends the selected answer", async () => {
    const tree = await renderTree();
    const categoryNode = tree.root.findByProps({ accessibilityLabel: "সাধারণ প্রশ্ন" });

    await act(async () => {
      await categoryNode.props.onPress();
    });

    const questionNode = tree.root.findByProps({ accessibilityLabel: "আমার সকাল থেকে একটু মাথা ঘুরছে।" });

    await act(async () => {
      questionNode.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain("এটি গুরুত্বপূর্ণ লক্ষণ হতে পারে।");
  });
});
