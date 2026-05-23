import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";
import LoginScreen from "../app/(auth)/login";

const mockReplace = jest.fn();
const mockLoginAndBootstrap = jest.fn();
const mockLoginMother = jest.fn();
const mockSaveUserRole = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: mockReplace
  }
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

jest.mock("@/auth/supabaseAuth", () => ({
  loginAndBootstrap: (...args: unknown[]) => mockLoginAndBootstrap(...args)
}));

jest.mock("@/auth/roleSession", () => ({
  loginMother: (...args: unknown[]) => mockLoginMother(...args),
  saveUserRole: (...args: unknown[]) => mockSaveUserRole(...args)
}));

jest.mock("@/components/OfflineBanner", () => ({
  OfflineBanner: () => null
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLoginAndBootstrap.mockResolvedValue({ chwId: "chw-1" });
  mockLoginMother.mockResolvedValue({
    id: "mother-1",
    name: "রহিমা",
    patientId: null,
    phone: null,
    gestationalAgeWeeks: 28
  });
  mockSaveUserRole.mockResolvedValue(undefined);
});

async function renderTree() {
  let tree: ReactTestRenderer | null = null;
  await act(async () => {
    tree = create(<LoginScreen />);
  });
  return tree as unknown as ReactTestRenderer;
}

describe("LoginScreen routing", () => {
  it("routes CHW logins to the CHW shell", async () => {
    const tree = await renderTree();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "স্বাস্থ্যকর্মী হিসেবে চালিয়ে যান" }).props.onPress();
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "ইমেইল" }).props.onChangeText("chw@example.com");
      tree.root.findByProps({ accessibilityLabel: "পাসওয়ার্ড" }).props.onChangeText("secret123");
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "লগইন করুন" }).props.onPress();
      for (let index = 0; index < 5; index += 1) {
        await Promise.resolve();
      }
    });

    expect(mockLoginAndBootstrap).toHaveBeenCalledWith("chw@example.com", "secret123");
    expect(mockSaveUserRole).toHaveBeenCalledWith("CHW");
  });

  it("routes mother logins to the mother shell", async () => {
    const tree = await renderTree();

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "মা হিসেবে চালিয়ে যান" }).props.onPress();
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "ইমেইল" }).props.onChangeText("mother@example.com");
      tree.root.findByProps({ accessibilityLabel: "পাসওয়ার্ড" }).props.onChangeText("secret123");
    });

    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "লগইন করুন" }).props.onPress();
      for (let index = 0; index < 5; index += 1) {
        await Promise.resolve();
      }
    });

    expect(mockLoginMother).toHaveBeenCalledWith("mother@example.com", "secret123");
  });
});
