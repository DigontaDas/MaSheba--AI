import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { QaChatScreen } from "@/features/qa/QaChatScreen";
import { copy } from "@/data/stitchCopy.bn";

const generalCategory = "General questions";
const nutritionCategory = "Nutrition";
const emergencyCategory = "Danger signs";
const postpartumCategory = "Postpartum care";
const breastfeedingCategory = "Breastfeeding";
const generalQuestion = "I feel dizzy this morning.";
const generalAnswer = "This can be an important symptom.";
const postpartumQuestion = "Is postpartum bleeding normal?";
const postpartumAnswer = "Light bleeding can be normal after birth, but heavy bleeding needs urgent care.";
const breastfeedingQuestion = "How do I know my baby is feeding well?";
const breastfeedingAnswer = "Look for frequent feeding, swallowing, wet diapers, and steady weight gain.";
const onlineQuestion = "What should I do for nausea in pregnancy?";
const onlineAnswer = "Eat small frequent meals and drink safe water.";
const romanizedDangerQuestion = "amr proshob hoyeche kintu ekhn rokto jacche ki korbo?";
const safetyRuleAnswer = "আপা, প্রসবের পর হালকা রক্তপাত কিছুদিন স্বাভাবিক হতে পারে, কিন্তু বেশি রক্তপাত বিপদের লক্ষণ হতে পারে। যদি ১ ঘন্টায় ১টি বা তার বেশি প্যাড পুরো ভিজে যায় তাহলে এখনই হাসপাতালে যান।";
const offlineSearchQuestion = "dizzy";
const offlineSearchAnswer = "Rest and drink safe water.";
const emergencyQuestion = "What should I do if bleeding starts?";
const nonEmergencyQuestion = "A mild rest question";

const mockCategories = [
  { id: "general_questions", label: generalCategory, topic: "general_questions" },
  { id: "nutrition", label: nutritionCategory, topic: "nutrition" },
  { id: "danger_signs", label: emergencyCategory, topic: "danger_signs" },
  { id: "postpartum_care", label: postpartumCategory, topic: "postpartum_care" },
  { id: "breastfeeding", label: breastfeedingCategory, topic: "breastfeeding" }
];
const mockQuestions = [
  {
    id: "q-1",
    trimester: "T3" as const,
    week_range: "28-30",
    topic: "general_questions",
    question_bn: generalQuestion,
    answer_bn: generalAnswer,
    severity: "HIGH" as const,
    see_doctor: true,
    emergency: false
  }
];
const mockPostpartumQuestions = [
  {
    id: "q-postpartum-1",
    trimester: "POSTPARTUM" as const,
    week_range: "0-6",
    topic: "postpartum_care",
    question_bn: postpartumQuestion,
    answer_bn: postpartumAnswer,
    severity: "MEDIUM" as const,
    see_doctor: false,
    emergency: false
  }
];
const mockBreastfeedingQuestions = [
  {
    id: "q-breastfeeding-1",
    trimester: "POSTPARTUM" as const,
    week_range: "0-6",
    topic: "breastfeeding",
    question_bn: breastfeedingQuestion,
    answer_bn: breastfeedingAnswer,
    severity: "LOW" as const,
    see_doctor: false,
    emergency: false
  }
];
const mockEmergencyQuestions = [
  {
    id: "q-emergency-1",
    trimester: "T3" as const,
    week_range: "28-40",
    topic: "danger_signs",
    question_bn: emergencyQuestion,
    answer_bn: "Go to the hospital now.",
    severity: "HIGH" as const,
    see_doctor: false,
    emergency: true
  },
  {
    id: "q-emergency-2",
    trimester: "T3" as const,
    week_range: "28-40",
    topic: "danger_signs",
    question_bn: nonEmergencyQuestion,
    answer_bn: "Rest.",
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
    topic: "general_questions",
    question_bn: offlineSearchQuestion,
    answer_bn: offlineSearchAnswer,
    severity: "LOW" as const,
    see_doctor: false,
    emergency: false
  }
];

const mockAskOnline = jest.fn<Promise<{
  answer: string;
  is_emergency: boolean;
  source: string;
  emergency_text: string | null;
  risk_level?: "emergency_now" | "urgent_today" | "self_care_with_warning" | "out_of_scope" | null;
  matched_risk?: string | null;
  red_flags?: string[];
  recommended_action?: string | null;
} | null>, [string]>(async () => null);
const mockAskVoiceClinicalOnline = jest.fn<Promise<{
  transcription: string;
  symptoms: string[];
  answer: string;
  is_emergency: boolean;
  source: string;
}>, [string]>(async () => ({
  transcription: "I have a headache",
  symptoms: ["headache"],
  answer: "Please rest and contact a health worker if it becomes severe.",
  is_emergency: false,
  source: "gemini-voice"
}));
const mockGetQaByTopic = jest.fn(async (params: { topic: string; trimester: string }) => {
  if (params.topic === "danger_signs") return mockEmergencyQuestions;
  if (params.topic === "postpartum_care") return params.trimester === "POSTPARTUM" ? mockPostpartumQuestions : [];
  if (params.topic === "breastfeeding") return params.trimester === "POSTPARTUM" ? mockBreastfeedingQuestions : [];
  return params.trimester === "T3" ? mockQuestions : [];
});
const mockSearchQa = jest.fn(async () => mockSearchResults);

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
  getQaCategories: () => mockCategories,
  getQaByTopic: (params: { topic: string; trimester: string }) => mockGetQaByTopic(params),
  searchQa: (...args: Parameters<typeof mockSearchQa>) => mockSearchQa(...args)
}));

jest.mock("@/api/chatClient", () => ({
  askOnline: (...args: [string]) => mockAskOnline(...args)
}));

jest.mock("@/api/voiceChat", () => ({
  VOICE_RECORDING_OPTIONS: {},
  askVoiceClinicalOnline: (...args: [string]) => mockAskVoiceClinicalOnline(...args)
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
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
    mockAskVoiceClinicalOnline.mockClear();
    mockRouter.canGoBack.mockReturnValue(true);
  });

  it("loads offline categories and does not show placeholder SMS text", async () => {
    const tree = await renderTree();

    const snapshot = JSON.stringify(tree.toJSON());
    expect(snapshot).toContain(generalCategory);
    expect(snapshot).not.toContain("16789");
    expect(snapshot).not.toContain("SMS-");
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

    expect(mockGetQaByTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "general_questions", trimester: "T3" }));
    expect(JSON.stringify(tree.toJSON())).toContain(generalAnswer);
  });

  it("loads postpartum care questions with the postpartum trimester", async () => {
    const tree = await renderTree();
    const categoryNode = tree.root.findByProps({ accessibilityLabel: postpartumCategory });

    await act(async () => {
      await categoryNode.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockGetQaByTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "postpartum_care", trimester: "POSTPARTUM" }));
    expect(snapshot).toContain(postpartumQuestion);
    expect(snapshot).not.toContain(copy.qa.noQuestions);
  });

  it("loads breastfeeding questions with the postpartum trimester", async () => {
    const tree = await renderTree();
    const categoryNode = tree.root.findByProps({ accessibilityLabel: breastfeedingCategory });

    await act(async () => {
      await categoryNode.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockGetQaByTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "breastfeeding", trimester: "POSTPARTUM" }));
    expect(snapshot).toContain(breastfeedingQuestion);
    expect(snapshot).not.toContain(copy.qa.noQuestions);
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

  it("renders safety-rule emergency answers for romanized Bangla questions", async () => {
    mockAskOnline.mockResolvedValue({
      answer: safetyRuleAnswer,
      is_emergency: true,
      source: "safety-rules",
      emergency_text: "এখনই হাসপাতালে যান।",
      risk_level: "urgent_today",
      matched_risk: "postpartum_bleeding",
      red_flags: ["১ ঘন্টায় ১টি বা তার বেশি প্যাড পুরো ভিজে যাওয়া"],
      recommended_action: "আজই স্বাস্থ্যকর্মীকে জানান; কোনো বিপদচিহ্ন থাকলে এখনই হাসপাতালে যান।"
    });

    const tree = await renderTree();
    const input = tree.root.findByProps({ accessibilityLabel: copy.qa.askPlaceholder });
    const send = tree.root.findByProps({ accessibilityLabel: copy.qa.sendQuestion });

    await act(async () => {
      input.props.onChangeText(romanizedDangerQuestion);
    });

    await act(async () => {
      await send.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockAskOnline).toHaveBeenCalledWith(romanizedDangerQuestion);
    expect(snapshot).toContain("১ ঘন্টায়");
    expect(snapshot).toContain("এখনই হাসপাতালে");
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
    expect(mockSearchQa).toHaveBeenCalledWith(offlineSearchQuestion, "T3", expect.any(String));
  });

  it("uses the postpartum trimester for free-text search after selecting postpartum care", async () => {
    const tree = await renderTree();
    const categoryNode = tree.root.findByProps({ accessibilityLabel: postpartumCategory });
    const input = tree.root.findByProps({ accessibilityLabel: copy.qa.askPlaceholder });
    const send = tree.root.findByProps({ accessibilityLabel: copy.qa.sendQuestion });

    await act(async () => {
      await categoryNode.props.onPress();
    });
    await act(async () => {
      input.props.onChangeText(offlineSearchQuestion);
    });
    await act(async () => {
      await send.props.onPress();
    });

    expect(mockSearchQa).toHaveBeenCalledWith(offlineSearchQuestion, "POSTPARTUM", expect.any(String));
  });

  it("records voice with tap start and tap stop before sending audio to AI", async () => {
    const tree = await renderTree();
    const startButton = tree.root.findByProps({ accessibilityLabel: "ভয়েস প্রশ্ন শুরু করুন" });

    await act(async () => {
      await startButton.props.onPress();
    });

    const stopButton = tree.root.findByProps({ accessibilityLabel: "ভয়েস প্রশ্ন পাঠান" });

    await act(async () => {
      await stopButton.props.onPress();
      await Promise.resolve();
    });

    expect(mockAskVoiceClinicalOnline).toHaveBeenCalledWith("file://test-audio.m4a");
    expect(JSON.stringify(tree.toJSON())).toContain("I have a headache");
  });

  it("shows emergency questions and filters out non-emergency items", async () => {
    const tree = await renderTree();
    const emergencyButton = tree.root.findByProps({ accessibilityLabel: copy.common.emergency });

    await act(async () => {
      await emergencyButton.props.onPress();
    });

    const snapshot = JSON.stringify(tree.toJSON());
    expect(mockGetQaByTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "danger_signs" }));
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
