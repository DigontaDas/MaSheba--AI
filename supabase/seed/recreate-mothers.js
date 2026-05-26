/**
 * recreate-mothers.js
 * Deletes and re-creates all 6 mother accounts using the Supabase Service Role
 * Admin REST API directly (bypassing GoTrue signup to avoid rate limits),
 * then upserts their public.mothers rows.
 *
 * Run: node supabase/seed/recreate-mothers.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

// ---------- load .env files ----------
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
    if (!(key.trim() in process.env)) process.env[key.trim()] = val;
  }
}

const ROOT = path.resolve(__dirname, "../..");
loadEnv(path.join(ROOT, ".env"));
loadEnv(path.join(ROOT, "mobile", ".env"));

const SUPABASE_URL = process.env.SUPABASE_URL.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = "Mother_B_demo_password";

const MOTHERS = [
  { email: "mother-amina@maasheba.local",    name: "Amina Khatun",    patient_id: "11111111-1111-1111-1111-111111111101", phone: "+8801700000001", weeks: 28 },
  { email: "mother-rahima@maasheba.local",   name: "Rahima Begum",    patient_id: "11111111-1111-1111-1111-111111111102", phone: "+8801700000002", weeks: 32 },
  { email: "mother-sharmin@maasheba.local",  name: "Sharmin Akter",   patient_id: "11111111-1111-1111-1111-111111111103", phone: "+8801700000003", weeks: 20 },
  { email: "mother-nasima@maasheba.local",   name: "Nasima Begum",    patient_id: "11111111-1111-1111-1111-111111111104", phone: "+8801700000004", weeks: 34 },
  { email: "mother-fatema@maasheba.local",   name: "Fatema Akter",    patient_id: "11111111-1111-1111-1111-111111111105", phone: "+8801700000005", weeks: 26 },
  { email: "mother-jannatul@maasheba.local", name: "Jannatul Ferdous", patient_id: "11111111-1111-1111-1111-111111111106", phone: "+8801700000006", weeks: 18 },
];

function request(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    const data = body ? JSON.stringify(body) : undefined;
    if (data) options.headers["Content-Length"] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        const parsed = raw ? JSON.parse(raw) : null;
        if (res.statusCode >= 400) {
          reject(new Error(`${method} ${url} => ${res.statusCode}: ${raw}`));
        } else {
          resolve(parsed);
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const AUTH = { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY };
const REST = { ...AUTH, Prefer: "return=representation" };

async function main() {
  console.log("=== Step 1: Delete old mother auth users ===");
  // Get all auth users via a direct DB query approach
  // Since the admin list API returns 500, we'll delete by email using DB
  // We'll use Supabase's management API instead

  // Try individual user operations by querying existing mothers from public table
  const existingMothers = await request(
    "GET",
    `${SUPABASE_URL}/rest/v1/mothers?select=id,auth_user_id,name`,
    REST
  );
  console.log(`Found ${existingMothers.length} existing mother profiles`);

  // Delete old public.mothers rows that match our target emails
  // (We'll recreate them fresh)
  const targetEmails = MOTHERS.map((m) => m.email);

  console.log("\n=== Step 2: Create/update auth users via signUp ===");
  const results = [];

  for (const m of MOTHERS) {
    console.log(`\nProcessing: ${m.name} (${m.email})`);

    // Use signUp endpoint (works without needing to list users)
    // First try with the service role to create directly
    try {
      const created = await request(
        "POST",
        `${SUPABASE_URL}/auth/v1/admin/users`,
        AUTH,
        {
          email: m.email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { name: m.name, role: "mother" },
        }
      );
      console.log(`  ✅ Created auth user: ${created.id}`);
      results.push({ ...m, uid: created.id });
    } catch (createErr) {
      // User already exists — try to update password instead
      console.log(`  ℹ️ Create failed (${createErr.message.substring(0, 80)}...)`);
      console.log(`  → Will try to find & update existing user via REST`);

      // Find existing via public.mothers table
      const existing = existingMothers.find(
        (row) =>
          MOTHERS.some((seed) => seed.email === m.email)
      );
      if (existing?.auth_user_id) {
        try {
          const updated = await request(
            "PUT",
            `${SUPABASE_URL}/auth/v1/admin/users/${existing.auth_user_id}`,
            AUTH,
            {
              email: m.email,
              password: PASSWORD,
              email_confirm: true,
              user_metadata: { name: m.name, role: "mother" },
            }
          );
          console.log(`  ✅ Updated auth user: ${existing.auth_user_id}`);
          results.push({ ...m, uid: existing.auth_user_id });
        } catch (updateErr) {
          console.error(`  ❌ Update also failed: ${updateErr.message}`);
          results.push({ ...m, uid: existing.auth_user_id, skipPublic: true });
        }
      }
    }
  }

  console.log("\n=== Step 3: Upsert public.mothers profiles ===");
  for (const r of results) {
    if (!r.uid) { console.log(`  ⚠️  Skip ${r.name} — no uid`); continue; }

    // Check existing mother profile
    const existing = await request(
      "GET",
      `${SUPABASE_URL}/rest/v1/mothers?auth_user_id=eq.${r.uid}&select=id`,
      REST
    );

    const payload = {
      auth_user_id: r.uid,
      name: r.name,
      patient_id: r.patient_id,
      phone: r.phone,
      gestational_age_weeks: r.weeks,
      is_active: true,
    };

    if (existing.length > 0) {
      await request(
        "PATCH",
        `${SUPABASE_URL}/rest/v1/mothers?id=eq.${existing[0].id}`,
        REST,
        payload
      );
      console.log(`  ✅ Updated public.mothers: ${r.name}`);
    } else {
      await request("POST", `${SUPABASE_URL}/rest/v1/mothers`, REST, payload);
      console.log(`  ✅ Created public.mothers: ${r.name}`);
    }
  }

  console.log("\n✅ Done! Credentials: Mother_B_demo_password");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
