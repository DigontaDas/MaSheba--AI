import * as FileSystem from "expo-file-system/legacy";

export interface VoiceChatResponse {
  transcription: string;
  symptoms: string[];
  answer: string;
  is_emergency: boolean;
  source: string;
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
