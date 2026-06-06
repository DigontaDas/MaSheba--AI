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

  demo_chw_email = os.environ["EXPO_PUBLIC_DEMO_CHW_EMAIL"]
  demo_chw_password = os.environ["EXPO_PUBLIC_DEMO_CHW_PASSWORD"]
  demo_mother_email = os.environ["EXPO_PUBLIC_DEMO_MOTHER_EMAIL"]
  demo_mother_password = os.environ["EXPO_PUBLIC_DEMO_MOTHER_PASSWORD"]

  headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
  }
  rest_headers = {**headers, "Prefer": "return=representation"}

  users_response = request_json("GET", f"{supabase_url}/auth/v1/admin/users?per_page=1000", headers)
  users = {user["email"]: user for user in users_response.get("users", [])}

  demo_users = [
    {
      "email": demo_chw_email,
      "password": demo_chw_password,
      "user_metadata": {"name": "CHW A", "role": "chw"},
    },
    {
      "email": demo_mother_email,
      "password": demo_mother_password,
      "user_metadata": {"name": "রহিমা বেগম", "role": "mother"},
    },
  ]

  user_ids: dict[str, str] = {}
  for user in demo_users:
    existing = users.get(user["email"])
    payload = {
      "email": user["email"],
      "password": user["password"],
      "email_confirm": True,
      "user_metadata": user["user_metadata"],
    }
    if existing:
      updated = request_json("PUT", f"{supabase_url}/auth/v1/admin/users/{existing['id']}", headers, payload)
      user_ids[user["email"]] = updated["id"]
      print(f"{user['email']}: updated {updated['id']}")
    else:
      created = request_json("POST", f"{supabase_url}/auth/v1/admin/users", headers, payload)
      user_ids[user["email"]] = created["id"]
      print(f"{user['email']}: created {created['id']}")

  chw_id = "00000000-0000-0000-0000-0000000000a1"
  request_json(
    "PATCH",
    f"{supabase_url}/rest/v1/chws?id=eq.{chw_id}",
    rest_headers,
    {"auth_user_id": user_ids[demo_chw_email], "is_active": True, "verification_status": "APPROVED"},
  )
  print("CHW_A linked")

  mother_auth_id = user_ids[demo_mother_email]
  existing_mothers = request_json(
    "GET",
    f"{supabase_url}/rest/v1/mothers?auth_user_id=eq.{mother_auth_id}&select=id",
    rest_headers,
  )
  mother_payload = {
    "auth_user_id": mother_auth_id,
    "name": "রহিমা বেগম",
    "patient_id": "11111111-1111-1111-1111-111111111102",
    "gestational_age_weeks": 28,
    "is_active": True,
  }
  if existing_mothers:
    request_json(
      "PATCH",
      f"{supabase_url}/rest/v1/mothers?auth_user_id=eq.{mother_auth_id}",
      rest_headers,
      mother_payload,
    )
    print("Mother linked")
  else:
    request_json("POST", f"{supabase_url}/rest/v1/mothers", rest_headers, mother_payload)
    print("Mother created")


if __name__ == "__main__":
  main()
