import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

type SyncEvent = {
  idempotency_key: string;
  event_type: "patient_upsert" | "visit_create";
  device_id: string;
  payload: Record<string, unknown>;
};

type JsonResponseBody =
  | { results: Array<{ idempotency_key: string; status: string; error?: string }>; synced_at: string }
  | { error: { code: string; message: string; details?: unknown } };

const TOKEN_PATTERN = /^[A-Za-z0-9._:-]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: JsonResponseBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new ConfigError();
  }
  return value;
}

function validateEvents(value: unknown): SyncEvent[] {
  if (!value || typeof value !== "object" || !("events" in value)) {
    throw new ClientInputError("Request body must be an object with an events array.");
  }

  const events = (value as { events: unknown }).events;
  if (!Array.isArray(events)) {
    throw new ClientInputError("events must be an array.");
  }
  if (events.length === 0) {
    throw new ClientInputError("events must include at least one item.");
  }
  if (events.length > 100) {
    throw new ClientInputError("events cannot exceed 100 items per batch.");
  }

  return events.map((event, index) => {
    if (!event || typeof event !== "object") {
      throw new ClientInputError(`events[${index}] must be an object.`);
    }
    const item = event as Partial<SyncEvent>;
    if (
      !item.idempotency_key ||
      typeof item.idempotency_key !== "string" ||
      item.idempotency_key.length > 200 ||
      !TOKEN_PATTERN.test(item.idempotency_key)
    ) {
      throw new ClientInputError(`events[${index}].idempotency_key is invalid.`);
    }
    if (item.event_type !== "patient_upsert" && item.event_type !== "visit_create") {
      throw new ClientInputError(`events[${index}].event_type is unsupported.`);
    }
    if (
      !item.device_id ||
      typeof item.device_id !== "string" ||
      item.device_id.length > 120 ||
      !TOKEN_PATTERN.test(item.device_id)
    ) {
      throw new ClientInputError(`events[${index}].device_id is invalid.`);
    }
    if (!item.payload || typeof item.payload !== "object" || Array.isArray(item.payload)) {
      throw new ClientInputError(`events[${index}].payload must be an object.`);
    }
    const payload = item.payload as Record<string, unknown>;
    if (typeof payload.chw_id !== "string" || !UUID_PATTERN.test(payload.chw_id)) {
      throw new ClientInputError(`events[${index}].payload.chw_id is invalid.`);
    }
    return {
      idempotency_key: item.idempotency_key,
      event_type: item.event_type,
      device_id: item.device_id,
      payload: {
        ...payload,
        chw_id: payload.chw_id.toLowerCase(),
      },
    } as SyncEvent;
  });
}

class ClientInputError extends Error {}

class ConfigError extends Error {}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." } },
      405,
    );
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Bearer token is required." } },
        401,
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Invalid or expired token." } },
        401,
      );
    }

    const { data: chw, error: chwError } = await serviceClient
      .from("chws")
      .select("id, is_active")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (chwError || !chw || !chw.is_active) {
      return jsonResponse(
        { error: { code: "FORBIDDEN", message: "Authenticated user is not an active CHW." } },
        403,
      );
    }

    const body = await request.json();
    const events = validateEvents(body);

    const crossChwEvent = events.find((event) => event.payload.chw_id !== chw.id);
    if (crossChwEvent) {
      return jsonResponse(
        {
          error: {
            code: "FORBIDDEN",
            message: "Event payload CHW does not match the authenticated CHW.",
            details: { idempotency_key: crossChwEvent.idempotency_key },
          },
        },
        403,
      );
    }

    const { data, error } = await serviceClient.rpc("process_outbox_batch", {
      events,
    });

    if (error) {
      return jsonResponse(
        { error: { code: "SYNC_RPC_ERROR", message: "Unable to process sync batch." } },
        500,
      );
    }

    return jsonResponse({
      results: data ?? [],
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof ConfigError) {
      return jsonResponse(
        {
          error: {
            code: "INTERNAL_CONFIG_ERROR",
            message: "Sync service is not configured.",
          },
        },
        500,
      );
    }

    const message = error instanceof ClientInputError ? error.message : "Invalid sync request.";
    return jsonResponse(
      { error: { code: "BAD_REQUEST", message } },
      400,
    );
  }
});
