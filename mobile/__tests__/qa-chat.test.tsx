import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { QaChatScreen } from "@/features/qa/QaChatScreen";
import { copy } from "@/data/stitchCopy.bn";

const generalCategory = "সাধারণ প্রশ্ন";
const nutritionCategory = "পুষ্টি";
const emergencyCategory = "জরুরি লক্ষণ";
const generalQuestion = "আমার সকাল থেকে একটু মাথা ঘুরছে।";
const generalAnswer = "এটি গুরুত্বপূর্ণ লক্ষণ হতে পারে।";
const onlineQuestion = "গর্ভাবস্থায় বমি হলে কী করব?";
const onlineAnswer = "বমি হলে অল্প অল্প করে খাবার খান এবং পানি পান করুন।";
const offlineSearchQuestion = "মাথা ঘুরছে";
const offlineSearchAnswer = "বিশ্রাম নিন এবং পানি পান করুন।";
const emergencyQuestion = "রক্ত গেলে কী করব?";
const nonEmergencyQuestion = "হালকা বিশ্রামের প্রশ্ন";

const mockCategories = [generalCategory, nutritionCategory, emergencyCategory];
const mockQuestions = [
  {
    id: "q-1",
    trimester: "T3" as const,
    week_range: "28-30",
    topic: "সাধারণ_প্রশ্ন",
    question_bn: generalQuestion,
    answer_bn: generalAnswer,
    severity: "HIGH" as const,
    see_doctor: true,
    emergency: false
  }
];
const mockEmergencyQuestions = [
  {
    id: "q-emergency-1",
    trimester: "T3" as const,
    week_range: "28-40",
    topic: "জরুরি_লক্ষণ",
    question_bn: emergencyQuestion,
    answer_bn: "এখনই হাসপাতালে যান।",
    severity: "HIGH" as const,
    see_doctor: false,
    emergency: true
  },
  {
    id: "q-emergency-2",
    trimester: "T3" as const,
    week_range: "28-40",
    topic: "জরুরি_লক্ষণ",
    question_bn: nonEmergencyQuestion,
    answer_bn: "বিশ্রাম নিন।",
    severity: "LOW" as const,
    see_doctor: false,
    emergency: false
  }
];
const mockSearchResults = [
  {
    id: "q-search-1",
    trimester: "T3" as const,
    week_range: "28-30",
    topic: "সাধারণ_প্রশ্ন",
    question_bn: offlineSearchQuestion,
    answer_bn: offlineSearchAnswer,
    severity: "LOW" as const,
    see_doctor: false,
    emergency: false
  }
];

const mockAskOnline = jest.fn<Promise<{ answer: string; is_emergency: boolean; source: string; emergency_text: string | null } | null>, [string]>(async () => null);
const mockGetQaByTopic = jest.fn(async (params: { topic: string }) =>
  params.topic === "জরুরি_লক্ষণ" ? mockEmergencyQuestions : mockQuestions
);

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("expo-router", () => ({
  __esModule: true,
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn()
  },
  useSegments: () => ["(mother-tabs)", "chat"]
}));

const mockRouter = jest.requireMock("expo-router").router as {
  back: jest.Mock;
  canGoBack: jest.Mock;
  replace: jest.Mock;
};

jest.mock("@/features/qa/offlineQaStore", () => ({
  getQaCategories: () => mockCategories.map((label) => ({ label, topic: label.replace(/\s+/g, "_") })),
  getQaByTopic: (params: { topic: string }) => mockGetQaByTopic(params),
  searchQa: jest.fn(async () => mockSearchResults)
}));

jest.mock("@/api/chatClient", () => ({
  askOnline: (...args: [string]) => mockAskOnline(...args)
}));

describe("QaChatScreen", () => {
  async function renderTree() {
    let tree: ReactTestRenderer | null = null;
    await act(async () => {
      tree = create(<QaChatScreen />);
    });
    return tree as unknown as ReactTestRenderer;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockAskOnline.mockResolvedValue(null);
    mockRouter.canGoBack.mockReturnValue(true);
  });

  it("loads offline categories and does not show placeholder SMS text", async () => {
    const tree = await renderTree();

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain(generalCategory);
    expect(snapshot).not.toContain("16789");
    expect(snapshot).not.toContain("SMS-এও কাজ করে");
  });

  it("loads questions for the selected category and appends the selected answer", async () => {
    const tree = await renderTree();
    const categoryNode = tree.root.findByProps({ accessibilityLabel: generalCategory });

    await act(async () => {
      await categoryNode.props.onPress();
    });

    const questionNode = tree.root.findByProps({ accessibilityLabel: generalQuestion });

    await act(async () => {
      questionNode.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain(generalAnswer);
  });

  it("uses the online chat answer when the backend responds", async () => {
    mockAskOnline.mockResolvedValue({
      answer: onlineAnswer,
      is_emergency: false,
      source: "groq",
      emergency_text: null
    });

    const tree = await renderTree();
    const input = tree.root.findByProps({ accessibilityLabel: copy.qa.askPlaceholder });
    const send = tree.root.findByProps({ accessibilityLabel: copy.qa.sendQuestion });

    await act(async () => {
      input.props.onChangeText(onlineQuestion);
    });

    await act(async () => {
      await send.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockAskOnline).toHaveBeenCalledWith(onlineQuestion);
    expect(snapshot).toContain(onlineAnswer);
  });

  it("falls back to offline keyword search for free-text questions", async () => {
    const tree = await renderTree();
    const input = tree.root.findByProps({ accessibilityLabel: copy.qa.askPlaceholder });
    const send = tree.root.findByProps({ accessibilityLabel: copy.qa.sendQuestion });

    await act(async () => {
      input.props.onChangeText(offlineSearchQuestion);
    });

    await act(async () => {
      await send.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain(offlineSearchAnswer);
  });

  it("shows emergency questions and filters out non-emergency items", async () => {
    const tree = await renderTree();
    const emergencyButton = tree.root.findByProps({ accessibilityLabel: copy.common.emergency });

    await act(async () => {
      await emergencyButton.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockGetQaByTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "জরুরি_লক্ষণ" }));
    expect(snapshot).toContain("জরুরি লক্ষণ");
    expect(snapshot).toContain("নিচের যেকোনো লক্ষণ দেখা দিলে এখনই হাসপাতালে যান।");
    expect(snapshot).toContain(emergencyQuestion);
    expect(snapshot).not.toContain(nonEmergencyQuestion);
  });

  it("navigates back or falls back to the mother home route", async () => {
    const tree = await renderTree();
    const backButton = tree.root.findByProps({ accessibilityLabel: copy.common.back });

    act(() => {
      backButton.props.onPress();
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);

    mockRouter.canGoBack.mockReturnValue(false);
    act(() => {
      backButton.props.onPress();
    });

    expect(mockRouter.replace).toHaveBeenCalledWith("/(mother-tabs)/home");
  });
});
