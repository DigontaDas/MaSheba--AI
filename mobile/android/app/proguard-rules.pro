# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---- Output optimisation ----
# Move all obfuscated classes into the root package → smaller DEX
-repackageclasses ''
# Preserve source file names and line numbers for readable crash stack traces
-keepattributes SourceFile,LineNumberTable
# Suppress note spam that can mask real errors
-dontnote **

# ---- React Native / Expo core ----
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class expo.modules.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class kotlin.Metadata { *; }

# ---- ONNX Runtime (public API only — internal debug methods stripped by R8) ----
-keep class ai.onnxruntime.** { public *; }
-keep class com.microsoft.onnxruntime.** { public *; }
-keep class com.reactnativeonnxruntime.** { *; }

# ---- Suppress known missing optional references ----
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager
-dontwarn expo.modules.kotlin.**
