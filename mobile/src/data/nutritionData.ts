// Auto-generated from MaSheba AI Maternal Nutrition Dataset.json
// Do not edit manually

export interface NutritionFood {
  id: string;
  name_bn: string;
  name_en: string;
  amount_bn: string;
  frequency_bn: string;
  nutrient_focus: string[];
  cost_level: string;
  rural_affordable: boolean;
  substitutions_bn?: string[];
  caution_bn?: string;
}

export interface MonthlyPlan {
  type: string;
  month: string;
  month_bn: string;
  weeks_range: string;
  stage_label_bn: string;
  daily_energy_note_bn: string;
  daily_foods: NutritionFood[];
  app_display_summary_bn: string;
  cautions_bn: string[];
}

export interface SymptomGuidance {
  id: string;
  symptom_bn: string;
  recommendations: { bn: string }[];
}

export interface SupplementGuidance {
  id: string;
  name_bn: string;
  dose_bn: string;
  timing_bn: string;
  side_effects_bn?: string;
}

export const NUTRITION_DATA = {
  "metadata": {
    "dataset_name": "MaSheba AI Maternal Nutrition Dataset",
    "dataset_name_bn": "মাসেবা AI মাতৃ-পুষ্টি ডেটাসেট",
    "country_context": "Bangladesh",
    "target_context": "Rural Bangladesh",
    "version": "2.0",
    "date_built": "2026-05-25",
    "language": "Bangla-first with English support",
    "purpose": "Month-based practical nutrition recommendations for pregnant mothers in rural Bangladesh, including low-cost foods, Bangla UI text, household amounts, substitutions, cautions, and symptom-aware guidance.",
    "target_users": [
      "pregnant mothers in rural Bangladesh",
      "family caregivers",
      "community health workers / স্বাস্থ্যকর্মী",
      "MaSheba AI chatbot and mobile app"
    ],
    "important_disclaimer_en": "This dataset is for general nutrition education and app guidance. It is not a substitute for antenatal care, clinical diagnosis, emergency care, or a doctor's prescription.",
    "important_disclaimer_bn": "এই ডেটাসেটটি সাধারণ পুষ্টি শিক্ষা ও অ্যাপের পরামর্শের জন্য। এটি ডাক্তার, ধাত্রী, পুষ্টিবিদ বা স্বাস্থ্যকর্মীর চিকিৎসা পরামর্শের বিকল্প নয়। রক্তপাত, খুব বেশি বমি, উচ্চ রক্তচাপ, খিঁচুনি, প্রচণ্ড মাথাব্যথা, চোখে ঝাপসা দেখা, হাত-পা-মুখ বেশি ফুলে যাওয়া, জ্বর, শিশুর নড়াচড়া কমে যাওয়া, বা খুব দুর্বল লাগলে দ্রুত স্বাস্থ্যকেন্দ্রে যোগাযোগ করুন।",
    "household_measure_reference": {
      "cup": {
        "en": "1 cup cooked food = about 240-250 mL",
        "bn": "১ কাপ রান্না করা খাবার = প্রায় ২৪০-২৫০ মিলি"
      },
      "medium_bowl": {
        "en": "1 medium bowl/katori = about 150-180 mL",
        "bn": "১ মাঝারি বাটি = প্রায় ১৫০-১৮০ মিলি"
      },
      "glass": {
        "en": "1 glass water/milk = about 200-250 mL",
        "bn": "১ গ্লাস পানি/দুধ = প্রায় ২০০-২৫০ মিলি"
      },
      "handful": {
        "en": "1 handful roasted gram/peanut = about 25-30 g",
        "bn": "১ মুঠো ভাজা ছোলা/বাদাম = প্রায় ২৫-৩০ গ্রাম"
      },
      "fish_piece": {
        "en": "1 palm-size cooked fish piece = about 50-60 g edible portion",
        "bn": "১ তালু-সমান রান্না করা মাছ = প্রায় ৫০-৬০ গ্রাম খাওয়ার অংশ"
      },
      "egg": {
        "en": "1 egg = 1 fully cooked whole egg",
        "bn": "১টি ডিম = ভালোভাবে রান্না করা সম্পূর্ণ ডিম"
      },
      "fruit_serving": {
        "en": "1 fruit serving = 1 medium banana/guava/orange or 1 cup cut fruit",
        "bn": "১ পরিবেশন ফল = ১টি মাঝারি কলা/পেয়ারা/কমলা অথবা ১ কাপ কাটা ফল"
      }
    },
    "cost_tag_meaning": {
      "low": "Usually affordable and commonly available in rural Bangladesh",
      "medium": "Useful but may not be affordable daily for all households",
      "optional": "Good if available, not required"
    }
  },
  "global_daily_rules": {
    "title_en": "Simple daily food rule",
    "title_bn": "প্রতিদিনের সহজ খাবারের নিয়ম",
    "rules": [
      {
        "id": "plate_diversity",
        "text_en": "Do not fill the stomach with rice only. Try to include rice/roti, dal, vegetables, protein food, fruit, and calcium-rich food across the day.",
        "text_bn": "শুধু ভাত দিয়ে পেট ভরাবেন না। দিনে ভাত/রুটি, ডাল, শাক-সবজি, প্রোটিন, ফল এবং ক্যালসিয়ামযুক্ত খাবার রাখার চেষ্টা করুন।"
      },
      {
        "id": "extra_food",
        "text_en": "From the 4th month onward, add one extra small meal or snack daily if possible.",
        "text_bn": "৪র্থ মাস থেকে সম্ভব হলে প্রতিদিন ১টি অতিরিক্ত ছোট খাবার বা নাস্তা যোগ করুন।"
      },
      {
        "id": "protein_daily",
        "text_en": "Eat at least one protein food every day: egg, fish, dal, chicken, beans, chickpea, or lentils.",
        "text_bn": "প্রতিদিন অন্তত ১ ধরনের প্রোটিন খাবার খান: ডিম, মাছ, ডাল, মুরগি, শিম/বিন, ছোলা বা ডালজাতীয় খাবার।"
      },
      {
        "id": "iron_vitamin_c",
        "text_en": "Eat vitamin C foods such as lemon, guava, amloki, tomato, or orange with iron-rich foods.",
        "text_bn": "আয়রনসমৃদ্ধ খাবারের সাথে লেবু, পেয়ারা, আমলকি, টমেটো বা কমলার মতো ভিটামিন C খাবার খান।"
      },
      {
        "id": "tea_spacing",
        "text_en": "Avoid tea or coffee immediately with meals or iron tablets because it can reduce iron absorption.",
        "text_bn": "খাবার বা আয়রন ট্যাবলেটের সাথে সাথে চা/কফি খাবেন না, কারণ এতে আয়রন শোষণ কমতে পারে।"
      },
      {
        "id": "safe_food",
        "text_en": "Eat freshly cooked food and drink safe water.",
        "text_bn": "তাজা রান্না করা খাবার খান এবং নিরাপদ পানি পান করুন।"
      }
    ]
  },
  "supplement_guidance": [
    {
      "id": "iron_folic_acid",
      "name_en": "Iron-folic acid",
      "name_bn": "আয়রন-ফলিক অ্যাসিড",
      "dose_en": "Usually 30-60 mg elemental iron + 400 mcg folic acid daily; follow local ANC prescription.",
      "dose_bn": "সাধারণত প্রতিদিন ৩০-৬০ মি.গ্রা. এলিমেন্টাল আয়রন + ৪০০ মাইক্রোগ্রাম ফলিক অ্যাসিড; স্থানীয় ANC/ডাক্তারের পরামর্শ অনুসরণ করুন।",
      "timing_en": "Take daily from pregnancy detection or first ANC contact unless advised otherwise.",
      "timing_bn": "গর্ভধারণ জানা গেলে বা প্রথম ANC ভিজিট থেকে প্রতিদিন নিন, যদি স্বাস্থ্যকর্মী/ডাক্তার ভিন্ন কিছু না বলেন।",
      "caution_en": "Do not stop because of nausea or constipation without asking a provider.",
      "caution_bn": "বমি বমি ভাব বা কোষ্ঠকাঠিন্য হলে নিজে নিজে বন্ধ করবেন না; স্বাস্থ্যকর্মী/ডাক্তারের সাথে কথা বলুন।"
    },
    {
      "id": "calcium",
      "name_en": "Calcium",
      "name_bn": "ক্যালসিয়াম",
      "dose_en": "If prescribed/provided: 1.5-2.0 g elemental calcium daily, usually divided into doses.",
      "dose_bn": "যদি দেওয়া/প্রেসক্রাইব করা হয়: প্রতিদিন ১.৫-২.০ গ্রাম এলিমেন্টাল ক্যালসিয়াম, সাধারণত ভাগ করে খেতে হয়।",
      "timing_en": "Take with meals and keep several hours apart from iron tablets.",
      "timing_bn": "খাবারের সাথে নিন এবং আয়রন ট্যাবলেট থেকে কয়েক ঘণ্টা আলাদা রাখুন।",
      "caution_en": "Follow ANC provider advice because tablet strength may vary.",
      "caution_bn": "ট্যাবলেটের শক্তি ভিন্ন হতে পারে, তাই ANC স্বাস্থ্যকর্মী/ডাক্তারের পরামর্শ মেনে চলুন।"
    }
  ],
  "monthly_nutrition_plan": [
    {
      "type": "stage",
      "month": "1",
      "month_bn": "১ম মাস",
      "weeks_range": "1-4",
      "stage_label_en": "Month 1: early pregnancy",
      "stage_label_bn": "১ম মাস: গর্ভাবস্থার শুরু",
      "daily_energy_note_en": "No major extra food is required yet; protect regular meals and start ANC/supplement advice.",
      "daily_energy_note_bn": "এখনই খুব বেশি অতিরিক্ত খাবার দরকার নেই; নিয়মিত খাবার বজায় রাখুন এবং ANC/সাপ্লিমেন্ট পরামর্শ শুরু করুন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 2 rotis or 1 cup rice; lunch: 1-1.5 cups rice; dinner: 1-1.5 cups rice",
          "amount_bn": "সকাল: ২টি রুটি বা ১ কাপ ভাত; দুপুর: ১-১.৫ কাপ ভাত; রাত: ১-১.৫ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "চিঁড়া",
            "খিচুড়ি"
          ],
          "prep_tip_en": "Eat with dal and vegetables, not plain rice only.",
          "prep_tip_bn": "শুধু ভাত নয়; ডাল ও সবজির সাথে খান।"
        },
        {
          "id": "dal",
          "name_bn": "ডাল",
          "name_en": "Lentils/dal",
          "amount_en": "1 medium bowl thick dal",
          "amount_bn": "১ মাঝারি বাটি ঘন ডাল",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ ডাল",
            "মসুর ডাল",
            "ছোলা"
          ],
          "prep_tip_en": "Thick dal gives more nutrition than very watery dal.",
          "prep_tip_bn": "পাতলা ডালের চেয়ে ঘন ডালে পুষ্টি বেশি।"
        },
        {
          "id": "leafy_greens",
          "name_bn": "শাক",
          "name_en": "Leafy greens",
          "amount_en": "1/2-1 cup cooked",
          "amount_bn": "রান্না করা ১/২-১ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলমী শাক",
            "পালং শাক",
            "লাল শাক",
            "পুঁই শাক"
          ],
          "prep_tip_en": "Use seasonal local greens.",
          "prep_tip_bn": "মৌসুমি স্থানীয় শাক ব্যবহার করুন।"
        },
        {
          "id": "egg",
          "name_bn": "ডিম",
          "name_en": "Egg",
          "amount_en": "1 fully cooked egg",
          "amount_bn": "ভালোভাবে রান্না করা ১টি ডিম",
          "frequency_en": "daily or at least 5 days/week",
          "frequency_bn": "প্রতিদিন বা সপ্তাহে অন্তত ৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মাছ",
            "ডাল",
            "ছোলা"
          ],
          "prep_tip_en": "Boiled egg is simple and safe.",
          "prep_tip_bn": "সিদ্ধ ডিম সহজ ও নিরাপদ।"
        },
        {
          "id": "fruit",
          "name_bn": "স্থানীয় ফল",
          "name_en": "Local fruit",
          "amount_en": "1 medium fruit or 1 cup cut fruit",
          "amount_bn": "১টি মাঝারি ফল বা ১ কাপ কাটা ফল",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "vitamins",
            "fiber",
            "hydration"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলা",
            "পেয়ারা",
            "কুল",
            "আমলকি",
            "কমলা"
          ],
          "prep_tip_en": "Choose local seasonal fruit.",
          "prep_tip_bn": "স্থানীয় মৌসুমি ফল বেছে নিন।"
        },
        {
          "id": "water",
          "name_bn": "পানি",
          "name_en": "Water",
          "amount_en": "8 glasses",
          "amount_bn": "৮ গ্লাস",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "hydration"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [],
          "prep_tip_en": "Use safe drinking water.",
          "prep_tip_bn": "নিরাপদ পানি পান করুন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "১ম মাস: গর্ভাবস্থার শুরু: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "2",
      "month_bn": "২য় মাস",
      "weeks_range": "5-8",
      "stage_label_en": "Month 2: nausea-friendly eating",
      "stage_label_bn": "২য় মাস: বমি বমি ভাব থাকলে সহজ খাবার",
      "daily_energy_note_en": "Keep the same base meals; add a light snack if appetite is low.",
      "daily_energy_note_bn": "আগের মতো খাবার রাখুন; ক্ষুধা কম হলে হালকা নাস্তা যোগ করুন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 2 rotis or 1 cup rice; lunch: 1.5 cups rice; dinner: 1.5 cups rice",
          "amount_bn": "সকাল: ২টি রুটি বা ১ কাপ ভাত; দুপুর: ১.৫ কাপ ভাত; রাত: ১.৫ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "নরম খিচুড়ি",
            "চিঁড়া"
          ],
          "prep_tip_en": "Split meals if nausea is high.",
          "prep_tip_bn": "বমি বমি ভাব বেশি হলে অল্প অল্প করে বারবার খান।"
        },
        {
          "id": "light_snack",
          "name_bn": "মুড়ি / চিঁড়া / কলা",
          "name_en": "Muri / chira / banana",
          "amount_en": "1/2-1 cup muri/chira or 1 banana",
          "amount_bn": "১/২-১ কাপ মুড়ি/চিঁড়া বা ১টি কলা",
          "frequency_en": "1 time/day",
          "frequency_bn": "দিনে ১ বার",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "সিদ্ধ ছোলা",
            "টোস্ট"
          ],
          "prep_tip_en": "Good when heavy meals are difficult.",
          "prep_tip_bn": "ভারী খাবার খেতে কষ্ট হলে উপকারী।"
        },
        {
          "id": "dal",
          "name_bn": "ডাল",
          "name_en": "Lentils/dal",
          "amount_en": "1 medium bowl",
          "amount_bn": "১ মাঝারি বাটি",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোলা",
            "মুগ ডাল"
          ],
          "prep_tip_en": "Add vegetables if possible.",
          "prep_tip_bn": "সম্ভব হলে সবজি দিয়ে রান্না করুন।"
        },
        {
          "id": "egg",
          "name_bn": "ডিম",
          "name_en": "Egg",
          "amount_en": "1 egg",
          "amount_bn": "১টি ডিম",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মাছ",
            "ডাল"
          ],
          "prep_tip_en": "Use fully cooked egg only.",
          "prep_tip_bn": "ভালোভাবে রান্না করা ডিম খান।"
        },
        {
          "id": "milk_curd",
          "name_bn": "দুধ / টক দই",
          "name_en": "Milk / curd",
          "amount_en": "1 cup milk or 1/2 cup curd",
          "amount_bn": "১ কাপ দুধ বা ১/২ কাপ টক দই",
          "frequency_en": "daily if possible",
          "frequency_bn": "সম্ভব হলে প্রতিদিন",
          "nutrient_focus": [
            "calcium",
            "protein"
          ],
          "cost_level": "medium",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোট মাছ",
            "তিল"
          ],
          "prep_tip_en": "Boil milk if hygiene is uncertain.",
          "prep_tip_bn": "পরিষ্কার নিয়ে সন্দেহ থাকলে দুধ ফুটিয়ে খান।"
        },
        {
          "id": "vegetables",
          "name_bn": "শাক ও সবজি",
          "name_en": "Leafy greens and vegetables",
          "amount_en": "Leafy greens 1/2-1 cup + other vegetables 1 cup",
          "amount_bn": "শাক ১/২-১ কাপ + অন্যান্য সবজি ১ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "লাউ",
            "কুমড়া",
            "বেগুন",
            "ঢেঁড়স"
          ],
          "prep_tip_en": "Use whatever is cheap and seasonal.",
          "prep_tip_bn": "যা সস্তা ও মৌসুমি, সেটাই ব্যবহার করুন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "২য় মাস: বমি বমি ভাব থাকলে সহজ খাবার: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "3",
      "month_bn": "৩য় মাস",
      "weeks_range": "9-13",
      "stage_label_en": "Month 3: transition to balanced plate",
      "stage_label_bn": "৩য় মাস: সুষম প্লেটের দিকে যাওয়া",
      "daily_energy_note_en": "Still no large increase; focus on food diversity and regular meals.",
      "daily_energy_note_bn": "এখনও খুব বেশি বাড়তি খাবার নয়; খাবারে বৈচিত্র্য ও নিয়মিততা জরুরি।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 2-3 rotis or 1-1.5 cups rice; lunch: 1.5 cups rice; dinner: 1.5 cups rice",
          "amount_bn": "সকাল: ২-৩টি রুটি বা ১-১.৫ কাপ ভাত; দুপুর: ১.৫ কাপ ভাত; রাত: ১.৫ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "খিচুড়ি"
          ],
          "prep_tip_en": "Try half plate staple and rest from dal, vegetables, egg/fish, fruit.",
          "prep_tip_bn": "প্লেটের অর্ধেক ভাত/রুটি, বাকি অংশে ডাল, সবজি, ডিম/মাছ, ফল রাখার চেষ্টা করুন।"
        },
        {
          "id": "protein_combo",
          "name_bn": "ডিম বা মাছ",
          "name_en": "Egg or fish",
          "amount_en": "1 egg or 1 palm-size fish serving",
          "amount_bn": "১টি ডিম বা ১ তালু-সমান মাছ",
          "frequency_en": "1-2 times/day combined",
          "frequency_bn": "দিনে মোট ১-২ বার",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12",
            "calcium"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডাল",
            "ছোলা",
            "মুগ"
          ],
          "prep_tip_en": "If fish is not available, keep egg or dal.",
          "prep_tip_bn": "মাছ না থাকলে ডিম বা ডাল রাখুন।"
        },
        {
          "id": "dal",
          "name_bn": "ডাল",
          "name_en": "Dal",
          "amount_en": "1 medium bowl",
          "amount_bn": "১ মাঝারি বাটি",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোলা",
            "মটর ডাল"
          ],
          "prep_tip_en": "Keep dal even when animal food is not available.",
          "prep_tip_bn": "মাছ/ডিম না থাকলেও ডাল রাখুন।"
        },
        {
          "id": "greens",
          "name_bn": "শাক",
          "name_en": "Leafy greens",
          "amount_en": "1 cup cooked",
          "amount_bn": "রান্না করা ১ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলমী",
            "লাল শাক",
            "পালং",
            "পুঁই"
          ],
          "prep_tip_en": "Leafy greens are low-cost nutrient-rich foods.",
          "prep_tip_bn": "শাক কম খরচে বেশি পুষ্টিকর খাবার।"
        },
        {
          "id": "fruit",
          "name_bn": "স্থানীয় ফল",
          "name_en": "Local fruit",
          "amount_en": "1 medium fruit or 1 cup cut fruit",
          "amount_bn": "১টি মাঝারি ফল বা ১ কাপ কাটা ফল",
          "frequency_en": "1-2 times/day",
          "frequency_bn": "দিনে ১-২ বার",
          "nutrient_focus": [
            "vitamins",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলা",
            "পেয়ারা",
            "কুল",
            "কমলা"
          ],
          "prep_tip_en": "Local fruit is enough; imported fruit is not needed.",
          "prep_tip_bn": "দেশি ফলই যথেষ্ট; দামি আমদানি করা ফল দরকার নেই।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৩য় মাস: সুষম প্লেটের দিকে যাওয়া: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "4",
      "month_bn": "৪র্থ মাস",
      "weeks_range": "14-17",
      "stage_label_en": "Month 4: second trimester build-up",
      "stage_label_bn": "৪র্থ মাস: দ্বিতীয় ত্রৈমাসিকে খাবার একটু বাড়ানো",
      "daily_energy_note_en": "Begin one extra small snack/meal daily if possible.",
      "daily_energy_note_bn": "সম্ভব হলে প্রতিদিন ১টি অতিরিক্ত ছোট নাস্তা/খাবার শুরু করুন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 2-3 rotis or 1.5 cups rice; lunch: 2 cups rice; dinner: 1.5-2 cups rice",
          "amount_bn": "সকাল: ২-৩টি রুটি বা ১.৫ কাপ ভাত; দুপুর: ২ কাপ ভাত; রাত: ১.৫-২ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "খিচুড়ি",
            "আটা রুটি"
          ],
          "prep_tip_en": "Do not let rice replace protein and vegetables.",
          "prep_tip_bn": "ভাত যেন প্রোটিন ও সবজির জায়গা না নিয়ে ফেলে।"
        },
        {
          "id": "extra_snack",
          "name_bn": "অতিরিক্ত নাস্তা",
          "name_en": "Extra snack",
          "amount_en": "1 serving: banana / boiled chola / muri with jaggery / chira with milk",
          "amount_bn": "১ পরিবেশন: কলা / সিদ্ধ ছোলা / মুড়ি-গুড় / দুধ-চিঁড়া",
          "frequency_en": "1 time/day",
          "frequency_bn": "দিনে ১ বার",
          "nutrient_focus": [
            "energy",
            "protein"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ভাজা ছোলা",
            "ডিম",
            "দই"
          ],
          "prep_tip_en": "This helps meet extra pregnancy needs.",
          "prep_tip_bn": "এটি গর্ভাবস্থার বাড়তি চাহিদা পূরণে সাহায্য করে।"
        },
        {
          "id": "fish",
          "name_bn": "মাছ / ছোট মাছ",
          "name_en": "Fish / small fish",
          "amount_en": "1 palm-size piece or 2-3 small fish",
          "amount_bn": "১ তালু-সমান টুকরা বা ২-৩টি ছোট মাছ",
          "frequency_en": "daily or at least 5 days/week",
          "frequency_bn": "প্রতিদিন বা সপ্তাহে অন্তত ৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "calcium"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Affordable fish more often is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "egg",
          "name_bn": "ডিম",
          "name_en": "Egg",
          "amount_en": "1 egg",
          "amount_bn": "১টি ডিম",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মাছ",
            "ডাল"
          ],
          "prep_tip_en": "Keep egg daily if possible.",
          "prep_tip_bn": "সম্ভব হলে প্রতিদিন ডিম রাখুন।"
        },
        {
          "id": "vegetables",
          "name_bn": "শাক ও সবজি",
          "name_en": "Leafy greens and vegetables",
          "amount_en": "Leafy greens 1 cup + other vegetables 1.5-2 cups total",
          "amount_bn": "শাক ১ কাপ + অন্যান্য সবজি মোট ১.৫-২ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কুমড়া",
            "লাউ",
            "বেগুন",
            "শিম"
          ],
          "prep_tip_en": "Rotate cheap local vegetables.",
          "prep_tip_bn": "সস্তা স্থানীয় সবজি পাল্টে পাল্টে খান।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৪র্থ মাস: দ্বিতীয় ত্রৈমাসিকে খাবার একটু বাড়ানো: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "5",
      "month_bn": "৫ম মাস",
      "weeks_range": "18-22",
      "stage_label_en": "Month 5: balanced plate month",
      "stage_label_bn": "৫ম মাস: সুষম খাবারের মাস",
      "daily_energy_note_en": "Use balanced-plate eating with one extra snack.",
      "daily_energy_note_bn": "সুষম প্লেটের খাবার রাখুন এবং ১টি অতিরিক্ত নাস্তা যোগ করুন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 1.5 cups rice or 3 chapatis; lunch: 2.5-3 cups rice; dinner: 2 cups rice",
          "amount_bn": "সকাল: ১.৫ কাপ ভাত বা ৩টি রুটি; দুপুর: ২.৫-৩ কাপ ভাত; রাত: ২ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "খিচুড়ি"
          ],
          "prep_tip_en": "Adjust slightly by appetite and body size.",
          "prep_tip_bn": "ক্ষুধা ও শরীরের গঠন অনুযায়ী সামান্য কম-বেশি হতে পারে।"
        },
        {
          "id": "dal",
          "name_bn": "ঘন ডাল",
          "name_en": "Thick dal",
          "amount_en": "1 cup",
          "amount_bn": "১ কাপ",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোলা",
            "মুগ"
          ],
          "prep_tip_en": "Make dal thick rather than very watery.",
          "prep_tip_bn": "ডাল খুব পাতলা না করে ঘন করুন।"
        },
        {
          "id": "fish_egg",
          "name_bn": "ডিম / মাছ",
          "name_en": "Egg / fish",
          "amount_en": "1 egg daily + 1 fish serving daily if possible",
          "amount_bn": "প্রতিদিন ১টি ডিম + সম্ভব হলে ১ পরিবেশন মাছ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12",
            "calcium"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডাল",
            "ছোলা",
            "মুরগি"
          ],
          "prep_tip_en": "Egg and fish are practical low-cost protein choices.",
          "prep_tip_bn": "ডিম ও মাছ গ্রামীণ পরিবারের জন্য ভালো প্রোটিন।"
        },
        {
          "id": "vegetables",
          "name_bn": "শাক ও সবজি",
          "name_en": "Leafy and non-leafy vegetables",
          "amount_en": "Total 3-4 cups cooked across the day",
          "amount_bn": "সারা দিনে মোট ৩-৪ কাপ রান্না করা শাক-সবজি",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "vitamin A",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "পালং",
            "কলমী",
            "কুমড়া",
            "লাউ",
            "ঢেঁড়স"
          ],
          "prep_tip_en": "Use seasonal vegetables; pumpkin and cauliflower leaves are useful low-cost choices.",
          "prep_tip_bn": "মৌসুমি সবজি ব্যবহার করুন; কুমড়া ও ফুলকপির পাতা সস্তা পুষ্টিকর।"
        },
        {
          "id": "milk_curd",
          "name_bn": "দুধ / টক দই",
          "name_en": "Milk / curd",
          "amount_en": "1 cup milk or 1/2-1 cup curd",
          "amount_bn": "১ কাপ দুধ বা ১/২-১ কাপ টক দই",
          "frequency_en": "daily if possible",
          "frequency_bn": "সম্ভব হলে প্রতিদিন",
          "nutrient_focus": [
            "calcium",
            "protein"
          ],
          "cost_level": "medium",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোট মাছ",
            "তিল"
          ],
          "prep_tip_en": "If milk is costly, small fish with bones can help calcium intake.",
          "prep_tip_bn": "দুধ দামী হলে কাঁটাসহ ছোট মাছ ক্যালসিয়ামে সাহায্য করে।"
        },
        {
          "id": "fruit",
          "name_bn": "ফল",
          "name_en": "Fruit",
          "amount_en": "2 servings",
          "amount_bn": "২ পরিবেশন",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "vitamins",
            "fiber",
            "hydration"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলা",
            "পেয়ারা",
            "কুল",
            "আম",
            "পাকা পেঁপে"
          ],
          "prep_tip_en": "Choose local seasonal fruit.",
          "prep_tip_bn": "স্থানীয় মৌসুমি ফল বেছে নিন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৫ম মাস: সুষম খাবারের মাস: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "6",
      "month_bn": "৬ষ্ঠ মাস",
      "weeks_range": "23-27",
      "stage_label_en": "Month 6: protect nutrient density",
      "stage_label_bn": "৬ষ্ঠ মাস: পুষ্টিসমৃদ্ধ খাবার ধরে রাখা",
      "daily_energy_note_en": "Continue balanced plate; protect egg, dal, greens, fish, and fruit when food budget is limited.",
      "daily_energy_note_bn": "সুষম খাবার চালিয়ে যান; টাকা কম থাকলেও ডিম, ডাল, শাক, মাছ ও ফল যতটা সম্ভব রাখুন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Breakfast: 1.5 cups rice or 3 chapatis; lunch: 2.5-3 cups rice; dinner: 2 cups rice",
          "amount_bn": "সকাল: ১.৫ কাপ ভাত বা ৩টি রুটি; দুপুর: ২.৫-৩ কাপ ভাত; রাত: ২ কাপ ভাত",
          "frequency_en": "3 meals/day",
          "frequency_bn": "দিনে ৩ বেলা",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "খিচুড়ি",
            "আটা রুটি"
          ],
          "prep_tip_en": "Split meals if feeling too full.",
          "prep_tip_bn": "পেট বেশি ভরে গেলে খাবার ভাগ করে খান।"
        },
        {
          "id": "dal_pulses",
          "name_bn": "ডাল / ছোলা / মুগ",
          "name_en": "Dal / chickpea / mung",
          "amount_en": "1 cup dal twice daily or 1 bowl pulse dish",
          "amount_bn": "দিনে ২ বার ১ কাপ ডাল বা ১ বাটি ডালজাতীয় পদ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মসুর",
            "মুগ",
            "ছোলা",
            "মটর"
          ],
          "prep_tip_en": "Pulses are the low-cost protein backbone.",
          "prep_tip_bn": "ডালজাতীয় খাবার কম খরচে ভালো প্রোটিন।"
        },
        {
          "id": "egg",
          "name_bn": "ডিম",
          "name_en": "Egg",
          "amount_en": "1 egg",
          "amount_bn": "১টি ডিম",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "vitamin B12"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মাছ",
            "ডাল"
          ],
          "prep_tip_en": "Daily egg helps close common diet gaps.",
          "prep_tip_bn": "প্রতিদিন ডিম খেলে পুষ্টির ঘাটতি কমাতে সাহায্য করে।"
        },
        {
          "id": "fish",
          "name_bn": "ছোট মাছ / মাছ",
          "name_en": "Small fish / fish",
          "amount_en": "1 serving: 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন: ২-৩টি ছোট মাছ বা ১ তালু-সমান মাছ",
          "frequency_en": "daily or 5-6 days/week",
          "frequency_bn": "প্রতিদিন বা সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Small fish are useful where milk is not affordable.",
          "prep_tip_bn": "দুধ কিনতে না পারলে ছোট মাছ উপকারী।"
        },
        {
          "id": "greens_veg",
          "name_bn": "শাক ও সবজি",
          "name_en": "Leafy greens and vegetables",
          "amount_en": "Leafy greens 1 cup + other vegetables 2-3 cups total",
          "amount_bn": "শাক ১ কাপ + অন্যান্য সবজি মোট ২-৩ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "লাল শাক",
            "পালং",
            "কুমড়া",
            "লাউ"
          ],
          "prep_tip_en": "Do not drop vegetables when rice intake increases.",
          "prep_tip_bn": "ভাত বাড়লেও সবজি বাদ দেবেন না।"
        },
        {
          "id": "snack",
          "name_bn": "হালকা নাস্তা",
          "name_en": "Extra snack",
          "amount_en": "1-2 servings: chola, muri-gur, banana, chira-milk",
          "amount_bn": "১-২ পরিবেশন: ছোলা, মুড়ি-গুড়, কলা, দুধ-চিঁড়া",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "energy",
            "protein"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ভাজা ছোলা",
            "সিদ্ধ আলু",
            "ডিম"
          ],
          "prep_tip_en": "Use snacks to protect total intake.",
          "prep_tip_bn": "নাস্তা মোট খাবারের পরিমাণ বজায় রাখতে সাহায্য করে।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৬ষ্ঠ মাস: পুষ্টিসমৃদ্ধ খাবার ধরে রাখা: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "7",
      "month_bn": "৭ম মাস",
      "weeks_range": "28-31",
      "stage_label_en": "Month 7: third trimester split meals",
      "stage_label_bn": "৭ম মাস: তৃতীয় ত্রৈমাসিকে ভাগ করে খাবার",
      "daily_energy_note_en": "Needs remain high, but large meals may feel uncomfortable. Use smaller frequent meals.",
      "daily_energy_note_bn": "খাবারের চাহিদা বেশি থাকে, কিন্তু বড় খাবার খেতে অস্বস্তি হতে পারে। তাই অল্প অল্প করে বারবার খান।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Total 5.5-6.5 cups rice-equivalent across the day, split into meals/snacks",
          "amount_bn": "সারা দিনে মোট ৫.৫-৬.৫ কাপ ভাত-সমপরিমাণ খাবার, ভাগ করে খান",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "রুটি",
            "খিচুড়ি"
          ],
          "prep_tip_en": "Do not sharply cut food volume; split meals instead.",
          "prep_tip_bn": "খাবার হঠাৎ কমাবেন না; ভাগ করে খান।"
        },
        {
          "id": "dal",
          "name_bn": "ঘন ডাল",
          "name_en": "Thick dal",
          "amount_en": "1 cup",
          "amount_bn": "১ কাপ",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোলা",
            "মুগ"
          ],
          "prep_tip_en": "Dal is easier than oily heavy foods.",
          "prep_tip_bn": "তেলযুক্ত ভারী খাবারের চেয়ে ডাল সহজপাচ্য হতে পারে।"
        },
        {
          "id": "fish_egg",
          "name_bn": "মাছ ও ডিম",
          "name_en": "Fish and egg",
          "amount_en": "1 egg daily + 1 fish serving if possible",
          "amount_bn": "প্রতিদিন ১টি ডিম + সম্ভব হলে ১ পরিবেশন মাছ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "calcium",
            "vitamin B12"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডাল",
            "ছোলা"
          ],
          "prep_tip_en": "Keep protein regular in late pregnancy.",
          "prep_tip_bn": "শেষের দিকে প্রোটিন নিয়মিত রাখুন।"
        },
        {
          "id": "vegetables",
          "name_bn": "শাক ও মিশ্র সবজি",
          "name_en": "Leafy greens and mixed vegetables",
          "amount_en": "Leafy greens 1 cup + other vegetables 2-3 cups",
          "amount_bn": "শাক ১ কাপ + অন্যান্য সবজি ২-৩ কাপ",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "folate",
            "vitamin A",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "লাউ",
            "কুমড়া",
            "ঢেঁড়স"
          ],
          "prep_tip_en": "Vegetables help digestion and food diversity.",
          "prep_tip_bn": "সবজি হজম ও খাবারের বৈচিত্র্যে সাহায্য করে।"
        },
        {
          "id": "milk_fruit_water",
          "name_bn": "দুধ/দই + ফল + পানি",
          "name_en": "Milk/curd + fruit + water",
          "amount_en": "Milk/curd 1 serving; fruit 2 servings; water 9-10 glasses",
          "amount_bn": "দুধ/দই ১ পরিবেশন; ফল ২ পরিবেশন; পানি ৯-১০ গ্লাস",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "calcium",
            "vitamins",
            "hydration",
            "fiber"
          ],
          "cost_level": "medium",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোট মাছ",
            "কলা",
            "পেয়ারা"
          ],
          "prep_tip_en": "Keep hydration steady.",
          "prep_tip_bn": "পানি সারা দিনে নিয়মিত পান করুন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৭ম মাস: তৃতীয় ত্রৈমাসিকে ভাগ করে খাবার: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "8",
      "month_bn": "৮ম মাস",
      "weeks_range": "32-35",
      "stage_label_en": "Month 8: comfort, calcium and fiber",
      "stage_label_bn": "৮ম মাস: আরাম, ক্যালসিয়াম ও আঁশ",
      "daily_energy_note_en": "Keep the same balanced foods; focus on digestion, hydration, calcium-rich foods, and safe cooking.",
      "daily_energy_note_bn": "একই সুষম খাবার চালিয়ে যান; হজম, পানি, ক্যালসিয়ামযুক্ত খাবার ও নিরাপদ রান্নায় গুরুত্ব দিন।",
      "daily_foods": [
        {
          "id": "rice_roti",
          "name_bn": "ভাত / রুটি",
          "name_en": "Rice / roti",
          "amount_en": "Total about 5.5-6 cups rice-equivalent across the day",
          "amount_bn": "সারা দিনে মোট প্রায় ৫.৫-৬ কাপ ভাত-সমপরিমাণ খাবার",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "খিচুড়ি",
            "রুটি"
          ],
          "prep_tip_en": "Smaller portions may feel easier.",
          "prep_tip_bn": "অল্প করে খেলে আরাম লাগতে পারে।"
        },
        {
          "id": "protein",
          "name_bn": "ডিম / মাছ / ডাল",
          "name_en": "Egg / fish / dal",
          "amount_en": "Egg 1 daily; fish 1 serving daily if possible; dal 1 cup twice daily",
          "amount_bn": "প্রতিদিন ১টি ডিম; সম্ভব হলে ১ পরিবেশন মাছ; দিনে ২ বার ১ কাপ ডাল",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "calcium"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোলা",
            "মুগ",
            "মুরগি"
          ],
          "prep_tip_en": "Do not replace protein foods with tea and biscuits.",
          "prep_tip_bn": "চা-বিস্কুট দিয়ে প্রোটিন খাবার বাদ দেবেন না।"
        },
        {
          "id": "calcium_foods",
          "name_bn": "দুধ / দই / ছোট মাছ",
          "name_en": "Milk / curd / small fish",
          "amount_en": "Milk 1 cup or curd 1/2-1 cup; small fish 1 serving when available",
          "amount_bn": "১ কাপ দুধ বা ১/২-১ কাপ দই; সম্ভব হলে ১ পরিবেশন ছোট মাছ",
          "frequency_en": "daily if possible",
          "frequency_bn": "সম্ভব হলে প্রতিদিন",
          "nutrient_focus": [
            "calcium",
            "protein"
          ],
          "cost_level": "medium",
          "rural_affordable": true,
          "substitutions_bn": [
            "তিল",
            "ছোট মাছ"
          ],
          "prep_tip_en": "Small fish with edible bones helps calcium intake.",
          "prep_tip_bn": "কাঁটাসহ ছোট মাছ ক্যালসিয়ামে সাহায্য করে।"
        },
        {
          "id": "fiber_foods",
          "name_bn": "শাক, সবজি ও ফল",
          "name_en": "Greens, vegetables and fruit",
          "amount_en": "Vegetables 3 cups total + fruit 2 servings",
          "amount_bn": "মোট ৩ কাপ সবজি + ২ পরিবেশন ফল",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "fiber",
            "vitamins",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলা",
            "পেয়ারা",
            "লাউ",
            "ঢেঁড়স"
          ],
          "prep_tip_en": "Useful if constipation or discomfort increases.",
          "prep_tip_bn": "কোষ্ঠকাঠিন্য বা অস্বস্তি বাড়লে উপকারী।"
        },
        {
          "id": "water",
          "name_bn": "পানি",
          "name_en": "Water",
          "amount_en": "9-10 glasses",
          "amount_bn": "৯-১০ গ্লাস",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "hydration"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [],
          "prep_tip_en": "Use safe water.",
          "prep_tip_bn": "নিরাপদ পানি পান করুন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৮ম মাস: আরাম, ক্যালসিয়াম ও আঁশ: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    },
    {
      "type": "stage",
      "month": "9",
      "month_bn": "৯ম মাস",
      "weeks_range": "36-40",
      "stage_label_en": "Month 9: late pregnancy practical eating",
      "stage_label_bn": "৯ম মাস: প্রসবের আগে সহজ ও পুষ্টিকর খাবার",
      "daily_energy_note_en": "Keep nutrient-dense foods but make meals easier to finish.",
      "daily_energy_note_bn": "পুষ্টিকর খাবার বজায় রাখুন, তবে খাবার যেন সহজে খাওয়া যায় সেভাবে ভাগ করুন।",
      "daily_foods": [
        {
          "id": "soft_staple",
          "name_bn": "ভাত / রুটি / নরম খিচুড়ি",
          "name_en": "Rice / roti / soft khichuri",
          "amount_en": "Total 5.5-6 cups rice-equivalent, divided into smaller portions",
          "amount_bn": "সারা দিনে মোট ৫.৫-৬ কাপ ভাত-সমপরিমাণ খাবার, ছোট ভাগে",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "সবজি-ডাল খিচুড়ি"
          ],
          "prep_tip_en": "Soft khichuri can be easier late in pregnancy.",
          "prep_tip_bn": "শেষের দিকে নরম খিচুড়ি খেতে সুবিধা হতে পারে।"
        },
        {
          "id": "dal",
          "name_bn": "ডাল",
          "name_en": "Dal",
          "amount_en": "1 cup",
          "amount_bn": "১ কাপ",
          "frequency_en": "2 times/day",
          "frequency_bn": "দিনে ২ বার",
          "nutrient_focus": [
            "protein",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মসুর",
            "ছোলা"
          ],
          "prep_tip_en": "Keep dal with lunch and dinner.",
          "prep_tip_bn": "দুপুর ও রাতের খাবারে ডাল রাখুন।"
        },
        {
          "id": "egg_fish",
          "name_bn": "ডিম / মাছ",
          "name_en": "Egg / fish",
          "amount_en": "1 egg daily + fish 1 serving daily or at least 5 days/week",
          "amount_bn": "প্রতিদিন ১টি ডিম + মাছ ১ পরিবেশন প্রতিদিন বা সপ্তাহে অন্তত ৫ দিন",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "calcium"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডাল",
            "ছোলা"
          ],
          "prep_tip_en": "Keep protein even if appetite is low.",
          "prep_tip_bn": "ক্ষুধা কম থাকলেও প্রোটিন রাখুন।"
        },
        {
          "id": "veg_fruit",
          "name_bn": "শাক-সবজি ও ফল",
          "name_en": "Vegetables and fruit",
          "amount_en": "Leafy greens 1 cup + other vegetables 2 cups + fruit 2 servings",
          "amount_bn": "শাক ১ কাপ + অন্যান্য সবজি ২ কাপ + ফল ২ পরিবেশন",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "iron",
            "fiber",
            "vitamins"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "কলা",
            "পেয়ারা",
            "লাউ",
            "কুমড়া"
          ],
          "prep_tip_en": "Choose soft cooked vegetables if appetite is low.",
          "prep_tip_bn": "ক্ষুধা কম হলে নরম রান্না করা সবজি বেছে নিন।"
        },
        {
          "id": "milk_curd",
          "name_bn": "দুধ / দই",
          "name_en": "Milk / curd",
          "amount_en": "1 cup milk or 1/2-1 cup curd",
          "amount_bn": "১ কাপ দুধ বা ১/২-১ কাপ দই",
          "frequency_en": "daily if possible",
          "frequency_bn": "সম্ভব হলে প্রতিদিন",
          "nutrient_focus": [
            "calcium",
            "protein"
          ],
          "cost_level": "medium",
          "rural_affordable": true,
          "substitutions_bn": [
            "ছোট মাছ"
          ],
          "prep_tip_en": "Use between meals if full meals feel heavy.",
          "prep_tip_bn": "বড় খাবার ভারী লাগলে মাঝখানে খান।"
        },
        {
          "id": "water",
          "name_bn": "পানি",
          "name_en": "Water",
          "amount_en": "9-10 glasses",
          "amount_bn": "৯-১০ গ্লাস",
          "frequency_en": "daily",
          "frequency_bn": "প্রতিদিন",
          "nutrient_focus": [
            "hydration"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [],
          "prep_tip_en": "Keep safe drinking water ready near delivery time.",
          "prep_tip_bn": "প্রসবের সময় কাছাকাছি নিরাপদ পানি প্রস্তুত রাখুন।"
        }
      ],
      "weekly_low_cost_additions": [
        {
          "id": "small_fish_weekly",
          "name_bn": "ছোট মাছ",
          "name_en": "Small fish",
          "amount_en": "1 serving = 2-3 small fish or 1 palm-size piece",
          "amount_bn": "১ পরিবেশন = ২-৩টি ছোট মাছ বা ১ তালু-সমান টুকরা",
          "frequency_en": "5-6 times/week if available",
          "frequency_bn": "সম্ভব হলে সপ্তাহে ৫-৬ দিন",
          "nutrient_focus": [
            "protein",
            "calcium",
            "iron"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম",
            "ডাল"
          ],
          "prep_tip_en": "Frequent affordable fish is better than rare expensive fish.",
          "prep_tip_bn": "দামী মাছ কম খাওয়ার চেয়ে সস্তা মাছ নিয়মিত খাওয়া ভালো।"
        },
        {
          "id": "chola_weekly",
          "name_bn": "ছোলা / ভাজা চানা",
          "name_en": "Chickpea / roasted gram",
          "amount_en": "1 handful or 1 small bowl",
          "amount_bn": "১ মুঠো বা ১ ছোট বাটি",
          "frequency_en": "3-5 times/week",
          "frequency_bn": "সপ্তাহে ৩-৫ দিন",
          "nutrient_focus": [
            "protein",
            "iron",
            "energy"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "মুগ",
            "মটর",
            "ডাল"
          ],
          "prep_tip_en": "Good low-cost snack.",
          "prep_tip_bn": "কম খরচে ভালো নাস্তা।"
        },
        {
          "id": "khichuri_weekly",
          "name_bn": "সবজি-ডাল খিচুড়ি",
          "name_en": "Vegetable-lentil khichuri",
          "amount_en": "1-1.5 cups",
          "amount_bn": "১-১.৫ কাপ",
          "frequency_en": "1-2 times/week",
          "frequency_bn": "সপ্তাহে ১-২ দিন",
          "nutrient_focus": [
            "energy",
            "protein",
            "fiber"
          ],
          "cost_level": "low",
          "rural_affordable": true,
          "substitutions_bn": [
            "ডিম-খিচুড়ি",
            "মাছ-খিচুড়ি"
          ],
          "prep_tip_en": "Useful when curry ingredients are limited.",
          "prep_tip_bn": "তরকারির উপকরণ কম থাকলে উপকারী।"
        }
      ],
      "app_display_summary_bn": "৯ম মাস: প্রসবের আগে সহজ ও পুষ্টিকর খাবার: প্রতিদিন ভাত/রুটি, ডাল, শাক-সবজি, ডিম বা মাছ, স্থানীয় ফল এবং নিরাপদ পানি রাখুন।",
      "cautions_bn": [
        "শুধু ভাত বা চা-বিস্কুটে খাবার সীমাবদ্ধ করবেন না।",
        "অপরিষ্কার পানি, বাসি খাবার, কাঁচা/আধা-সেদ্ধ ডিম-মাছ-মাংস এড়িয়ে চলুন।",
        "গ্রামের প্রচলিত ভুল ধারণার কারণে ডিম, মাছ, শাক বা ফল বাদ দেবেন না, যদি না ডাক্তার নিষেধ করেন।"
      ]
    }
  ],
  "symptom_based_guidance": [
    {
      "id": "nausea",
      "symptom_en": "Nausea or vomiting",
      "symptom_bn": "বমি বমি ভাব বা বমি",
      "recommendations": [
        {
          "en": "Eat small frequent meals instead of large meals.",
          "bn": "বড় খাবারের বদলে অল্প অল্প করে বারবার খান।"
        },
        {
          "en": "Try dry foods like muri, toast, or plain roti in the morning.",
          "bn": "সকালে মুড়ি, টোস্ট বা শুকনা রুটি খেতে পারেন।"
        },
        {
          "en": "Drink safe water in small sips.",
          "bn": "নিরাপদ পানি অল্প অল্প করে পান করুন।"
        }
      ],
      "danger_bn": "পানি বা খাবার কিছুই রাখতে না পারলে দ্রুত স্বাস্থ্যকর্মী/ডাক্তারের সাথে যোগাযোগ করুন।"
    },
    {
      "id": "constipation",
      "symptom_en": "Constipation",
      "symptom_bn": "কোষ্ঠকাঠিন্য",
      "recommendations": [
        {
          "en": "Increase vegetables, leafy greens, fruit, dal, and water.",
          "bn": "সবজি, শাক, ফল, ডাল ও পানি বাড়ান।"
        },
        {
          "en": "Guava, banana, vegetables, and dal can help.",
          "bn": "পেয়ারা, কলা, সবজি ও ডাল উপকারী হতে পারে।"
        }
      ],
      "danger_bn": "তীব্র পেটব্যথা বা রক্ত গেলে চিকিৎসা নিন।"
    },
    {
      "id": "anemia_risk",
      "symptom_en": "Possible anemia or weakness",
      "symptom_bn": "রক্তস্বল্পতা বা দুর্বলতার ঝুঁকি",
      "recommendations": [
        {
          "en": "Eat iron-rich foods: fish, egg, dal, chickpea, and leafy greens.",
          "bn": "আয়রনসমৃদ্ধ খাবার খান: মাছ, ডিম, ডাল, ছোলা ও শাক।"
        },
        {
          "en": "Add vitamin C foods like lemon, guava, amloki, tomato, or orange.",
          "bn": "লেবু, পেয়ারা, আমলকি, টমেটো বা কমলার মতো ভিটামিন C খাবার যোগ করুন।"
        },
        {
          "en": "Do not take tea immediately with meals or iron tablets.",
          "bn": "খাবার বা আয়রন ট্যাবলেটের সাথে সাথে চা খাবেন না।"
        }
      ],
      "danger_bn": "খুব দুর্বল লাগা, মাথা ঘোরা, শ্বাসকষ্ট বা অস্বাভাবিক ফ্যাকাশে লাগলে ANC/ডাক্তারের পরামর্শ নিন।"
    },
    {
      "id": "heartburn",
      "symptom_en": "Heartburn or heaviness",
      "symptom_bn": "বুক জ্বালা বা খাবার ভারী লাগা",
      "recommendations": [
        {
          "en": "Eat smaller meals and avoid lying down immediately after eating.",
          "bn": "অল্প করে খান এবং খাবারের পরপর শুয়ে পড়বেন না।"
        },
        {
          "en": "Avoid very oily and very spicy foods if they worsen symptoms.",
          "bn": "বেশি তেল-মসলাযুক্ত খাবারে সমস্যা বাড়লে তা কমান।"
        }
      ],
      "danger_bn": "তীব্র বুকব্যথা বা শ্বাসকষ্ট হলে জরুরি চিকিৎসা নিন।"
    },
    {
      "id": "high_bp_warning",
      "symptom_en": "High blood pressure warning signs",
      "symptom_bn": "উচ্চ রক্তচাপের সতর্ক লক্ষণ",
      "recommendations": [
        {
          "en": "Do not self-treat. Seek ANC/clinic review.",
          "bn": "নিজে নিজে চিকিৎসা করবেন না। ANC/ক্লিনিকে যোগাযোগ করুন।"
        },
        {
          "en": "Keep normal food intake but avoid excessive salt and packaged salty snacks.",
          "bn": "স্বাভাবিক খাবার খান, তবে অতিরিক্ত লবণ ও প্যাকেটজাত নোনতা খাবার কমান।"
        }
      ],
      "danger_bn": "প্রচণ্ড মাথাব্যথা, চোখে ঝাপসা দেখা, মুখ/হাত/পা বেশি ফোলা, খিঁচুনি বা উচ্চ রক্তচাপ হলে জরুরি চিকিৎসা নিন।"
    }
  ]
};

export function getMonthlyPlan(gestationalWeek: number): MonthlyPlan | null {
  const plans = NUTRITION_DATA.monthly_nutrition_plan as MonthlyPlan[];
  return (
    plans.find((plan) => {
      const [start, end] = plan.weeks_range.split("-").map(Number);
      return gestationalWeek >= start && gestationalWeek <= end;
    }) ?? null
  );
}

export function getFoodsByCategory(
  plan: MonthlyPlan,
  category: "খাবার" | "পানীয়" | "ওষুধ" | "বিশ্রাম" | "সব"
): NutritionFood[] {
  if (category === "সব") {
    return plan.daily_foods;
  }

  const categoryMap: Record<string, string[]> = {
    খাবার: ["energy", "protein", "iron", "folate", "vitamin A", "vitamins", "calcium", "fiber"],
    পানীয়: ["hydration"],
    ওষুধ: [],
    বিশ্রাম: []
  };

  const nutrients = categoryMap[category] ?? [];
  if (nutrients.length === 0) {
    return [];
  }

  return plan.daily_foods.filter((food) => food.nutrient_focus.some((nutrient) => nutrients.includes(nutrient)));
}

export const GLOBAL_DAILY_RULES = NUTRITION_DATA.global_daily_rules;
export const SUPPLEMENT_GUIDANCE = NUTRITION_DATA.supplement_guidance as SupplementGuidance[];
export const SYMPTOM_GUIDANCE = NUTRITION_DATA.symptom_based_guidance as SymptomGuidance[];
