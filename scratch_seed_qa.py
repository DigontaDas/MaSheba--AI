import json
import httpx

supabase_url = "https://ibklmeyygujjddntbjsy.supabase.co"
service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia2xtZXl5Z3VqamRkbnRianN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIyNDc4OSwiZXhwIjoyMDk0ODAwNzg5fQ.G5CdRfLi4ci22hl08uGyqpQ3DuEWEB6DybmUAmqRXOo"

def determine_trimester(q, a):
    text = (q + " " + a).lower()
    if "first trimester" in text or "early pregnancy" in text or "1st trimester" in text:
        return "T1"
    if "second trimester" in text or "2nd trimester" in text:
        return "T2"
    if "third trimester" in text or "3rd trimester" in text:
        return "T3"
    if "postpartum" in text or "after birth" in text or "childbirth" in text or "breastfeed" in text:
        return "POSTPARTUM"
    return "ALL"

def determine_severity(q, a):
    text = (q + " " + a).lower()
    if any(k in text for k in ["severe", "emergency", "bleeding", "preeclampsia", "seizure", "danger", "death", "miscarriage", "ectopic"]):
        return "HIGH"
    if any(k in text for k in ["fever", "vomit", "pain", "swollen", "infection", "hygiene"]):
        return "MODERATE"
    return "LOW"

def determine_topic(q, a):
    text = (q + " " + a).lower()
    if "nutrition" in text or "food" in text or "eat" in text or "diet" in text:
        return "Maternal Nutrition"
    if "pill" in text or "contraceptive" in text or "implant" in text or "birth control" in text:
        return "Family Planning"
    if "infection" in text or "uti" in text or "malaria" in text:
        return "Infections"
    return "General Maternal Health"

def seed():
    with open("H:/Projects/MaaSheba/Extra_docs_Useful/mother_question_and_answer_pairs_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} Q&A pairs.")
    
    payload = []
    for idx, item in enumerate(data):
        q = item.get("question", "").strip()
        a = item.get("answer", "").strip()
        if not q or not a:
            continue
            
        payload.append({
            "trimester": determine_trimester(q, a),
            "topic": determine_topic(q, a),
            "question_bn": q,
            "answer_bn": a,
            "severity": determine_severity(q, a)
        })
        
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    url = f"{supabase_url}/rest/v1/master_qa"
    
    # Send in chunks of 50 to be safe and clean
    chunk_size = 50
    batches_sent = 0
    for i in range(0, len(payload), chunk_size):
        chunk = payload[i:i+chunk_size]
        response = httpx.post(url, headers=headers, json=chunk)
        if response.status_code in (200, 201):
            batches_sent += 1
            print(f"Successfully seeded batch {batches_sent}")
        else:
            print(f"Failed to seed batch {i//chunk_size + 1}: {response.status_code} - {response.text}")

if __name__ == "__main__":
    seed()
