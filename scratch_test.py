import os
import urllib.request
import json
from pathlib import Path

ROOT = Path("H:/Projects/MaaSheba")
ENV_PATH = ROOT / ".env"

def load_env(path: Path) -> None:
  if not path.exists():
    return
  for raw_line in path.read_text(encoding="utf-8").splitlines():
    line = raw_line.strip()
    if not line or line.startswith("#") or "=" not in line:
      continue
    key, value = line.split("=", 1)
    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

load_env(ENV_PATH)
supabase_url = os.environ["SUPABASE_URL"].rstrip("/")
service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

headers = {
  "apikey": service_key,
  "Authorization": f"Bearer {service_key}",
  "Content-Type": "application/json",
}

print("Testing simple GET /auth/v1/admin/users...")
req = urllib.request.Request(f"{supabase_url}/auth/v1/admin/users", headers=headers)
try:
  with urllib.request.urlopen(req) as res:
    print("Success! Body length:", len(res.read()))
except Exception as e:
  print("Failed:", e)
  if hasattr(e, 'read'):
    print(e.read().decode())
