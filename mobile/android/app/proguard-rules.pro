# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class expo.modules.** { *; }
-keep class ai.onnxruntime.** { *; }
-keep class com.microsoft.onnxruntime.** { *; }
-keep class com.reactnativeonnxruntime.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class kotlin.Metadata { *; }

# Add any project specific keep options here:

# Avoid treatment of missing optional references as fatal by R8
-dontwarn expo.modules.core.interfaces.services.KeepAwakeManager
-dontwarn expo.modules.kotlin.**
