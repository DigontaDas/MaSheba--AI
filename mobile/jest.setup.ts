const originalConsoleError = console.error;

jest.mock("@react-native-async-storage/async-storage", () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
      removeItem: jest.fn((key: string) => { delete store[key]; return Promise.resolve(); }),
      clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); return Promise.resolve(); }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
      multiGet: jest.fn((keys: string[]) => Promise.resolve(keys.map(k => [k, store[k] ?? null]))),
      multiSet: jest.fn((pairs: [string, string][]) => { pairs.forEach(([k, v]) => { store[k] = v; }); return Promise.resolve(); }),
      multiRemove: jest.fn((keys: string[]) => { keys.forEach(k => delete store[k]); return Promise.resolve(); }),
    }
  };
});

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
          getStatusAsync: jest.fn().mockResolvedValue({ durationMillis: 1200 }),
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
