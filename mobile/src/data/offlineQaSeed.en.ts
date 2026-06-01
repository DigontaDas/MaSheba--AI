import type { OfflineQa } from "@/types/schema";

type Row = Omit<OfflineQa, "id">;

const rows: Row[] = [
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "Which pregnancy symptoms need emergency care?",
    answer_bn: "Go to a hospital or health centre immediately for vaginal bleeding, fits or seizure, severe headache with blurred vision, severe belly pain, fast or difficult breathing, or fever with extreme weakness.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "What should I do if bleeding starts during pregnancy?",
    answer_bn: "Do not wait at home. Use a clean pad or cloth, avoid putting anything inside the vagina, arrange transport, and go to the nearest hospital or health centre immediately.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "জরুরি_লক্ষণ",
    question_bn: "Is severe headache with blurred vision dangerous?",
    answer_bn: "Yes. Severe headache with blurred vision can be a danger sign of high blood pressure or pre-eclampsia. Seek emergency care now, especially after 20 weeks of pregnancy.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "What BP reading is risky in pregnancy?",
    answer_bn: "A BP of 140/90 mmHg or higher needs prompt review. If it comes with headache, blurred vision, swelling of face or hands, belly pain, or fits, treat it as an emergency.",
    severity: "HIGH",
    see_doctor: true,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "What should I do after a high BP reading?",
    answer_bn: "Rest on the left side and repeat the measurement if trained to do so, but do not delay referral when BP is 140/90 or higher with danger signs. Contact the health worker or facility.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "উচ্চ_রক্তচাপ",
    question_bn: "Can swelling be normal during pregnancy?",
    answer_bn: "Mild foot swelling can happen late in pregnancy. Sudden swelling of the face, hands, or around the eyes is not normal and needs urgent assessment, especially with headache or vision changes.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "What symptoms are common in early pregnancy?",
    answer_bn: "Missed period, nausea, breast tenderness, tiredness, and frequent urination are common. Confirm pregnancy and start antenatal care early.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "When should I start antenatal checkups?",
    answer_bn: "Start antenatal care as soon as pregnancy is known. Regular visits help check BP, weight, anemia, fetal growth, supplements, and danger signs.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "গর্ভাবস্থার_লক্ষণ",
    question_bn: "What should I tell the health worker during a visit?",
    answer_bn: "Tell them about bleeding, pain, fever, discharge, headache, swelling, vomiting, baby movement, medicines, previous pregnancy problems, and any concern you feel.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "Is fever during pregnancy a warning sign?",
    answer_bn: "Fever can mean infection. Drink safe water, rest, and contact a health worker. Fever with severe weakness, chills, bad-smelling discharge, or breathing difficulty needs urgent care.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "What if vaginal discharge smells bad?",
    answer_bn: "Bad-smelling discharge can be a sign of infection. Do not self-medicate. Keep the area clean and contact a health worker or clinic for assessment.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "সংক্রমণ",
    question_bn: "What should I do for burning during urination?",
    answer_bn: "Burning urine can be a urinary infection. Drink safe water and contact a health worker. Fever, back pain, or weakness needs faster medical review.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "বমি_বমি_ভাব",
    question_bn: "What helps nausea in pregnancy?",
    answer_bn: "Eat small frequent meals, try dry food before getting up, avoid oily smells, and sip safe water. Do not stay hungry for long periods.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "বমি_বমি_ভাব",
    question_bn: "When is vomiting dangerous?",
    answer_bn: "Vomiting is dangerous if you cannot keep food or water down, urine becomes very low or dark, you feel dizzy, or you lose weight. Contact a clinic quickly.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "বমি_বমি_ভাব",
    question_bn: "Can I stop iron tablets because they make me nauseous?",
    answer_bn: "Do not stop iron tablets without advice. Tell the health worker; changing timing, taking after food, or using another preparation may help.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "What should I eat every day during pregnancy?",
    answer_bn: "Try to include rice or roti, dal, vegetables, leafy greens, egg or fish, fruit, and calcium-rich food across the day. Eat safe freshly cooked food.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "Which nutrients are especially important?",
    answer_bn: "Iron, folic acid, calcium, iodine, zinc, protein, and enough energy are important. Follow ANC advice for iron-folic acid and calcium tablets.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "পুষ্টি_ও_খাবার",
    question_bn: "How much water should I drink?",
    answer_bn: "Drink safe water regularly through the day. More water may be needed in hot weather, after vomiting, or while breastfeeding unless a provider advises otherwise.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "What are signs of anemia?",
    answer_bn: "Tiredness, dizziness, shortness of breath, pale palms, fast heartbeat, or weakness can suggest anemia. Keep ANC checkups and take prescribed iron-folic acid.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "Which foods help with iron?",
    answer_bn: "Eat fish, egg, dal, chickpea, leafy greens, and other iron-rich foods. Add vitamin C foods like lemon, guava, tomato, or orange with meals.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "রক্তশূন্যতা",
    question_bn: "Should I take tea with meals?",
    answer_bn: "Avoid tea or coffee right with meals or iron tablets because it can reduce iron absorption. Keep a gap when possible.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "Is mild back pain common?",
    answer_bn: "Mild back pain can be common. Rest, avoid heavy lifting, change position slowly, and use support. Severe pain, bleeding, fever, or contractions needs care.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "When is belly pain dangerous?",
    answer_bn: "Severe belly pain, pain with bleeding, fever, fainting, or regular contractions before term is a danger sign. Go to a health facility quickly.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "ALL",
    week_range: "all",
    topic: "ব্যথা_ও_অস্বস্তি",
    question_bn: "What can help heartburn?",
    answer_bn: "Eat smaller meals, avoid lying down right after eating, and reduce very oily or spicy foods if they worsen symptoms. Ask before taking medicine.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "When should I feel baby movement regularly?",
    answer_bn: "Many mothers feel movement clearly by the second half of pregnancy. In the third trimester, pay attention to the baby’s usual pattern every day.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "What if baby movement slows or stops?",
    answer_bn: "If movement clearly slows or stops, do not wait overnight. Lie on the left side and seek urgent assessment at a health facility.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "শিশুর_নড়াচড়া",
    question_bn: "How can I notice movement changes?",
    answer_bn: "Choose a quiet time each day and notice the baby’s usual pattern. A major change from normal should be discussed with a health worker.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "What are signs that labour may be starting?",
    answer_bn: "Regular contractions, lower belly or back pain that comes and goes, mucus show, or water breaking can mean labour. Prepare transport and contact the health worker.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "What if water breaks before labour?",
    answer_bn: "Use a clean pad, do not insert anything, and contact a health facility. Green, bad-smelling fluid, fever, or bleeding needs emergency care.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "T3",
    week_range: "28-40",
    topic: "প্রসবের_লক্ষণ",
    question_bn: "When should I go to the facility for delivery?",
    answer_bn: "Go when contractions become regular, water breaks, bleeding starts, baby movement reduces, or any danger sign appears. Follow your birth plan and health worker advice.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "Which postpartum symptoms are dangerous?",
    answer_bn: "Heavy bleeding, fever, bad-smelling discharge, severe belly pain, severe headache, fits, chest pain, breathing difficulty, or thoughts of self-harm need urgent care.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "How should the mother rest after birth?",
    answer_bn: "Rest, eat nutritious food, drink safe water, keep follow-up visits, and ask family for help. Seek care quickly for bleeding, fever, weakness, or pain.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "What newborn signs need urgent care?",
    answer_bn: "Poor feeding, fits, lethargy, fast breathing, chest indrawing, fever, low temperature, blue color, or pus/redness around the cord need urgent newborn care.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "When should breastfeeding start?",
    answer_bn: "Start breastfeeding as soon as possible after birth, ideally within the first hour if mother and baby are stable. Give only breast milk unless advised otherwise.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "How do I know the baby is feeding well?",
    answer_bn: "The baby should latch deeply, suck and swallow, pass urine, and seem satisfied after feeds. Painful latch or poor feeding needs support.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "What if breast pain or fever occurs?",
    answer_bn: "Breast pain with fever, redness, or swelling can mean infection. Continue feeding if possible and contact a health worker quickly.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "I am still bleeding after delivery. Is this normal?",
    answer_bn: "Sister, some bleeding is normal for a few weeks after delivery. However, if you soak more than one pad in an hour, pass large blood clots, or feel dizzy, go to the hospital immediately.",
    severity: "HIGH",
    see_doctor: false,
    emergency: true
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "I cannot sleep at night because of the baby.",
    answer_bn: "Sister, it is common to get less sleep when caring for a newborn. Try to rest when the baby sleeps, take help from family members, and eat and drink well. Your health is also very important.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "I have a fever today.",
    answer_bn: "Sister, a fever after delivery can be a sign of infection. If the pain at the stitches increases, there is foul-smelling discharge, or your body shakes, contact a health worker or doctor immediately.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "I feel dizzy whenever I stand up.",
    answer_bn: "Sister, this can happen due to anemia or weakness after childbirth. Eat protein-rich foods, leafy vegetables, eggs, and take iron tablets. If the symptoms persist, make sure to get checked by a doctor.",
    severity: "MODERATE",
    see_doctor: true,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "প্রসব_পরবর্তী_যত্ন",
    question_bn: "When can I start exercising after childbirth?",
    answer_bn: "Sister, light walking can usually be started within a few days after a normal delivery. Do not start heavy exercises, and if you had a C-section, consult your doctor first. Gradually return to your normal activities.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "My baby falls asleep while breastfeeding.",
    answer_bn: "Sister, it is common for newborns to fall asleep while feeding. Make sure the baby feeds for at least 10–15 minutes, switch sides after finishing one breast, and keep them awake by gently touching their cheek. If they seem very weak, inform a health worker.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "My breast milk looks a bit yellow. Is it a problem?",
    answer_bn: "No sister, this is completely normal. The yellowish milk that comes in the first few days after delivery is called Colostrum. It boosts immunity and protects the baby from illnesses, so make sure to feed this milk to your baby.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "Should I give extra water to the baby during hot weather?",
    answer_bn: "No sister. Exclusive breastfeeding is sufficient for the baby until six months of age. Breast milk contains enough water, nutrients, and immunity. There is no need to give water or other food before six months.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "I have to do household work and don't find time to breastfeed.",
    answer_bn: "Sister, we know it can be hard to take care of the baby along with household work. Try to breastfeed in between chores, take help from family members, and do not keep the baby without feeding for a long time. Remember, your breast milk is the baby's most important food now.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  },
  {
    trimester: "POSTPARTUM",
    week_range: "postpartum",
    topic: "বুকের_দুধ",
    question_bn: "My baby gets hiccups after feeding.",
    answer_bn: "Sister, many babies get hiccups after feeding and it is usually not harmful. Burp the baby on your shoulder after feeds, avoid feeding too fast, and keep them upright. Inform a health worker if they have breathing trouble.",
    severity: "LOW",
    see_doctor: false,
    emergency: false
  }
];

export const OFFLINE_QA_SEED_EN: OfflineQa[] = rows.map((item, index) => ({
  id: `qa_en_${String(index + 1).padStart(3, "0")}`,
  ...item
}));
