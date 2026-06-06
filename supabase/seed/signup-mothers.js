/**
 * signup-mothers.js
 * Creates 6 mother accounts using the public signUp endpoint (POST /auth/v1/signup)
 * with service-role key to bypass email confirmation, then upserts public.mothers.
 *
 * Run: node supabase/seed/signup-mothers.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

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
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PASSWORD = "Mother_B_demo_password";

const MOTHERS = [
  { email: "mother-amina@maasheba.local",    name: "আমিনা খাতুন",     patient_id: "11111111-1111-1111-1111-111111111101", phone: "+8801700000001", weeks: 28 },
  { email: "mother-rahima@maasheba.local",   name: "রহিমা বেগম",     patient_id: "11111111-1111-1111-1111-111111111102", phone: "+8801700000002", weeks: 32 },
  { email: "mother-sharmin@maasheba.local",  name: "শারমিন আক্তার",    patient_id: "11111111-1111-1111-1111-111111111103", phone: "+8801700000003", weeks: 20 },
  { email: "mother-nasima@maasheba.local",   name: "নাসিমা বেগম",     patient_id: "11111111-1111-1111-1111-111111111104", phone: "+8801700000004", weeks: 34 },
  { email: "mother-fatema@maasheba.local",   name: "ফাতেমা আক্তার",     patient_id: "11111111-1111-1111-1111-111111111105", phone: "+8801700000005", weeks: 26 },
  { email: "mother-jannatul@maasheba.local", name: "জান্নাতুল ফেরদৌস",  patient_id: "11111111-1111-1111-1111-111111111106", phone: "+8801700000006", weeks: 18 },
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

const SVC = { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY };
const REST = { ...SVC, Prefer: "return=representation" };
// Use service role as apikey but still use the signup endpoint
const SIGNUP_HEADERS = { apikey: SERVICE_KEY, "Content-Type": "application/json" };

async function main() {
  console.log("Creating 6 mother accounts via signUp endpoint...\n");

  for (const m of MOTHERS) {
    console.log(`Processing: ${m.name} (${m.email})`);

    let uid = null;

    // Step 1: Sign up via the public /auth/v1/signup endpoint
    // Using service role key as apikey disables email confirmation requirement
    try {
      const signupResult = await request(
        "POST",
        `${SUPABASE_URL}/auth/v1/signup`,
        SIGNUP_HEADERS,
        {
          email: m.email,
          password: PASSWORD,
          data: { name: m.name, role: "mother" },
          gotrue_meta_security: {}
        }
      );
      uid = signupResult?.id || signupResult?.user?.id;
      if (uid) {
        console.log(`  ✅ Signed up: ${uid}`);
      } else {
        console.log(`  ⚠️  Signup response had no id:`, JSON.stringify(signupResult).substring(0, 200));
      }
    } catch (signupErr) {
      console.log(`  ⚠️  Signup failed: ${signupErr.message.substring(0, 120)}`);
      console.log(`  → Trying to find existing user via public.mothers...`);

      // Try to find existing user by email in auth.users via DB query approach
      // We'll look for the user in the mothers table by name match
      const existingRows = await request(
        "GET",
        `${SUPABASE_URL}/rest/v1/mothers?name=eq.${encodeURIComponent(m.name)}&select=auth_user_id`,
        REST
      );
      if (existingRows?.length > 0) {
        uid = existingRows[0].auth_user_id;
        console.log(`  ✅ Found existing uid via mothers table: ${uid}`);
      }
    }

    if (!uid) {
      console.error(`  ❌ FAILED to get uid for ${m.name}, skipping`);
      continue;
    }

    // Step 2: Confirm email (force confirm via DB update if needed)
    // The signup with service key should auto-confirm, but let's ensure it
    try {
      await request(
        "GET",
        `${SUPABASE_URL}/rest/v1/rpc/confirm_user_email`,
        SVC,
        null
      );
    } catch (_) {
      // ignore - this is optional
    }

    // Step 3: Upsert public.mothers
    const existingMother = await request(
      "GET",
      `${SUPABASE_URL}/rest/v1/mothers?auth_user_id=eq.${uid}&select=id`,
      REST
    );

    const payload = {
      auth_user_id: uid,
      name: m.name,
      patient_id: m.patient_id,
      phone: m.phone,
      gestational_age_weeks: m.weeks,
      is_active: true,
    };

    if (existingMother?.length > 0) {
      await request("PATCH", `${SUPABASE_URL}/rest/v1/mothers?id=eq.${existingMother[0].id}`, REST, payload);
      console.log(`  ✅ Updated public.mothers (id=${existingMother[0].id})`);
    } else {
      await request("POST", `${SUPABASE_URL}/rest/v1/mothers`, REST, payload);
      console.log(`  ✅ Created public.mothers`);
    }
    console.log();
  }

  // Verify final state
  console.log("=== VERIFICATION ===");
  const mothers = await request("GET", `${SUPABASE_URL}/rest/v1/mothers?select=name,gestational_age_weeks`, REST);
  console.log(`Total mother profiles: ${mothers.length}`);
  mothers.forEach((m) => console.log(`  - ${m.name} (${m.gestational_age_weeks} weeks)`));
  console.log("\nPassword for all: Mother_B_demo_password");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
