from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env"
MOBILE_ENV_PATH = ROOT / "mobile" / ".env"


def load_env(path: Path) -> None:
  if not path.exists():
    return

  for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def request_json(method: str, url: str, headers: dict[str, str], payload: dict[str, Any] | None = None) -> Any:
  data = None if payload is None else json.dumps(payload).encode("utf-8")
  request = Request(url, data=data, method=method, headers=headers)
  try:
    with urlopen(request, timeout=30) as response:
      body = response.read().decode("utf-8")
      if not body:
        return None
      return json.loads(body)
  except HTTPError as error:
    body = error.read().decode("utf-8", errors="replace")
    raise RuntimeError(f"{method} {url} failed: {error.code} {body}") from error


def main() -> None:
  load_env(ENV_PATH)
  load_env(MOBILE_ENV_PATH)
  supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
  service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

  headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
  }
  rest_headers = {**headers, "Prefer": "return=representation"}

  print("--- STEP 1: PRUNING TEST PATIENT DATA ---")
  # 1. Find patients whose name contains 'Test', 'Edge', 'Stress', 'Smoke'
  all_patients = request_json("GET", f"{supabase_url}/rest/v1/patients?select=id,name", headers)
  
  test_patient_ids = []
  for p in all_patients:
    name_lower = p["name"].lower()
    if "test" in name_lower or "edge" in name_lower or "stress" in name_lower or "smoke" in name_lower:
      test_patient_ids.append(p["id"])
      print(f"Found test patient to prune: {p['name']} (ID: {p['id']})")

  if test_patient_ids:
    ids_str = ",".join([f"{pid}" for pid in test_patient_ids])
    print(f"Pruning dependencies for patients: {test_patient_ids}")
    
    # Delete visits
    try:
      deleted_visits = request_json("DELETE", f"{supabase_url}/rest/v1/visits?patient_id=in.({ids_str})", rest_headers)
      print(f"Deleted visits: {deleted_visits}")
    except Exception as e:
      print(f"Error/no visits deleted: {e}")

    # Delete mothers referencing these test patients
    try:
      deleted_mothers = request_json("DELETE", f"{supabase_url}/rest/v1/mothers?patient_id=in.({ids_str})", rest_headers)
      print(f"Deleted mothers: {deleted_mothers}")
    except Exception as e:
      print(f"Error/no mothers deleted: {e}")

    # Delete the patients
    try:
      deleted_patients = request_json("DELETE", f"{supabase_url}/rest/v1/patients?id=in.({ids_str})", rest_headers)
      print(f"Deleted patients: {deleted_patients}")
    except Exception as e:
      print(f"Error/no patients deleted: {e}")
  else:
    print("No test patients found in the database to prune.")

  print("\n--- STEP 2: SEEDING 6 UNIQUE AUTHENTICATED MOTHERS ---")
  
  # Fetch all active users from auth to match by email
  users_response = request_json("GET", f"{supabase_url}/auth/v1/admin/users?per_page=1000", headers)
  users = {user["email"]: user for user in users_response.get("users", [])}

  mother_seed_data = [
    {
      "email": "mother-amina@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "আমিনা খাতুন",
      "patient_id": "11111111-1111-1111-1111-111111111101",
      "phone": "+8801700000001",
      "gestational_age_weeks": 28
    },
    {
      "email": "mother-rahima@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "রহিমা বেগম",
      "patient_id": "11111111-1111-1111-1111-111111111102",
      "phone": "+8801700000002",
      "gestational_age_weeks": 32
    },
    {
      "email": "mother-sharmin@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "শারমিন আক্তার",
      "patient_id": "11111111-1111-1111-1111-111111111103",
      "phone": "+8801700000003",
      "gestational_age_weeks": 20
    },
    {
      "email": "mother-nasima@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "নাসিমা বেগম",
      "patient_id": "11111111-1111-1111-1111-111111111104",
      "phone": "+8801700000004",
      "gestational_age_weeks": 34
    },
    {
      "email": "mother-fatema@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "ফাতেমা আক্তার",
      "patient_id": "11111111-1111-1111-1111-111111111105",
      "phone": "+8801700000005",
      "gestational_age_weeks": 26
    },
    {
      "email": "mother-jannatul@maasheba.local",
      "password": "Mother_B_demo_password",
      "name": "জান্নাতুল ফেরদৌস",
      "patient_id": "11111111-1111-1111-1111-111111111106",
      "phone": "+8801700000006",
      "gestational_age_weeks": 18
    }
  ]

  for m in mother_seed_data:
    email = m["email"]
    password = m["password"]
    name = m["name"]
    patient_id = m["patient_id"]
    phone = m["phone"]
    gestational_age = m["gestational_age_weeks"]

    existing = users.get(email)
    payload = {
      "email": email,
      "password": password,
      "email_confirm": True,
      "user_metadata": {"name": name, "role": "mother"},
    }

    if existing:
      updated = request_json("PUT", f"{supabase_url}/auth/v1/admin/users/{existing['id']}", headers, payload)
      auth_user_id = updated["id"]
      print(f"Auth User updated for {email}: {auth_user_id}")
    else:
      created = request_json("POST", f"{supabase_url}/auth/v1/admin/users", headers, payload)
      auth_user_id = created["id"]
      print(f"Auth User created for {email}: {auth_user_id}")

    # Check if Mother record exists in public.mothers
    existing_mothers = request_json(
      "GET",
      f"{supabase_url}/rest/v1/mothers?auth_user_id=eq.{auth_user_id}&select=id",
      rest_headers,
    )

    mother_payload = {
      "auth_user_id": auth_user_id,
      "name": name,
      "patient_id": patient_id,
      "phone": phone,
      "gestational_age_weeks": gestational_age,
      "is_active": True,
    }

    if existing_mothers:
      m_id = existing_mothers[0]["id"]
      request_json(
        "PATCH",
        f"{supabase_url}/rest/v1/mothers?id=eq.{m_id}",
        rest_headers,
        mother_payload,
      )
      print(f"Mother public profile updated for {name} (linked to patient {patient_id})")
    else:
      new_mother = request_json("POST", f"{supabase_url}/rest/v1/mothers", rest_headers, mother_payload)
      print(f"Mother public profile created for {name} (linked to patient {patient_id})")

  print("Database Seeding & Pruning completed successfully!")


if __name__ == "__main__":
  main()
