import { supabase } from "@/auth/supabaseAuth";

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

export async function listAssignedMothers(chwId: string): Promise<ChatMother[]> {
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
