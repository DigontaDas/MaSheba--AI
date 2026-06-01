const originalConsoleError = console.error;

jest.mock("react-native/Libraries/Lists/FlatList", () => {
  const React = require("react");
  const { View } = require("react-native");

  function MockFlatList({ data, renderItem, keyExtractor, contentContainerStyle }: Record<string, any>) {
    return React.createElement(
      View,
      { style: contentContainerStyle },
      (data ?? []).map((item: unknown, index: number) =>
        React.createElement(
          React.Fragment,
          { key: keyExtractor ? keyExtractor(item, index) : String(index) },
          renderItem({ item, index })
        )
      )
    );
  }

  return { __esModule: true, default: MockFlatList };
});

jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
  if (String(args[0]).includes("not wrapped in act")) return;
  originalConsoleError(...args);
});

jest.mock("expo-av", () => ({
  Audio: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Recording: {
      createAsync: jest.fn().mockResolvedValue({
        recording: {
          stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
          getURI: jest.fn().mockReturnValue("file://test-audio.m4a")
        }
      })
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {}
    }
  }
}));

jest.mock("expo-speech", () => ({
  speak: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined)
}));
