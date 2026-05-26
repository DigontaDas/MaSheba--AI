"""
Recreate all 6 mother accounts using the Supabase Admin API.
This properly handles auth.users + auth.identities + password hashing.
The SQL-inserted accounts had broken password hashes from crypt() that
GoTrue can't verify, causing "Database error querying schema".
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from typing import Any

ROOT = Path(__file__).resolve().parents[2]

def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def api(method: str, url: str, headers: dict, payload: Any = None) -> Any:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, method=method, headers=headers)
    try:
        with urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else None
    except HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} => {e.code}: {body}") from e

def main() -> None:
    load_env(ROOT / ".env")
    load_env(ROOT / "mobile" / ".env")

    base = os.environ["SUPABASE_URL"].rstrip("/")
    svc  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    auth_headers = {
        "apikey": svc,
        "Authorization": f"Bearer {svc}",
        "Content-Type": "application/json",
    }
    rest_headers = {**auth_headers, "Prefer": "return=representation"}

    MOTHER_SEED = [
        {"email": "mother-amina@maasheba.local",    "name": "Amina Khatun",    "patient_id": "11111111-1111-1111-1111-111111111101", "phone": "+8801700000001", "gestational_age_weeks": 28},
        {"email": "mother-rahima@maasheba.local",   "name": "Rahima Begum",    "patient_id": "11111111-1111-1111-1111-111111111102", "phone": "+8801700000002", "gestational_age_weeks": 32},
        {"email": "mother-sharmin@maasheba.local",  "name": "Sharmin Akter",   "patient_id": "11111111-1111-1111-1111-111111111103", "phone": "+8801700000003", "gestational_age_weeks": 20},
        {"email": "mother-nasima@maasheba.local",   "name": "Nasima Begum",    "patient_id": "11111111-1111-1111-1111-111111111104", "phone": "+8801700000004", "gestational_age_weeks": 34},
        {"email": "mother-fatema@maasheba.local",   "name": "Fatema Akter",    "patient_id": "11111111-1111-1111-1111-111111111105", "phone": "+8801700000005", "gestational_age_weeks": 26},
        {"email": "mother-jannatul@maasheba.local", "name": "Jannatul Ferdous","patient_id": "11111111-1111-1111-1111-111111111106", "phone": "+8801700000006", "gestational_age_weeks": 18},
    ]
    PASSWORD = "Mother_B_demo_password"

    # Fetch existing auth users (to know if we should create or update)
    print("Fetching existing auth users...")
    resp = api("GET", f"{base}/auth/v1/admin/users?per_page=200", auth_headers)
    existing = {u["email"]: u for u in resp.get("users", [])}

    for m in MOTHER_SEED:
        email = m["email"]
        name  = m["name"]
        payload = {
            "email": email,
            "password": PASSWORD,
            "email_confirm": True,
            "user_metadata": {"name": name, "role": "mother"},
        }

        if email in existing:
            uid = existing[email]["id"]
            api("PUT", f"{base}/auth/v1/admin/users/{uid}", auth_headers, payload)
            print(f"  UPDATED auth user: {email} ({uid})")
        else:
            created = api("POST", f"{base}/auth/v1/admin/users", auth_headers, payload)
            uid = created["id"]
            print(f"  CREATED auth user: {email} ({uid})")

        # Upsert public.mothers row
        mothers = api("GET", f"{base}/rest/v1/mothers?auth_user_id=eq.{uid}&select=id", rest_headers)
        mother_payload = {
            "auth_user_id": uid,
            "name": name,
            "patient_id": m["patient_id"],
            "phone": m["phone"],
            "gestational_age_weeks": m["gestational_age_weeks"],
            "is_active": True,
        }
        if mothers:
            mid = mothers[0]["id"]
            api("PATCH", f"{base}/rest/v1/mothers?id=eq.{mid}", rest_headers, mother_payload)
            print(f"    mother profile UPDATED  (id={mid})")
        else:
            api("POST", f"{base}/rest/v1/mothers", rest_headers, mother_payload)
            print(f"    mother profile CREATED")

    print("\nDone! All 6 mother accounts are ready to log in with password: Mother_B_demo_password")

if __name__ == "__main__":
    main()
