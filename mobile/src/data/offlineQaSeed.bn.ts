import type { OfflineQa } from "@/types/schema";

type OfflineQaSeedRow = Omit<OfflineQa, "id">;

const QA_ROWS: OfflineQaSeedRow[] = [
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "গর্ভাবস্থায় রক্ত গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: গর্ভাবস্থায় রক্ত যাওয়া বিপদের লক্ষণ। কাপড়ে রক্ত কম হলেও অপেক্ষা করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "জরুরি_লক্ষণ",
    question_bn: "গর্ভের শুরুর দিকে রক্তের দাগ দেখলে কী করব?",
    answer_bn: "⚠️ জরুরি: রক্তের দাগও অবহেলা করবেন না। পেট ব্যথা থাকুক বা না থাকুক দ্রুত সাহায্য দরকার। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "জরুরি_লক্ষণ",
    question_bn: "মাঝামাঝি সময়ে রক্তক্ষরণ হলে কী করব?",
    answer_bn: "⚠️ জরুরি: এই সময় রক্তক্ষরণ মা ও শিশুর জন্য ঝুঁকির লক্ষণ। বাড়িতে বসে দেখার চেষ্টা করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "জরুরি_লক্ষণ",
    question_bn: "শেষ দিকে বেশি রক্ত গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: শেষ দিকে বেশি রক্ত যাওয়া খুব বিপদের লক্ষণ। পরিষ্কার কাপড় ব্যবহার করুন এবং দেরি করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "রক্তের সঙ্গে মাথা ঘোরা থাকলে কী করব?",
    answer_bn: "⚠️ জরুরি: রক্ত যাওয়ার সঙ্গে মাথা ঘোরা শরীর দুর্বল হয়ে যাওয়ার লক্ষণ হতে পারে। রোগীকে শুইয়ে রাখুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "গর্ভাবস্থায় খিঁচুনি হলে কী করব?",
    answer_bn: "⚠️ জরুরি: খিঁচুনি হলে মাকে পাশে কাত করে শুইয়ে দিন। মুখে কিছু দেবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "মা অজ্ঞান হয়ে গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: অজ্ঞান হওয়া গর্ভাবস্থায় গুরুতর বিপদের লক্ষণ। শ্বাস চলছে কি না খেয়াল করুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "উচ্চ রক্তচাপের সঙ্গে খুব মাথা ব্যথা হলে কী করব?",
    answer_bn: "⚠️ জরুরি: উচ্চ রক্তচাপের সঙ্গে খুব মাথা ব্যথা বিপদের লক্ষণ। আলো ঝলকানো বা বমি থাকলেও অপেক্ষা করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "চোখে ঝাপসা দেখা আর হাত মুখ ফুলে গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: চোখে ঝাপসা দেখা ও ফুলে যাওয়া উচ্চ রক্তচাপের বিপদের লক্ষণ হতে পারে। একা থাকবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "মুখ আর চোখ হঠাৎ ফুলে গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: মুখ আর চোখ হঠাৎ ফুলে গেলে শরীরে বিপদের সংকেত হতে পারে। মাথা ব্যথা থাকলে ঝুঁকি আরও বেশি। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "গর্ভাবস্থায় জ্বর আর কাঁপুনি হলে কী করব?",
    answer_bn: "⚠️ জরুরি: জ্বরের সঙ্গে কাঁপুনি সংক্রমণের গুরুতর লক্ষণ হতে পারে। পানি পান করান কিন্তু দেরি করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "জ্বরের সঙ্গে দুর্গন্ধযুক্ত স্রাব হলে কী করব?",
    answer_bn: "⚠️ জরুরি: জ্বর ও দুর্গন্ধযুক্ত স্রাব সংক্রমণের বিপদের লক্ষণ। নিজে নিজে ওষুধ খাবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "বাচ্চা কয়েক ঘণ্টা নড়ছে না, কী করব?",
    answer_bn: "⚠️ জরুরি: বাচ্চা কয়েক ঘণ্টা না নড়লে অপেক্ষা করা ঠিক নয়। মাকে পাশে কাত করে রাখুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "আগের চেয়ে বাচ্চার নড়াচড়া হঠাৎ কমে গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: নড়াচড়া হঠাৎ কমে যাওয়া শিশুর কষ্টের লক্ষণ হতে পারে। বাড়িতে অপেক্ষা করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "জরুরি_লক্ষণ",
    question_bn: "সময়ের আগে পানি ভেঙে গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: সময়ের আগে পানি ভেঙে গেলে সংক্রমণ ও শিশুর ঝুঁকি বাড়ে। পরিষ্কার কাপড় ব্যবহার করুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "পানি ভাঙার পর সবুজ বা দুর্গন্ধযুক্ত পানি এলে কী করব?",
    answer_bn: "⚠️ জরুরি: সবুজ বা দুর্গন্ধযুক্ত পানি শিশুর কষ্ট বা সংক্রমণের লক্ষণ হতে পারে। কোনো কিছু ভেতরে দেবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "সাত মাসের আগে প্রসব ব্যথা উঠলে কী করব?",
    answer_bn: "⚠️ জরুরি: সময়ের আগে নিয়মিত ব্যথা উঠলে শিশুর ঝুঁকি হতে পারে। ব্যথা কমার অপেক্ষা করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "ব্যথার সঙ্গে পানি আর রক্ত গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: ব্যথা, পানি, ও রক্ত একসঙ্গে গেলে দ্রুত প্রসব বা জটিলতার লক্ষণ হতে পারে। প্রস্তুতি নিয়ে দেরি করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "তীব্র পেট ব্যথার সঙ্গে রক্ত গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: তীব্র পেট ব্যথা ও রক্ত যাওয়া খুব বিপদের লক্ষণ। মাকে হাঁটাচলা করাবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "শ্বাস নিতে খুব কষ্ট হলে কী করব?",
    answer_bn: "⚠️ জরুরি: শ্বাসকষ্ট বেশি হলে মা ও শিশুর অক্সিজেনের সমস্যা হতে পারে। মাকে বসিয়ে রাখুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "বুক ব্যথা আর ঘাম হলে কী করব?",
    answer_bn: "⚠️ জরুরি: বুক ব্যথা ও ঘাম গুরুতর সংকেত হতে পারে। নিজে নিজে কোনো ওষুধ দেবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "মা খুব দুর্বল হয়ে কথা বলতে না পারলে কী করব?",
    answer_bn: "⚠️ জরুরি: খুব দুর্বল হয়ে কথা বলতে না পারা গুরুতর অসুস্থতার লক্ষণ। পরিবারকে ডাকুন এবং রওনা দিন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর বেশি রক্ত গেলে কী করব?",
    answer_bn: "⚠️ জরুরি: প্রসবের পর বেশি রক্ত যাওয়া মায়ের জীবনের জন্য বিপজ্জনক। কাপড় বারবার ভিজলে দেরি করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর বড় রক্তের চাকা বের হলে কী করব?",
    answer_bn: "⚠️ জরুরি: বড় রক্তের চাকা বের হওয়া বেশি রক্তক্ষরণের লক্ষণ হতে পারে। মাকে শুইয়ে রাখুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর রক্তের সঙ্গে মাথা ঘুরলে কী করব?",
    answer_bn: "⚠️ জরুরি: রক্ত যাওয়ার সঙ্গে মাথা ঘোরা মায়ের শরীর দ্রুত দুর্বল হওয়ার লক্ষণ। পানি মুখে জোর করে দেবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "সংক্রমণ",
    question_bn: "প্রসবের পর জ্বর হলে কী করব?",
    answer_bn: "⚠️ জরুরি: প্রসবের পর জ্বর সংক্রমণের গুরুতর লক্ষণ হতে পারে। মাকে গরমে ঢেকে রাখবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "সংক্রমণ",
    question_bn: "প্রসবের পর স্রাবে দুর্গন্ধ হলে কী করব?",
    answer_bn: "⚠️ জরুরি: দুর্গন্ধযুক্ত স্রাব সংক্রমণের বিপদের লক্ষণ হতে পারে। পরিষ্কার কাপড় ব্যবহার করুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "জরুরি_লক্ষণ",
    question_bn: "প্রসবের পর খিঁচুনি হলে কী করব?",
    answer_bn: "⚠️ জরুরি: প্রসবের পর খিঁচুনি খুব গুরুতর বিপদের লক্ষণ। মাকে পাশে কাত করে রাখুন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "জরুরি_লক্ষণ",
    question_bn: "প্রসবের পর মা অজ্ঞান হলে কী করব?",
    answer_bn: "⚠️ জরুরি: প্রসবের পর অজ্ঞান হওয়া খুব বিপজ্জনক হতে পারে। পরিবারকে ডাকুন এবং দেরি করবেন না। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "স্তন লাল ফুলে জ্বর হলে কী করব?",
    answer_bn: "⚠️ জরুরি: স্তন লাল ফুলে জ্বর হলে গুরুতর সংক্রমণ হতে পারে। শিশুকে দুধ খাওয়ানো নিয়ে স্বাস্থ্যকর্মীর সাহায্য নিন। এখনই হাসপাতালে যান।",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "রক্তচাপ বেশি হলে কী করব?",
    answer_bn: "রক্তচাপ বেশি হলে বিশ্রাম নিন এবং আবার মাপুন। মাথা ব্যথা, চোখে ঝাপসা দেখা, বা শরীর ফুললে বিপদ হতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "বারবার রক্তচাপ বেশি দেখালে কী করব?",
    answer_bn: "একবার নয়, বারবার বেশি দেখালে বিষয়টি গুরুত্বের। লবণ কম খান, বিশ্রাম নিন, এবং নিজের সিদ্ধান্তে ওষুধ খাবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "রক্তচাপ বেশি কিন্তু মাথা ব্যথা নেই, তবু কি জানাব?",
    answer_bn: "হ্যাঁ, মাথা ব্যথা না থাকলেও রক্তচাপ বেশি থাকা ঝুঁকির লক্ষণ হতে পারে। নিয়মিত মাপা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "হাত পা ফুললে রক্তচাপ মাপা দরকার কি?",
    answer_bn: "হাত পা ফুললে রক্তচাপ মাপা দরকার। মুখ ফুলে যাওয়া বা মাথা ব্যথা থাকলে আরও সতর্ক হতে হবে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "শেষ দিকে রক্তচাপ বাড়লে কী করব?",
    answer_bn: "শেষ দিকে রক্তচাপ বাড়লে মা ও শিশুর নজরদারি দরকার। বেশি কাজ বন্ধ করে বিশ্রাম নিন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "সব সময় দুর্বল লাগলে কী করব?",
    answer_bn: "দুর্বল লাগা রক্ত কমে যাওয়া বা খাবার কম খাওয়ার কারণে হতে পারে। আয়রনসমৃদ্ধ খাবার খান এবং পরীক্ষা দরকার হতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "মুখ ফ্যাকাশে আর মাথা ঘোরে, কী করব?",
    answer_bn: "মুখ ফ্যাকাশে ও মাথা ঘোরা রক্তশূন্যতার লক্ষণ হতে পারে। বিশ্রাম নিন, পুষ্টিকর খাবার খান, এবং পরীক্ষা করান। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "শ্বাসকষ্টের সঙ্গে দুর্বল লাগলে কী করব?",
    answer_bn: "শ্বাসকষ্ট ও দুর্বলতা রক্ত কমে যাওয়া বা অন্য সমস্যার কারণে হতে পারে। কাজ বন্ধ করে বসে পড়ুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "রক্ত বাড়াতে কী খাব?",
    answer_bn: "ডাল, শাক, ডিম, মাছ, কলিজা, ছোলা, খেজুর, এবং লেবু জাতীয় ফল খেতে পারেন। ট্যাবলেট দরকার কি না জানতে হবে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "আয়রন ট্যাবলেট খেলে বমি লাগে, কী করব?",
    answer_bn: "নিজে থেকে ট্যাবলেট বন্ধ করবেন না। কখন খেলে সহ্য হয় তা স্বাস্থ্যকর্মী বুঝিয়ে দিতে পারেন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "সত্যিকারের প্রসব ব্যথা কীভাবে বুঝব?",
    answer_bn: "সত্যিকারের ব্যথা নিয়মিত আসে, ধীরে ধীরে বাড়ে, এবং বিশ্রামে কমে না। পানি ভাঙা বা রক্তমিশ্রিত স্রাব থাকলে প্রস্তুতি নিন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "মিথ্যা প্রসব ব্যথা কেমন হয়?",
    answer_bn: "মিথ্যা ব্যথা অনেক সময় অনিয়মিত হয় এবং বিশ্রামে কমে যেতে পারে। তবু পানি, রক্ত, বা ব্যথা বাড়লে অবহেলা করবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "প্রসবের জন্য কখন হাসপাতালে যাব?",
    answer_bn: "নিয়মিত ব্যথা, পানি ভাঙা, রক্তমিশ্রিত স্রাব, বা বাচ্চা কম নড়লে হাসপাতালে যাওয়ার প্রস্তুতি নিন। দূরের পথ হলে আগে বের হওয়া ভালো। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "পেট শক্ত হয়ে আবার নরম হলে কী করব?",
    answer_bn: "শেষ দিকে পেট শক্ত হয়ে আবার নরম হতে পারে। সময়ের ব্যবধান কমে গেলে বা ব্যথা বাড়লে প্রসব শুরু হতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "কোমর থেকে ব্যথা শুরু হলে কী করব?",
    answer_bn: "কোমর থেকে পেটে ছড়ানো নিয়মিত ব্যথা প্রসবের লক্ষণ হতে পারে। ব্যাগ প্রস্তুত রাখুন এবং একা থাকবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "রক্তমিশ্রিত স্রাব হলে কী করব?",
    answer_bn: "প্রসবের আগে হালকা রক্তমিশ্রিত স্রাব হতে পারে। কিন্তু রক্ত বেশি হলে জরুরি। বিষয়টি যাচাই করা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "পানি ভেঙেছে কিন্তু ব্যথা নেই, কী করব?",
    answer_bn: "পানি ভাঙলে সংক্রমণের ঝুঁকি থাকে। ব্যথা না থাকলেও পরিষ্কার কাপড় ব্যবহার করুন এবং দেরি করবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর কোন লক্ষণে দ্রুত সাহায্য দরকার?",
    answer_bn: "বেশি রক্ত, জ্বর, দুর্গন্ধযুক্ত স্রাব, খিঁচুনি, অজ্ঞান হওয়া, বা শ্বাসকষ্ট হলে দ্রুত সাহায্য দরকার। পরিবারকে বিষয়টি জানিয়ে রাখুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর পেটের নিচে ব্যথা হলে কী করব?",
    answer_bn: "হালকা ব্যথা হতে পারে, কিন্তু ব্যথা বাড়লে বা জ্বর থাকলে পরীক্ষা দরকার। পরিষ্কার-পরিচ্ছন্ন থাকুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর প্রস্রাবে জ্বালা হলে কী করব?",
    answer_bn: "প্রস্রাবে জ্বালা সংক্রমণের লক্ষণ হতে পারে। বেশি পানি পান করুন, কিন্তু পরীক্ষা ছাড়া নিজে ওষুধ খাবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর সেলাইয়ে ব্যথা হলে কী করব?",
    answer_bn: "সেলাইয়ের জায়গা পরিষ্কার ও শুকনা রাখুন। ব্যথা বাড়লে, পুঁজ বের হলে, বা জ্বর হলে পরীক্ষা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "প্রস্রাবে জ্বালা হলে কী করব?",
    answer_bn: "প্রস্রাবে জ্বালা মূত্রনালির সংক্রমণের লক্ষণ হতে পারে। বেশি পানি পান করুন এবং প্রস্রাব চেপে রাখবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "প্রস্রাব কম আর গাঢ় হলে কী করব?",
    answer_bn: "শরীরে পানি কমে গেলে প্রস্রাব কম ও গাঢ় হতে পারে। বমি বা জ্বর থাকলে ঝুঁকি বাড়ে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "সাদা স্রাবের সঙ্গে চুলকানি হলে কী করব?",
    answer_bn: "চুলকানি ও স্রাব সংক্রমণ বা জ্বালার কারণে হতে পারে। জায়গা পরিষ্কার রাখুন এবং নিজে কোনো ওষুধ ব্যবহার করবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "কাশি জ্বর থাকলে কী করব?",
    answer_bn: "কাশি জ্বর থাকলে বিশ্রাম নিন, পানি পান করুন, এবং অন্যদের থেকে একটু দূরে থাকুন। শ্বাসকষ্ট বা জ্বর বেশি হলে পরীক্ষা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "জ্বর থাকলে নিজে ওষুধ খেতে পারি?",
    answer_bn: "গর্ভাবস্থায় নিজে ওষুধ খাওয়া ঠিক নয়। জ্বরের কারণ জানা দরকার। পানি পান করুন ও বিশ্রাম নিন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "তলপেটে ব্যথা থাকলে কী করব?",
    answer_bn: "হালকা টান লাগতে পারে, কিন্তু তীব্র ব্যথা বা রক্ত থাকলে ঝুঁকি থাকে। বিশ্রাম নিন এবং লক্ষণ খেয়াল করুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "পিঠের ব্যথা খুব বাড়লে কী করব?",
    answer_bn: "পিঠে ব্যথা সাধারণ হতে পারে, তবে ব্যথা খুব বাড়লে বা জ্বর থাকলে পরীক্ষা দরকার। ভারী কাজ বন্ধ করুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "মাথা ব্যথা বারবার হলে কী করব?",
    answer_bn: "বারবার মাথা ব্যথা হলে রক্তচাপ মাপা দরকার। চোখে ঝাপসা দেখা বা ফুলে যাওয়া থাকলে ঝুঁকি বেশি। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "বাচ্চার নড়াচড়া কম মনে হলে কী করব?",
    answer_bn: "বামে কাত হয়ে কিছুক্ষণ বিশ্রাম নিন এবং নড়াচড়া খেয়াল করুন। আগের চেয়ে কম থাকলে পরীক্ষা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "শেষ দিকে নড়াচড়া গুনব কেন?",
    answer_bn: "নড়াচড়া শিশুর ভালো থাকার একটি সহজ সংকেত। প্রতিদিন একই সময়ে খেয়াল করলে পরিবর্তন বোঝা যায়। কম মনে হলে স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর মন খুব খারাপ থাকলে কী করব?",
    answer_bn: "প্রসবের পর মন খারাপ হতে পারে, কিন্তু দীর্ঘদিন থাকলে সাহায্য দরকার। শিশুর যত্ন নিতে কষ্ট হলে একা থাকবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "নিজেকে বা শিশুকে ক্ষতি করার চিন্তা এলে কী করব?",
    answer_bn: "এমন চিন্তা এলে একা থাকবেন না এবং পরিবারের কাউকে বলুন। এটি সাহায্য নেওয়ার সময়। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "খুব বেশি দুর্বল লাগলে কী করব?",
    answer_bn: "খুব বেশি দুর্বল লাগলে খাবার, পানি, রক্তশূন্যতা, বা অন্য সমস্যার কারণে হতে পারে। বিশ্রাম নিন এবং পরীক্ষা দরকার হতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "শরীর খুব ফুলে গেলে কী করব?",
    answer_bn: "শরীর খুব ফুলে গেলে রক্তচাপ মাপা দরকার। মুখ, হাত, চোখ ফুললে বিশেষ সতর্ক হন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "খাবার খেতে না পারলে কী করব?",
    answer_bn: "অল্প অল্প করে বারবার খাবার চেষ্টা করুন। ওজন কমে গেলে বা দুর্বলতা বাড়লে শরীরের শক্তি কমতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "দিনে অনেকবার বমি হলে কী করব?",
    answer_bn: "দিনে অনেকবার বমি হলে শরীরের পানি কমে যেতে পারে। অল্প অল্প পানি পান করুন, কিন্তু পানি না থাকলে পরীক্ষা দরকার। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "বমির কারণে প্রস্রাব কমে গেলে কী করব?",
    answer_bn: "প্রস্রাব কমে যাওয়া শরীরে পানি কমার লক্ষণ হতে পারে। মুখ শুকিয়ে গেলে বা মাথা ঘুরলে দেরি করবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "বমির সঙ্গে জ্বর থাকলে কী করব?",
    answer_bn: "বমির সঙ্গে জ্বর থাকলে সংক্রমণ বা শরীরের পানি কমার ঝুঁকি থাকতে পারে। বিশ্রাম নিন এবং পানি পান করুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "ওজন না বাড়লে কী করব?",
    answer_bn: "ওজন না বাড়লে খাবারের পরিমাণ ও মান দেখতে হবে। ডাল, ডিম, মাছ, শাক, ফল, ও ভাত বা রুটি নিয়মিত খান। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "খুব কম খেলে শিশুর ক্ষতি হবে কি?",
    answer_bn: "মায়ের খাবার কম হলে মা দুর্বল হতে পারেন এবং শিশুর বাড়তেও সমস্যা হতে পারে। ঘরের পুষ্টিকর খাবার বাড়ান। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "সকালে বমি বমি ভাব হলে কী করব?",
    answer_bn: "সকালে উঠে শুকনা খাবার খান। অল্প অল্প করে বারবার খাবার খান। বেশি তেলযুক্ত বা ঝাল খাবার এড়িয়ে চলুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "খালি পেটে বমি লাগে, কী করব?",
    answer_bn: "খালি পেটে থাকবেন না। বিছানা থেকে ওঠার আগে একটু শুকনা খাবার খেতে পারেন। পানি অল্প অল্প করে পান করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "রান্নার গন্ধে বমি এলে কী করব?",
    answer_bn: "গন্ধ বেশি লাগলে রান্নার জায়গা থেকে একটু দূরে থাকুন। জানালা খুলে বাতাস ঢুকতে দিন। অল্প অল্প সহজ খাবার খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "টক খেতে ইচ্ছা করলে কী করব?",
    answer_bn: "পরিষ্কার ও নিরাপদ টক ফল অল্প খেতে পারেন। খুব বেশি টক বা অস্বাস্থ্যকর খাবার খাবেন না। পেট ব্যথা হলে খাওয়া বন্ধ করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "ভাত খেতে না পারলে কী খাব?",
    answer_bn: "ভাত না পারলে রুটি, স্যুপ, কলা, ডাল, বা নরম খাবার অল্প অল্প করে খান। পানি পান করতে ভুলবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "বমির সময় পানি কীভাবে খাব?",
    answer_bn: "একবারে বেশি পানি খাবেন না। অল্প অল্প করে বারবার পান করুন। ডাবের পানি বা স্যালাইন জাতীয় নিরাপদ তরল নিতে পারেন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "রাতে বমি বমি লাগলে কী করব?",
    answer_bn: "রাতে খুব খালি পেটে ঘুমাবেন না। হালকা খাবার খেয়ে শুতে পারেন। তেল মসলা কম রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "বমি_বমি_ভাব",
    question_bn: "মুখে স্বাদ বদলে গেলে কী করব?",
    answer_bn: "গর্ভের শুরুতে মুখের স্বাদ বদলাতে পারে। মুখ পরিষ্কার রাখুন, অল্প অল্প পানি পান করুন, এবং সহজ খাবার খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "মাসিক বন্ধ হলে কী করব?",
    answer_bn: "মাসিক বন্ধ হলে গর্ভধারণের পরীক্ষা করুন। ফল ভালোভাবে বুঝতে স্বাস্থ্যকর্মীর সাহায্য নিন। প্রথম চেকআপের তারিখ ঠিক করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T1",
    week_range: "1-13",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "স্তন ভারী বা ব্যথা হলে কী করব?",
    answer_bn: "গর্ভের শুরুতে স্তন ভারী বা ব্যথা হতে পারে। আরামদায়ক কাপড় পরুন। জায়গা পরিষ্কার রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "বারবার প্রস্রাব হওয়া কি স্বাভাবিক?",
    answer_bn: "গর্ভাবস্থায় বারবার প্রস্রাব হতে পারে। পানি কমাবেন না। প্রস্রাব চেপে রাখবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "হালকা সাদা স্রাব হলে কী করব?",
    answer_bn: "হালকা সাদা স্রাব অনেক সময় স্বাভাবিক। পরিষ্কার শুকনা কাপড় ব্যবহার করুন। দুর্গন্ধ বা চুলকানি আছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ঘুম বেশি পেলে কী করব?",
    answer_bn: "গর্ভাবস্থায় বেশি ঘুম পেতে পারে। দিনে বিশ্রাম নিন, কিন্তু খাবার ও পানি ঠিক রাখুন। খুব দুর্বল লাগলে খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "মেজাজ বদলে গেলে কী করব?",
    answer_bn: "গর্ভাবস্থায় মন ও মেজাজ বদলাতে পারে। পরিবারের সঙ্গে কথা বলুন। বিশ্রাম, খাবার, ও ঘুম ঠিক রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "হালকা মাথা ঘুরলে কী করব?",
    answer_bn: "ধীরে বসুন বা শুয়ে পড়ুন। পানি পান করুন এবং খালি পেটে থাকবেন না। হঠাৎ উঠে দাঁড়াবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "বুক জ্বালা করলে কী করব?",
    answer_bn: "অল্প অল্প করে খাবার খান। খাওয়ার পর সঙ্গে সঙ্গে শুয়ে পড়বেন না। তেল মসলা কম খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "কোষ্ঠকাঠিন্য হলে কী করব?",
    answer_bn: "পানি বেশি পান করুন। শাকসবজি, ফল, ডাল, এবং আঁশযুক্ত খাবার খান। প্রতিদিন হালকা হাঁটুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "গর্ভাবস্থায় কী ধরনের খাবার খাব?",
    answer_bn: "ভাত বা রুটি, ডাল, ডিম, মাছ, শাকসবজি, ফল, ও দুধজাত খাবার খান। এক ধরনের খাবারে আটকে থাকবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "ডিম খাওয়া যাবে?",
    answer_bn: "ভালোভাবে রান্না করা ডিম খেতে পারেন। আধা সেদ্ধ বা কাঁচা ডিম খাবেন না। খাবার পরিষ্কার রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "মাছ খাওয়া যাবে?",
    answer_bn: "ভালোভাবে রান্না করা মাছ খাওয়া ভালো। পচা বা কাঁচা মাছ খাবেন না। কাঁটা সাবধানে বেছে খাবেন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "দুধ না পেলে কী খাব?",
    answer_bn: "দুধ না পেলে ডিম, ডাল, ছোট মাছ, শাকসবজি, বাদাম, ও পুষ্টিকর ঘরের খাবার খান। খাবারে বৈচিত্র্য রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "শাকসবজি কেন দরকার?",
    answer_bn: "শাকসবজিতে শরীরের দরকারি পুষ্টি থাকে। এগুলো রক্ত, হজম, ও শক্তির জন্য ভালো। ভালোভাবে ধুয়ে রান্না করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "ফল কতটা খাব?",
    answer_bn: "পরিষ্কার ফল প্রতিদিন অল্প করে খেতে পারেন। মৌসুমি ফল ভালো। কাটার আগে ভালোভাবে ধুয়ে নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "ঝাল খাবার খাওয়া যাবে?",
    answer_bn: "কম ঝাল খেতে পারেন যদি পেটে সমস্যা না হয়। বেশি ঝাল বুক জ্বালা বা অস্বস্তি বাড়াতে পারে। পরিমিত খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "বাইরের খাবার খাওয়া যাবে?",
    answer_bn: "বাইরের খাবার কম খাওয়াই ভালো। পরিষ্কার নয় এমন খাবারে পেটের সমস্যা হতে পারে। ঘরের টাটকা খাবার বেছে নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "পানি কতটা পান করব?",
    answer_bn: "দিনে বারবার পানি পান করুন। প্রস্রাব খুব গাঢ় হলে পানি কম হতে পারে। পরিষ্কার নিরাপদ পানি পান করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "চা খেলে সমস্যা হবে?",
    answer_bn: "চা কম পান করুন। খাবারের সঙ্গে সঙ্গে চা না খাওয়াই ভালো। এতে রক্ত বাড়ার খাবারের উপকার কমতে পারে।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "মিষ্টি বেশি খেলে কী সমস্যা?",
    answer_bn: "মিষ্টি বেশি খেলে ওজন ও রক্তের চিনি বাড়তে পারে। পরিমিত খান। ফল ও ঘরের খাবার বেশি বেছে নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "কোমর ব্যথা হলে কী করব?",
    answer_bn: "ভারী কাজ কমান। পাশে কাত হয়ে বিশ্রাম নিন। সোজা হয়ে বসুন এবং হঠাৎ ঝুঁকে কাজ করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "পেট টান টান লাগলে কী করব?",
    answer_bn: "গর্ভ বড় হলে পেটে টান লাগতে পারে। ধীরে চলাফেরা করুন। ব্যথা বাড়ছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "পায়ে টান ধরলে কী করব?",
    answer_bn: "পা ধীরে সোজা করুন। হালকা মালিশ করুন। পানি পান করুন এবং দীর্ঘক্ষণ একইভাবে বসে থাকবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "পা ফুলে গেলে কী করব?",
    answer_bn: "পা একটু উঁচু করে বিশ্রাম নিন। অনেকক্ষণ দাঁড়িয়ে থাকবেন না। মুখ বা হাত ফুলছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "গ্যাসে পেট ফুললে কী করব?",
    answer_bn: "অল্প অল্প করে খাবার খান। ধীরে হাঁটুন। বেশি তেল মসলা ও গ্যাস বাড়ায় এমন খাবার কম খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "হালকা মাথা ব্যথা হলে কী করব?",
    answer_bn: "শান্ত জায়গায় বিশ্রাম নিন। পানি পান করুন। রক্তচাপ মাপার সুযোগ থাকলে মাপুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "শেষ দিকে ঘুমাতে অস্বস্তি হলে কী করব?",
    answer_bn: "বামে কাত হয়ে শুতে চেষ্টা করুন। পায়ের মাঝে বালিশ রাখতে পারেন। রাতে খুব বেশি পানি একসঙ্গে খাবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "কখন বাচ্চার নড়াচড়া টের পাব?",
    answer_bn: "অনেক মা মাঝামাঝি সময় থেকে নড়াচড়া টের পান। প্রথমে খুব হালকা মনে হতে পারে। ধীরে ধীরে স্পষ্ট হয়।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "খাওয়ার পর বাচ্চা নড়লে কি স্বাভাবিক?",
    answer_bn: "খাওয়ার পর অনেক সময় বাচ্চার নড়াচড়া বেশি বোঝা যায়। এটি সাধারণত ভালো লক্ষণ। প্রতিদিনের ধরন খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "বাচ্চা রাতে বেশি নড়লে কী করব?",
    answer_bn: "রাতে বিশ্রামের সময় নড়াচড়া বেশি বোঝা যায়। যদি নড়াচড়া স্বাভাবিক থাকে তবে চিন্তার দরকার নেই। হঠাৎ কমে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "বাচ্চা এক পাশে বেশি নড়লে কী করব?",
    answer_bn: "বাচ্চা এক পাশে বেশি নড়তে পারে। মায়ের শরীরের ভঙ্গি বদলালে অনুভূতি বদলায়। নড়াচড়া কমে যাচ্ছে কি না দেখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "হাসপাতালের ব্যাগে কী রাখব?",
    answer_bn: "মায়ের কাপড়, শিশুর কাপড়, পরিষ্কার কাপড়, দরকারি কাগজ, টাকা, ফোন, ও স্বাস্থ্যকর্মীর নম্বর রাখুন। আগে থেকে গুছিয়ে রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "প্রসবের আগে যানবাহন কীভাবে ঠিক করব?",
    answer_bn: "পরিবারের সঙ্গে আগে কথা বলে যানবাহনের ব্যবস্থা রাখুন। রাতের সময় কাকে ডাকবেন ঠিক করুন। দরকারি নম্বর কাছে রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "প্রসবের সময় কাকে সঙ্গে নেব?",
    answer_bn: "বিশ্বাসযোগ্য একজন বড় মানুষকে সঙ্গে নিন। তিনি কাগজ, টাকা, ও যোগাযোগে সাহায্য করবেন। মাকে একা পাঠাবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "ঘরে প্রসবের প্রস্তুতি নেওয়া উচিত কি?",
    answer_bn: "সম্ভব হলে স্বাস্থ্যকেন্দ্র বা হাসপাতালে প্রসবের পরিকল্পনা করুন। জটিলতা হলে দ্রুত সাহায্য দরকার হয়। আগে থেকে পথ ঠিক রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "পেট বড় হওয়ার সঙ্গে চামড়া টানলে কী করব?",
    answer_bn: "পেট বড় হলে চামড়া টানতে পারে। পরিষ্কার রাখুন এবং আরামদায়ক কাপড় পরুন। বেশি চুলকালে নখ দিয়ে আঁচড়াবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T2",
    week_range: "14-27",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "মাঝামাঝি সময়ে ক্ষুধা বাড়লে কী করব?",
    answer_bn: "ক্ষুধা বাড়লে পুষ্টিকর খাবার ভাগ করে খান। শুধু ভাত নয়, ডাল, ডিম, মাছ, শাক, ও ফল রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "শেষ দিকে হাঁটতে কষ্ট হলে কী করব?",
    answer_bn: "শেষ দিকে শরীর ভারী লাগতে পারে। ধীরে হাঁটুন, বিশ্রাম নিন, এবং ভারী কাজ এড়ান। শ্বাসকষ্ট বাড়ছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "শেষ দিকে বারবার প্রস্রাব হলে কী করব?",
    answer_bn: "শেষ দিকে শিশুর চাপের কারণে বারবার প্রস্রাব হতে পারে। পানি পান কমাবেন না। প্রস্রাবে জ্বালা আছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ঘাম বেশি হলে কী করব?",
    answer_bn: "ঢিলা পরিষ্কার কাপড় পরুন। পানি পান করুন। বেশি গরমে কাজ কমান এবং বিশ্রাম নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "শিশুকে কখন বুকের দুধ দেব?",
    answer_bn: "শিশু জন্মের পর যত দ্রুত সম্ভব বুকের দুধ দিন। প্রথম হলুদ দুধ শিশুর জন্য খুব উপকারী। অন্য কিছু দেওয়ার দরকার নেই।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "প্রথম হলুদ দুধ কি ফেলে দেব?",
    answer_bn: "প্রথম হলুদ দুধ ফেলবেন না। এটি শিশুর শক্তি ও সুরক্ষার জন্য ভালো। শিশুকে মায়ের বুকে লাগান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "শিশু কতবার দুধ খাবে?",
    answer_bn: "শিশু চাইলে বারবার বুকের দুধ দিন। দিনে রাতে অনেকবার খাওয়া স্বাভাবিক। শিশুর মুখে স্তন ঠিকভাবে লাগছে কি না দেখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "দুধ কম মনে হলে কী করব?",
    answer_bn: "শিশুকে বারবার বুকে দিন। মা পর্যাপ্ত খাবার, পানি, ও বিশ্রাম নিন। শিশুর প্রস্রাব ও ওজন খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "স্তন শক্ত হয়ে গেলে কী করব?",
    answer_bn: "শিশুকে বারবার দুধ খাওয়ান। হালকা গরম কাপড় দিয়ে সেঁক দিতে পারেন। খুব ব্যথা বা জ্বর আছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "স্তনের বোঁটা ব্যথা হলে কী করব?",
    answer_bn: "শিশুর মুখে স্তন ঠিকভাবে লাগছে কি না দেখুন। দুধ খাওয়ানোর পর জায়গা পরিষ্কার ও শুকনা রাখুন। জোরে টানবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "শিশু দুধ খেতে ঘুমিয়ে পড়লে কী করব?",
    answer_bn: "শিশুকে আলতো করে জাগিয়ে আবার বুকে দিন। গাল বা পায়ে হালকা ছোঁয়া দিতে পারেন। জোর করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "শিশুকে পানি দেব কি?",
    answer_bn: "শুধু বুকের দুধই শিশুর জন্য যথেষ্ট। ছোট শিশুকে আলাদা পানি দেওয়ার দরকার নেই। গরমেও বুকের দুধ বারবার দিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর মা কী খাবেন?",
    answer_bn: "মা ভাত বা রুটি, ডাল, মাছ, ডিম, শাকসবজি, ফল, ও পানি খাবেন। দুধ খাওয়াতে শক্তি দরকার। খাবার কমাবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর কতদিন বিশ্রাম দরকার?",
    answer_bn: "প্রসবের পর মায়ের ভালো বিশ্রাম দরকার। ভারী কাজ করবেন না। পরিবারকে কাজ ভাগ করে নিতে বলুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর পরিষ্কার থাকা কেন দরকার?",
    answer_bn: "পরিষ্কার থাকলে সংক্রমণের ঝুঁকি কমে। পরিষ্কার কাপড় ব্যবহার করুন। হাত ধুয়ে শিশুকে ধরুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর রক্ত কতদিন যেতে পারে?",
    answer_bn: "প্রসবের পর কিছুদিন রক্ত বা স্রাব যেতে পারে। ধীরে ধীরে কমা উচিত। দুর্গন্ধ বা বেশি রক্ত আছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর গোসল করা যাবে?",
    answer_bn: "শরীরের অবস্থা ভালো থাকলে পরিষ্কার পানি দিয়ে গোসল করা যায়। ঠান্ডা লাগার মতো অবস্থায় বেশি সময় ভেজা থাকবেন না। জায়গা শুকনা রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "শিশুর নাভি কীভাবে পরিষ্কার রাখব?",
    answer_bn: "নাভি শুকনা ও পরিষ্কার রাখুন। তেল, ছাই, বা কোনো কিছু লাগাবেন না। হাত ধুয়ে শিশুকে ধরুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "নবজাতক ঠান্ডা না লাগে কী করব?",
    answer_bn: "শিশুকে শুকনা কাপড়ে জড়ান। মায়ের বুকে ত্বক লাগিয়ে রাখলে উষ্ণ থাকে। ভেজা কাপড় দ্রুত বদলান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "শিশু কম প্রস্রাব করলে কী খেয়াল করব?",
    answer_bn: "শিশু দুধ ঠিকমতো পাচ্ছে কি না খেয়াল করুন। বারবার বুকের দুধ দিন। শিশুর কান্না, ঘুম, ও প্রস্রাব দেখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর চেকআপ কেন দরকার?",
    answer_bn: "চেকআপে মায়ের রক্ত, জ্বর, সেলাই, দুধ, ও শিশুর অবস্থা দেখা যায়। সমস্যা না থাকলেও চেকআপ দরকার।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর পরিবার পরিকল্পনা কখন ভাবব?",
    answer_bn: "মা সুস্থ হওয়ার পর পরিবার পরিকল্পনা নিয়ে কথা বলা ভালো। মায়ের শরীর বিশ্রাম পেলে পরের গর্ভ নিরাপদ হয়।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর মায়ের ঘুম কম হলে কী করব?",
    answer_bn: "শিশু ঘুমালে মা-ও বিশ্রাম নিন। পরিবারের সাহায্য নিন। খাবার ও পানি ঠিক রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "প্রসবের পর কান্না পেলে কী করব?",
    answer_bn: "প্রসবের পর মন নরম হতে পারে। পরিবারের সঙ্গে কথা বলুন। বিশ্রাম নিন এবং একা সব কাজ করার চেষ্টা করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "মূত্রনালির সংক্রমণ এড়াতে কী করব?",
    answer_bn: "পর্যাপ্ত পানি পান করুন। প্রস্রাব চেপে রাখবেন না। সামনের দিক থেকে পেছনের দিকে পরিষ্কার করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "স্রাব হলে কীভাবে পরিষ্কার থাকব?",
    answer_bn: "পরিষ্কার শুকনা কাপড় ব্যবহার করুন। ভেজা কাপড় বদলান। সুগন্ধি বা রাসায়নিক কিছু ব্যবহার করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "হাত ধোয়া কেন দরকার?",
    answer_bn: "হাত ধুলে অনেক সংক্রমণ কমে। খাবার আগে, টয়লেটের পর, এবং শিশুকে ধরার আগে সাবান দিয়ে হাত ধুতে হবে।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "কাশি থাকলে শিশুকে কীভাবে রক্ষা করব?",
    answer_bn: "কাশির সময় মুখ ঢাকুন। হাত ধুয়ে শিশুকে ধরুন। খুব কাছ থেকে শিশুর মুখে কাশি দেবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "গর্ভাবস্থায় হালকা হাঁটা যাবে?",
    answer_bn: "শরীর ভালো থাকলে হালকা হাঁটা ভালো। খুব ক্লান্ত হলে থামুন। পিচ্ছিল বা অন্ধকার পথে হাঁটবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ভারী কাজ করা যাবে?",
    answer_bn: "ভারী জিনিস তোলা বা বেশি ঝুঁকে কাজ করা এড়ান। কাজ ভাগ করে নিন। শরীরের কথা শুনুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "দিনে বিশ্রাম দরকার কি?",
    answer_bn: "হ্যাঁ, দিনে কিছু সময় বিশ্রাম নিন। কাজের মাঝে বসুন। পর্যাপ্ত ঘুম ও খাবার শরীরকে শক্তি দেয়।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "রাতে ঘুম না হলে কী করব?",
    answer_bn: "ঘুমের আগে ভারী খাবার কম খান। শান্ত পরিবেশে শুয়ে পড়ুন। পাশে কাত হয়ে ঘুমালে আরাম হতে পারে।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "মন খারাপ থাকলে কী করব?",
    answer_bn: "বিশ্বাসের মানুষের সঙ্গে কথা বলুন। একা সব দায়িত্ব নেবেন না। বিশ্রাম, খাবার, ও ঘুম ঠিক রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ভয় বা দুশ্চিন্তা হলে কী করব?",
    answer_bn: "ভয় লাগলে স্বাস্থ্যকর্মী বা পরিবারের কাউকে বলুন। নিয়মিত চেকআপে গেলে অনেক প্রশ্নের উত্তর পাওয়া যায়। ধীরে শ্বাস নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "গর্ভাবস্থায় একা থাকা কি ঠিক?",
    answer_bn: "সম্ভব হলে জরুরি সময়ে ডাকার মতো কাউকে কাছে রাখুন। স্বাস্থ্যকর্মীর নম্বর লিখে রাখুন। প্রসবের সময়ের আগেই পরিকল্পনা করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "চেকআপে কী জানাব?",
    answer_bn: "রক্তচাপ, ওজন, রক্তশূন্যতা, শিশুর নড়াচড়া, ব্যথা, রক্ত, জ্বর, ও স্রাবের কথা বলুন। কোনো লক্ষণ লুকাবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ওষুধ খাওয়ার আগে কী করব?",
    answer_bn: "গর্ভাবস্থায় নিজে থেকে ওষুধ খাবেন না। আগে স্বাস্থ্যকর্মী বা ডাক্তারের পরামর্শ নিন। পুরনো প্রেসক্রিপশন ব্যবহার করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "টিকা বা চেকআপ মিস হলে কী করব?",
    answer_bn: "মিস হলে লজ্জা পাবেন না। কাছের স্বাস্থ্যকর্মীকে জানিয়ে নতুন তারিখ নিন। নিয়মিত চেকআপ মা ও শিশুকে নিরাপদ রাখে।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "ভ্রমণ করা যাবে?",
    answer_bn: "শরীর ভালো থাকলে ছোট ভ্রমণ করা যায়। দীর্ঘ পথ, ঝাঁকুনি, বা অসুস্থ লাগলে ভ্রমণ কমান। পানি ও খাবার সঙ্গে রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "গরমে কীভাবে সাবধানে থাকব?",
    answer_bn: "হালকা কাপড় পরুন, পানি পান করুন, এবং রোদে বেশি সময় থাকবেন না। মাথা ঘুরলে বসে বিশ্রাম নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "লোডশেডিংয়ে গরম লাগলে কী করব?",
    answer_bn: "বাতাস চলাচল করে এমন জায়গায় থাকুন। পানি পান করুন। ভেজা কাপড় পরে দীর্ঘ সময় থাকবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "পরিবার কীভাবে সাহায্য করবে?",
    answer_bn: "পরিবার ভারী কাজ কমিয়ে দেবে, খাবার ও বিশ্রামে সাহায্য করবে, এবং বিপদের লক্ষণ দেখলে দ্রুত ব্যবস্থা নেবে। মাকে একা দোষ দেবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "দিনে কয়বার খাব?",
    answer_bn: "একবারে বেশি না খেয়ে দিনে কয়েকবার অল্প করে খান। ভাত বা রুটির সঙ্গে ডাল, ডিম, মাছ, শাক, ও ফল রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "কম টাকায় পুষ্টিকর খাবার কীভাবে খাব?",
    answer_bn: "ডাল, ডিম, ছোট মাছ, শাক, ছোলা, কলা, ও মৌসুমি সবজি ভালো পুষ্টি দেয়। ঘরের খাবার পরিষ্কারভাবে রান্না করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "খাবারের সঙ্গে লেবু খাওয়া ভালো কি?",
    answer_bn: "লেবু জাতীয় টক ফল রক্ত বাড়ার খাবারের উপকারে সাহায্য করতে পারে। পরিষ্কার করে অল্প পরিমাণে খান।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "খাবার না পেলে কী আগে খাব?",
    answer_bn: "যা আছে তা ভাগ করে খান, কিন্তু শুধু চা বা পানি খেয়ে থাকবেন না। ভাত বা রুটির সঙ্গে ডাল, ডিম, বা শাক রাখার চেষ্টা করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "হাঁটলে পেটে টান লাগে, কী করব?",
    answer_bn: "ধীরে হাঁটুন এবং মাঝে মাঝে বসে বিশ্রাম নিন। ভারী কাজ কমান। ব্যথা বাড়ছে কি না খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "শরীর ব্যথা করলে কী করব?",
    answer_bn: "বিশ্রাম নিন, পানি পান করুন, এবং ভারী কাজ কমান। হালকা হাঁটা আরাম দিতে পারে। জ্বর আছে কি না দেখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "বসে উঠতে কষ্ট হলে কী করব?",
    answer_bn: "ধীরে পাশে কাত হয়ে উঠুন। হঠাৎ উঠে দাঁড়াবেন না। পাশে কাউকে রাখলে ভালো।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "নড়াচড়া কখন বেশি বোঝা যায়?",
    answer_bn: "মা শান্ত হয়ে বসলে বা শুলে নড়াচড়া বেশি বোঝা যায়। প্রতিদিন একই সময়ে খেয়াল করলে পরিবর্তন ধরা সহজ হয়।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "বাচ্চার নড়াচড়া গুনতে না পারলে কী করব?",
    answer_bn: "শান্ত জায়গায় বামে কাত হয়ে শুয়ে খেয়াল করুন। পরিবার বা স্বাস্থ্যকর্মীকে সঙ্গে নিয়ে বোঝার চেষ্টা করুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "পেট খারাপ হলে কী করব?",
    answer_bn: "পরিষ্কার পানি অল্প অল্প করে পান করুন। পাতলা পায়খানা বেশি হলে শরীরের পানি কমে যেতে পারে। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "চুলকানি বেশি হলে কী করব?",
    answer_bn: "জায়গা পরিষ্কার ও শুকনা রাখুন। নখ দিয়ে বেশি আঁচড়াবেন না। স্রাব, দাগ, বা জ্বর থাকলে স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "জ্বর কমে আবার এলে কী করব?",
    answer_bn: "জ্বর বারবার এলে কারণ জানা দরকার। পানি পান করুন, বিশ্রাম নিন, এবং নিজে ওষুধ খাবেন না। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "শিশু দুধ খেয়ে কাঁদলে কী করব?",
    answer_bn: "শিশুর মুখে স্তন ঠিকভাবে লাগছে কি না দেখুন। ঢেকুর তুলতে সাহায্য করুন। প্রস্রাব কম হলে খেয়াল করুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "দুধ খাওয়ানোর সময় মা কীভাবে বসবেন?",
    answer_bn: "মা আরাম করে বসবেন এবং শিশুর মাথা ও শরীর একই লাইনে রাখবেন। শিশুকে স্তনের কাছে আনুন, স্তন শিশুর দিকে টানবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "দুধ খাওয়ানোর পর শিশুকে কী করব?",
    answer_bn: "শিশুকে কাঁধে নিয়ে আলতো করে ঢেকুর তুলতে সাহায্য করুন। তারপর পাশে নিরাপদভাবে শুইয়ে দিন। মুখ ঢেকে রাখবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "মা অসুস্থ থাকলে দুধ দেবেন কি?",
    answer_bn: "অনেক সময় মা অসুস্থ থাকলেও বুকের দুধ চলতে পারে। তবে জ্বর, খুব দুর্বলতা, বা ওষুধের দরকার হলে স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "শিশুর চোখে পুঁজ দেখলে কী করব?",
    answer_bn: "শিশুর চোখ পরিষ্কার রাখুন এবং ময়লা হাত দেবেন না। পুঁজ, ফোলা, বা জ্বর থাকলে স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "শিশু খুব হলুদ দেখালে কী করব?",
    answer_bn: "শিশুর শরীর বা চোখ খুব হলুদ দেখালে পরীক্ষা দরকার হতে পারে। শিশুকে দুধ খাওয়াতে থাকুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "শিশু খুব কম নড়াচড়া করলে কী করব?",
    answer_bn: "শিশু খুব নিস্তেজ থাকলে বা দুধ না খেলে দ্রুত দেখা দরকার। শিশুকে উষ্ণ রাখুন। স্বাস্থ্যকর্মীকে জানান।",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "স্বামী বা পরিবার চেকআপে সাহায্য না করলে কী করব?",
    answer_bn: "পরিবারকে বোঝান যে চেকআপ মা ও শিশুর নিরাপত্তার জন্য দরকার। স্বাস্থ্যকর্মীকে বাড়িতে কথা বলতে বলতে পারেন। সহায়তা চাইতে লজ্জা করবেন না।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "কাজের মাঝে বিশ্রাম কীভাবে নেব?",
    answer_bn: "একটানা কাজ না করে মাঝে মাঝে বসুন। পানি কাছে রাখুন। ভারী কাজ পরিবারের কাউকে দিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "চিন্তা বেশি হলে শরীর খারাপ হতে পারে?",
    answer_bn: "চিন্তা বেশি হলে ঘুম, খাবার, ও মন খারাপ হতে পারে। বিশ্বাসের মানুষের সঙ্গে কথা বলুন। শান্তভাবে শ্বাস নিন এবং বিশ্রাম নিন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "স্বাস্থ্যকর্মীর নম্বর কেন রাখব?",
    answer_bn: "জরুরি সময়ে দ্রুত যোগাযোগের জন্য নম্বর দরকার। নম্বরটি নিজের ফোনে ও পরিবারের কারও ফোনে রাখুন। কাগজেও লিখে রাখুন।",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  }
];

export const OFFLINE_QA_SEED: OfflineQa[] = QA_ROWS.map((item, index) => ({
  id: `qa_${String(index + 1).padStart(3, "0")}`,
  ...item
}));
