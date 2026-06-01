import React from "react";
import { TextInput } from "react-native";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import ClinicalChatScreen from "@/screens/chw/ClinicalChatScreen";
import { copy } from "@/data/stitchCopy.bn";

const mockGetNetworkStateAsync = jest.fn();
const mockGetSession = jest.fn();
const mockListAssignedMothers = jest.fn();
const mockGetMessages = jest.fn();
const mockMarkMessagesRead = jest.fn();
const mockSendMessage = jest.fn();
const mockSubscribeToMessages = jest.fn();
const mockSearchQa = jest.fn();
const mockAskVoiceClinicalOnline = jest.fn<Promise<{
  transcription: string;
  symptoms: string[];
  answer: string;
  is_emergency: boolean;
  source: string;
}>, [string]>(async () => ({
  transcription: "BP 150 over 95",
  symptoms: ["headache"],
  answer: "Emergency referral is needed.",
  is_emergency: true,
  source: "gemini-voice"
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: () => mockGetNetworkStateAsync()
}));

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: {
      push: jest.fn()
    },
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback();
      }, [callback]);
    }
  };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement(View, props),
    Circle: (props: Record<string, unknown>) => React.createElement(View, props),
    Pattern: (props: Record<string, unknown>) => React.createElement(View, props),
    Rect: (props: Record<string, unknown>) => React.createElement(View, props)
  };
});

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

jest.mock("@/components/emergency/EmergencyBanner", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    EmergencyBanner: ({ title, message }: { title: string; message: string }) =>
      React.createElement(Text, null, `${title}: ${message}`)
  };
});

jest.mock("@/auth/secureSession", () => ({
  getSession: () => mockGetSession()
}));

jest.mock("@/api/chatService", () => ({
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  listAssignedMothers: (...args: unknown[]) => mockListAssignedMothers(...args),
  markMessagesRead: (...args: unknown[]) => mockMarkMessagesRead(...args),
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  subscribeToMessages: (...args: unknown[]) => mockSubscribeToMessages(...args)
}));

jest.mock("@/features/qa/offlineQaStore", () => ({
  searchQa: (...args: unknown[]) => mockSearchQa(...args)
}));

jest.mock("@/api/voiceChat", () => ({
  VOICE_RECORDING_OPTIONS: {},
  askVoiceClinicalOnline: (...args: [string]) => mockAskVoiceClinicalOnline(...args)
}));

jest.mock("@/notifications/notificationService", () => ({
  notificationTitleForMessage: () => "বার্তা",
  scheduleLocalNotification: jest.fn()
}));

jest.mock("@/notifications/notify", () => ({
  notifyNow: jest.fn()
}));

const patient = {
  id: "patient-1",
  name: "Nasima Begum",
  gestational_age_weeks: 34
};

async function renderTree() {
  let tree: ReactTestRenderer | null = null;
  await act(async () => {
    tree = create(<ClinicalChatScreen />);
    await Promise.resolve();
    await Promise.resolve();
  });
  return tree as unknown as ReactTestRenderer;
}

function pressByText(root: ReactTestInstance, text: string) {
  const match = root.findByProps({ accessibilityLabel: text });
  act(() => {
    match.props.onPress();
  });
}

function aiInput(tree: ReactTestRenderer) {
  return tree.root.findAllByType(TextInput).find((input) => input.props.placeholder === copy.clinicalChat.clinicalInputPlaceholder);
}

describe("ClinicalChatScreen CHW AI mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNetworkStateAsync.mockResolvedValue({ isConnected: true, isInternetReachable: true });
    mockGetSession.mockResolvedValue({ chwId: "chw-1" });
    mockListAssignedMothers.mockResolvedValue([patient]);
    mockGetMessages.mockResolvedValue([]);
    mockMarkMessagesRead.mockResolvedValue(undefined);
    mockSendMessage.mockResolvedValue({
      id: "message-1",
      message: "জরুরি",
      sender_type: "chw",
      category: "জরুরি",
      created_at: "2026-05-27T00:00:00.000Z"
    });
    mockSubscribeToMessages.mockReturnValue({ unsubscribe: jest.fn() });
    mockSearchQa.mockResolvedValue([]);
    mockAskVoiceClinicalOnline.mockClear();
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        answer: "জরুরি রেফার করুন।",
        is_emergency: true,
        source: "groq",
        emergency_text: "এখনই হাসপাতালে যান।"
      })
    })) as any;
  });

  it("sends the CHW clinical system prompt in the online request body", async () => {
    const tree = await renderTree();
    pressByText(tree.root, "CHW AI");

    const input = aiInput(tree);
    expect(input).toBeTruthy();
    await act(async () => {
      input?.props.onChangeText("রোগীর BP 150/95, সপ্তাহ 34");
      await Promise.resolve();
    });
    await act(async () => {
      input?.props.onSubmitEditing();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://maasheba-backend.onrender.com/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String)
      })
    );
    const body = JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.question).toBe("রোগীর BP 150/95, সপ্তাহ 34");
    expect(body.system_prompt).toContain("You are MaaSheba Clinical AI");
    expect(body.system_prompt).toContain("You are NOT talking to a patient.");
  });

  it("keeps CHW AI online-only while offline", async () => {
    mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false, isInternetReachable: false });
    const tree = await renderTree();
    pressByText(tree.root, "CHW AI");

    expect(JSON.stringify(tree.toJSON())).toContain(copy.clinicalChat.clinicalAiOfflineRequired);
    expect(aiInput(tree)?.props.editable).toBe(false);

    pressByText(tree.root, "পুষ্টি");
    pressByText(tree.root, copy.clinicalChat.clinicalBP);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockSearchQa).not.toHaveBeenCalled();
  });

  it("prefills CHW clinical chip templates without changing mother mode chip behavior", async () => {
    const tree = await renderTree();

    pressByText(tree.root, "জরুরি");
    const motherInput = tree.root.findAllByType(TextInput).find((input) => input.props.placeholder === "মাকে বার্তা লিখুন...");
    expect(motherInput?.props.value).toBe("জরুরি");

    pressByText(tree.root, "CHW AI");
    pressByText(tree.root, "স্বাভাবিক");

    expect(aiInput(tree)?.props.value).toBe(copy.clinicalChat.clinicalChipTemplates.normal);
  });

  it("records CHW AI voice with tap start and tap stop before sending audio", async () => {
    const tree = await renderTree();
    pressByText(tree.root, "CHW AI");

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
    expect(JSON.stringify(tree.toJSON())).toContain("BP 150 over 95");
    expect(JSON.stringify(tree.toJSON())).toContain("Emergency referral is needed.");
  });
});
