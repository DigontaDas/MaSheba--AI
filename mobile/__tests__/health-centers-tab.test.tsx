import React from "react";
import renderer, { act, type ReactTestRenderer } from "react-test-renderer";
import FindHealthCentersScreen from "../app/(mother-tabs)/find-chw";
import { BN_STRINGS, EN_STRINGS } from "@/data/translations";

const mockGetCurrentMotherProfile = jest.fn();
const mockRequestForegroundPermissionsAsync = jest.fn();

jest.mock("@/auth/roleSession", () => ({
  getCurrentMotherProfile: () => mockGetCurrentMotherProfile()
}));

jest.mock("@/auth/supabaseAuth", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: () => mockRequestForegroundPermissionsAsync(),
  getCurrentPositionAsync: jest.fn()
}));

jest.mock("expo-network", () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
}));

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn() },
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => callback(), [callback]);
    }
  };
});

jest.mock("@/components/ui/Icon", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Icon: ({ name }: { name: string }) => React.createElement(Text, { accessibilityLabel: `icon-${name}` }, name)
  };
});

describe("mother health centers tab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentMotherProfile.mockResolvedValue({
      id: "60000000-0000-0000-0000-000000000002",
      name: "রহিমা বেগম",
      patientId: "11111111-1111-1111-1111-111111111102"
    });
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
  });

  async function renderScreen() {
    let tree: ReactTestRenderer | null = null;
    await act(async () => {
      tree = renderer.create(<FindHealthCentersScreen />);
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    return tree as unknown as ReactTestRenderer;
  }

  it("labels the mother tab as health centers", () => {
    expect(BN_STRINGS["nav.find-chw"]).toBe("স্বাস্থ্যকেন্দ্র");
    expect(EN_STRINGS["nav.find-chw"]).toBe("Health Centers");
  });

  it("renders the demo Health Center tabs with assigned CHW and nearby hospitals", async () => {
    const tree = await renderScreen();
    const json = JSON.stringify(tree.toJSON());

    expect(json).toContain("স্বাস্থ্য কেন্দ্র");
    expect(json).toContain("আমার স্বাস্থ্যকর্মী");
    expect(json).toContain("রিভিউ");
    expect(json).toContain("হাসপাতাল");
    expect(json).toContain("Mst. Jahanara Begum");

    const hospitalsTab = (tree.root as any).findAll(
      (node: any) => node.props.accessibilityLabel === "Health Center tab hospitals"
    )[0];
    act(() => {
      hospitalsTab.props.onPress();
    });

    expect(JSON.stringify(tree.toJSON())).toContain("Narsingdi District Hospital");
    expect(mockRequestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it("opens direct CHW messaging mode from the demo Find CHW chat action", async () => {
    const tree = await renderScreen();
    const chatButton = (tree.root as any).findAll(
      (node: any) => node.props.accessibilityLabel === "Chat with assigned CHW"
    )[0];

    expect(chatButton).toBeDefined();
    act(() => {
      chatButton?.props.onPress();
    });

    const mockRouter = jest.requireMock("expo-router").router as { push: jest.Mock };
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/(mother-tabs)/chat",
      params: { mode: "chw" }
    });
  });
});
