const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep the onnx extension for the ML risk model asset
config.resolver.assetExts.push("onnx");

// Drop all console.* calls and dead branches at bundle time (release builds)
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: { toplevel: false },
  compress: {
    drop_console: true,      // removes all console.log/warn/error
    drop_debugger: true,
    pure_funcs: ["console.log", "console.warn", "console.error"],
    dead_code: true,
    passes: 2
  }
};

// Fix: @supabase/supabase-js@2.106.0+ ships dist files that contain
// `/* webpackIgnore: true */` magic comments. Metro's Hermes engine
// treats these as invalid expressions and fails the Android release bundle.
// By removing @supabase from the transformIgnorePatterns exclusion list we
// force Metro to run it through Babel, which strips the comments cleanly.
const defaultIgnorePatterns =
  config.transformer.transformIgnorePatterns || [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ];

// Add @supabase/supabase-js to the set of packages that ARE transformed
config.transformer.transformIgnorePatterns = defaultIgnorePatterns.map((pattern) =>
  pattern.replace(
    "node_modules/(?!(",
    "node_modules/(?!(@supabase/supabase-js|"
  )
);

module.exports = config;
