import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";

// Universally compatible voice recording settings for both iOS & Android.
// Enforces AAC audio compression inside an MPEG-4 container (.m4a), which
// is native and optimal for Gemini Multimodal Audio API ingestion (audio/mp4).
export const VOICE_RECORDING_OPTIONS = {
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat?.MPEG_4 ?? 2,
    audioEncoder: Audio.AndroidAudioEncoder?.AAC ?? 3,
    sampleRate: 16000, // 16kHz is ideal and highly efficient for speech recognition
    numberOfChannels: 1, // Mono channel reduces payload file size
    bitRate: 64000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat?.MPEG4AAC ?? "m4af",
    audioQuality: Audio.IOSAudioQuality?.HIGH ?? 127,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
} as any;

export interface VoiceChatResponse {
  transcription: string;
  symptoms: string[];
  answer: string;
  is_emergency: boolean;
  source: string;
  risk_level?: "emergency_now" | "urgent_today" | "self_care_with_warning" | "out_of_scope" | null;
  matched_risk?: string | null;
  red_flags?: string[];
  recommended_action?: string | null;
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://maasheba-backend.onrender.com";

/**
 * Uploads a locally recorded audio file to the backend's multimodal voice chat endpoint.
 * Bypasses direct text input, utilizing Gemini 1.5 Flash's native speech recognition.
 * 
 * @param audioUri The local file URI of the recorded audio (e.g. from expo-av)
 */
export async function askVoiceClinicalOnline(audioUri: string): Promise<VoiceChatResponse> {
  try {
    const uploadResult = await FileSystem.uploadAsync(
      `${API_BASE.replace(/\/+$/, "")}/chat/voice`,
      audioUri,
      {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: "audio/mp4",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (uploadResult.status !== 200) {
      throw new Error(`Voice upload failed with status ${uploadResult.status}`);
    }

    const payload = JSON.parse(uploadResult.body) as VoiceChatResponse;
    return payload;
  } catch (error) {
    console.error("Audio upload failed:", error);
    throw error;
  }
}
