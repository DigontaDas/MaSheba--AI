import { supabase } from "@/auth/supabaseAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ChatSenderType = "chw" | "mother";
export type ChatCategory = "জরুরি" | "স্বাভাবিক" | "পুষ্টি" | "সতর্কতা";

export interface ChatMessage {
  id: string;
  chw_id: string;
  mother_id: string;
  sender_type: ChatSenderType;
  sender_id: string;
  message: string;
  message_type: "text" | "notification" | "alert";
  category: ChatCategory | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatMother {
  id: string;
  name: string;
  phone: string | null;
  patient_id: string | null;
  gestational_age_weeks: number | null;
  patient?: {
    id: string;
    name: string;
    gestational_age_weeks: number;
    last_risk_level: "LOW" | "MODERATE" | "HIGH";
  } | null;
}

// ----------------------------------------------------
// Demo Mock Chat Support
// ----------------------------------------------------
const DEMO_CHAT_CACHE_KEY = "maasheba.demo_chat_messages";
let demoMessages: ChatMessage[] = [];
let demoListeners: ((msg: ChatMessage) => void)[] = [];

async function loadDemoMessages() {
  if (demoMessages.length > 0) return demoMessages;
  try {
    const cached = await AsyncStorage.getItem(DEMO_CHAT_CACHE_KEY);
    if (cached) {
      demoMessages = JSON.parse(cached);
    } else {
      demoMessages = [
        {
          id: "seed-msg-1",
          chw_id: "00000000-0000-0000-0000-0000000000a1",
          mother_id: "60000000-0000-0000-0000-000000000002",
          sender_type: "chw",
          sender_id: "00000000-0000-0000-0000-0000000000a1",
          message: "আসসালামু আলাইকুম রহিমা বেগম। আপনার আজকের স্বাস্থ্য কেমন আছে? কোনো সমস্যা হচ্ছে কি?",
          message_type: "text",
          category: "স্বাভাবিক",
          is_read: true,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "seed-msg-2",
          chw_id: "00000000-0000-0000-0000-0000000000a1",
          mother_id: "60000000-0000-0000-0000-000000000002",
          sender_type: "mother",
          sender_id: "60000000-0000-0000-0000-000000000002",
          message: "ওয়া আলাইকুম আসসালাম আপা। আমার পা একটু ফুলেছে আর মাথা ব্যথা করছে মাঝে মাঝে।",
          message_type: "text",
          category: null,
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      await AsyncStorage.setItem(DEMO_CHAT_CACHE_KEY, JSON.stringify(demoMessages));
    }
  } catch {
    // Fallback
  }
  return demoMessages;
}

export async function listAssignedMothers(chwId: string): Promise<ChatMother[]> {
  if (chwId === "00000000-0000-0000-0000-0000000000a1") {
    return [
      {
        id: "60000000-0000-0000-0000-000000000002",
        name: "রহিমা বেগম (Rahima)",
        phone: "+8801700000002",
        patient_id: "11111111-1111-1111-1111-111111111102",
        gestational_age_weeks: 32,
        patient: {
          id: "11111111-1111-1111-1111-111111111102",
          name: "রহিমা বেগম",
          gestational_age_weeks: 32,
          last_risk_level: "MODERATE"
        }
      }
    ];
  }

  // Query mothers that have a patient row assigned to this CHW.
  // The foreign key is mothers.patient_id → patients.id.
  // Using !inner ensures only mothers with a matching patient row are returned.
  const { data, error } = await supabase
    .from("mothers")
    .select("id,name,phone,patient_id,gestational_age_weeks,is_active,patient:patients!patient_id(id,name,gestational_age_weeks,last_risk_level,chw_id)")
    .eq("is_active", true)
    .eq("patients.chw_id", chwId);

  if (error) {
    // Supabase PostgREST may not support filtering via joined table alias this way on all versions.
    // Fallback: fetch all patients for this CHW, then fetch matching mothers.
    const { data: patientData, error: patientErr } = await supabase
      .from("patients")
      .select("id,chw_id,name,gestational_age_weeks,last_risk_level")
      .eq("chw_id", chwId);

    if (patientErr) throw patientErr;

    if (!patientData || patientData.length === 0) return [];

    const patientIds = patientData.map((p: any) => p.id);
    const { data: motherData, error: motherErr } = await supabase
      .from("mothers")
      .select("id,name,phone,patient_id,gestational_age_weeks")
      .eq("is_active", true)
      .in("patient_id", patientIds);

    if (motherErr) throw motherErr;

    return ((motherData ?? []) as any[]).map((mother: any) => {
      const patientRow = patientData.find((p: any) => p.id === mother.patient_id);
      return {
        id: mother.id,
        name: mother.name,
        phone: mother.phone,
        patient_id: mother.patient_id,
        gestational_age_weeks: mother.gestational_age_weeks ?? patientRow?.gestational_age_weeks ?? null,
        patient: patientRow
          ? {
              id: patientRow.id,
              name: patientRow.name,
              gestational_age_weeks: patientRow.gestational_age_weeks,
              last_risk_level: patientRow.last_risk_level as "LOW" | "MODERATE" | "HIGH"
            }
          : null
      };
    });
  }

  return ((data ?? []) as unknown as ChatMother[])
    .filter((m) => (m.patient as any)?.chw_id === chwId)
    .map((mother) => ({
      ...mother,
      gestational_age_weeks: mother.gestational_age_weeks ?? mother.patient?.gestational_age_weeks ?? null
    }));
}


export async function getMessages(chwId: string, motherId: string): Promise<ChatMessage[]> {
  const isDemo = chwId === "00000000-0000-0000-0000-0000000000a1" && motherId === "60000000-0000-0000-0000-000000000002";
  if (isDemo) {
    return loadDemoMessages();
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chw_id", chwId)
    .eq("mother_id", motherId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(params: {
  chwId: string;
  motherId: string;
  senderType: ChatSenderType;
  senderId: string;
  message: string;
  category?: ChatCategory | null;
}): Promise<ChatMessage> {
  const isDemo = params.chwId === "00000000-0000-0000-0000-0000000000a1" && params.motherId === "60000000-0000-0000-0000-000000000002";
  if (isDemo) {
    const category = params.category ?? null;
    const newMessage: ChatMessage = {
      id: `demo-msg-${Date.now()}`,
      chw_id: params.chwId,
      mother_id: params.motherId,
      sender_type: params.senderType,
      sender_id: params.senderId,
      message: params.message,
      message_type: category === "জরুরি" ? "alert" : category ? "notification" : "text",
      category,
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    await loadDemoMessages();
    demoMessages.push(newMessage);
    await AsyncStorage.setItem(DEMO_CHAT_CACHE_KEY, JSON.stringify(demoMessages)).catch(() => undefined);
    
    setTimeout(() => {
      demoListeners.forEach((listener) => {
        try {
          listener(newMessage);
        } catch (err) {
          console.error("Error in demo message listener:", err);
        }
      });
    }, 50);

    return newMessage;
  }

  const category = params.category ?? null;
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chw_id: params.chwId,
      mother_id: params.motherId,
      sender_type: params.senderType,
      sender_id: params.senderId,
      message: params.message,
      message_type: category === "জরুরি" ? "alert" : category ? "notification" : "text",
      category,
      is_read: false
    })
    .select()
    .single();

  if (error) throw error;
  return data as ChatMessage;
}

export async function markMessagesRead(chwId: string, motherId: string, readerType: ChatSenderType): Promise<void> {
  const isDemo = chwId === "00000000-0000-0000-0000-0000000000a1" && motherId === "60000000-0000-0000-0000-000000000002";
  if (isDemo) {
    const oppositeType: ChatSenderType = readerType === "chw" ? "mother" : "chw";
    await loadDemoMessages();
    let changed = false;
    demoMessages = demoMessages.map((msg) => {
      if (msg.sender_type === oppositeType && !msg.is_read) {
        changed = true;
        return { ...msg, is_read: true };
      }
      return msg;
    });
    if (changed) {
      await AsyncStorage.setItem(DEMO_CHAT_CACHE_KEY, JSON.stringify(demoMessages)).catch(() => undefined);
    }
    return;
  }

  const oppositeType: ChatSenderType = readerType === "chw" ? "mother" : "chw";
  const { error } = await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("chw_id", chwId)
    .eq("mother_id", motherId)
    .eq("sender_type", oppositeType)
    .eq("is_read", false);

  if (error) throw error;
}

export async function getUnreadCount(chwId: string, readerType: ChatSenderType, motherId?: string): Promise<number> {
  const isDemo = chwId === "00000000-0000-0000-0000-0000000000a1" && (!motherId || motherId === "60000000-0000-0000-0000-000000000002");
  if (isDemo) {
    await loadDemoMessages();
    return demoMessages.filter((msg) => msg.sender_type === (readerType === "chw" ? "mother" : "chw") && !msg.is_read).length;
  }

  let query = supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("chw_id", chwId)
    .eq("sender_type", readerType === "chw" ? "mother" : "chw")
    .eq("is_read", false);

  if (motherId) query = query.eq("mother_id", motherId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function getRecentUnreadMessages(chwId: string, limit = 3): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chw_id", chwId)
    .eq("sender_type", "mother")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export function subscribeToMessages(chwId: string, motherId: string, onMessage: (message: ChatMessage) => void) {
  const isDemo = chwId === "00000000-0000-0000-0000-0000000000a1" && motherId === "60000000-0000-0000-0000-000000000002";
  if (isDemo) {
    demoListeners.push(onMessage);
    return {
      unsubscribe: () => {
        demoListeners = demoListeners.filter((l) => l !== onMessage);
      }
    };
  }

  return supabase
    .channel(`chat:${chwId}:${motherId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `chw_id=eq.${chwId}`
      },
      (payload) => {
        const message = payload.new as ChatMessage;
        if (message.mother_id === motherId) onMessage(message);
      }
    )
    .subscribe();
}
