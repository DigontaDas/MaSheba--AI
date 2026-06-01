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

module.exports = config;

