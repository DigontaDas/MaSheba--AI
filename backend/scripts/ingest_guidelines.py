import os
import sys
import time
import httpx
from dotenv import load_dotenv

# Add backend directory to path to load settings if needed
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
HF_API_KEY = os.getenv("HF_API_KEY")

GUIDELINE_DATA = [
    {
        "source": "DGHS",
        "chapter": "Blood Pressure & Preeclampsia",
        "content": "রক্তচাপ ১৪০/৯০ mmHg বা তার বেশি হলে গর্ভবতী মায়ের ঝুঁকি বাড়ে। গর্ভকালীন সময়ে রক্তচাপ বৃদ্ধির সাথে যদি প্রস্রাবে প্রোটিন বা শরীরে পানি আসে (বিশেষ করে পা ফোলা), তবে এটিকে প্রিক্ল্যাম্পসিয়া হিসেবে চিহ্নিত করা হয়। গর্ভবতী মায়ের রক্তচাপ ১৪০/৯০ এর বেশি হলে দ্রুত নিকটস্থ হাসপাতালে স্থানান্তর করুন।"
    },
    {
        "source": "DGHS",
        "chapter": "Eclampsia First-Aid & Referral",
        "content": "গর্ভাবস্থায় খিঁচুনি বা এক্লাম্পসিয়া একটি মারাত্মক জরুরি অবস্থা। খিঁচুনি শুরু হলে রোগীকে একদিকে কাত করে শোয়াবেন যাতে মুখ থেকে লালা বা বমি ফুসফুসে প্রবেশ করতে না পারে। রোগীকে দ্রুত হাসপাতালে স্থানান্তর করতে হবে। রেফারের আগে যদি সম্ভব হয় তবে ম্যাগনেসিয়াম সালফেট ইনজেকশন দিতে হবে।"
    },
    {
        "source": "WHO",
        "chapter": "Anemia & Hemoglobin Cutoffs",
        "content": "গর্ভাবস্থায় রক্তশূন্যতা প্রতিরোধে WHO নির্দেশিকা অনুযায়ী হিমোগ্লোবিনের মাত্রা ১১ গ্রাম/ডেসিলিটার (g/dL) এর নিচে হলে তা রক্তশূন্যতা হিসেবে ধরা হয়। যদি হিমোগ্লোবিন ৭ গ্রাম/ডেসিলিটার এর নিচে নেমে যায়, তবে তাকে মারাত্মক বা তীব্র রক্তশূন্যতা (Severe Anemia) বলা হয় এবং রোগীকে দ্রুত রক্ত দেওয়ার জন্য হাসপাতালে পাঠাতে হবে।"
    },
    {
        "source": "WHO",
        "chapter": "Fetal Movement & Kick Count",
        "content": "গর্ভস্থ শিশুর সুস্থতা বুঝতে কিক কাউন্ট বা নড়াচড়া গণনা করা হয়। সাধারণত ১২ ঘণ্টায় শিশু অন্তত ১০ বার নড়াচড়া করা স্বাভাবিক। যদি ১২ ঘণ্টায় শিশুর নড়াচড়া ১০ বারের কম হয় বা নড়াচড়া একদম বন্ধ হয়ে যায়, তবে এটি মারাত্মক ঝুঁকির লক্ষণ। রোগীকে অবিলম্বে হাসপাতালে রেফার করুন।"
    },
    {
        "source": "WHO",
        "chapter": "Antenatal Care ANC Schedule",
        "content": "WHO নির্দেশিকা অনুযায়ী প্রতিটি স্বাভাবিক গর্ভবতী মায়ের গর্ভাবস্থায় কমপক্ষে ৮টি এএনসি (ANC) বা প্রসবপূর্ব সেবা নেওয়া প্রয়োজন। প্রথম ভিজিট ১২ সপ্তাহের মধ্যে, দ্বিতীয়টি ২০ সপ্তাহে, তৃতীয়টি ২৬ সপ্তাহে, চতুর্থটি ৩০ সপ্তাহে, পঞ্চমটি ৩৪ সপ্তাহে, ষষ্ঠটি ৩৬ সপ্তাহে, সপ্তমটি ৩৮ সপ্তাহে এবং অষ্টমটি ৪০ সপ্তাহে সম্পন্ন হওয়া উচিত।"
    }
]

def get_embedding_with_retry(text: str, max_retries: int = 8) -> list[float]:
    url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {}
    if HF_API_KEY:
        headers["Authorization"] = f"Bearer {HF_API_KEY}"
    
    payload = {"inputs": text}
    
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=payload)
                
            if response.status_code == 200:
                res = response.json()
                if isinstance(res, list) and len(res) > 0 and isinstance(res[0], float):
                    return res
                elif isinstance(res, list) and len(res) > 0 and isinstance(res[0], list):
                    return res[0]
                else:
                    raise ValueError(f"Unexpected response format from HuggingFace: {res}")
            elif response.status_code == 503 or (response.status_code == 200 and "loading" in response.text.lower()):
                wait_time = 10.0
                print(f"HuggingFace model is loading. Waiting {wait_time}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                raise Exception(f"HuggingFace embedding failed (HTTP {response.status_code}): {response.text}")
        except httpx.HTTPError as exc:
            print(f"HTTP error occurred: {exc}. Retrying...")
            time.sleep(5.0)
            
    raise Exception("Max retries exceeded while waiting for HuggingFace model to load.")

def upload_chunk_to_supabase(source: str, chapter: str, content: str, embedding: list[float]):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.")
        
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/guideline_chunks"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    payload = {
        "source": source,
        "chapter": chapter,
        "content": content,
        "embedding": embedding
    }
    
    with httpx.Client() as client:
        response = client.post(url, headers=headers, json=payload)
        
    if response.status_code not in (200, 201):
        raise Exception(f"Failed to upload to Supabase (HTTP {response.status_code}): {response.text}")

def main():
    print("Starting MaaSheba Guidelines Ingestion Pipeline...")
    if not SUPABASE_URL:
        print("Error: SUPABASE_URL env variable is missing.")
        sys.exit(1)
        
    print(f"Supabase target: {SUPABASE_URL}")
    success_count = 0
    
    for i, item in enumerate(GUIDELINE_DATA):
        print(f"Processing chunk {i+1}/{len(GUIDELINE_DATA)}: [{item['source']}] {item['chapter']}...")
        try:
            embedding = get_embedding_with_retry(item["content"])
            if len(embedding) != 384:
                raise ValueError(f"Expected 384-dimensional embedding vector, got {len(embedding)}")
                
            upload_chunk_to_supabase(item["source"], item["chapter"], item["content"], embedding)
            print("Successfully embedded and uploaded to Supabase!")
            success_count += 1
        except Exception as e:
            print(f"Failed to process chunk {i+1}: {e}")
            
    print(f"\nIngestion Complete! Successfully loaded {success_count} / {len(GUIDELINE_DATA)} chunks.")

if __name__ == "__main__":
    main()
