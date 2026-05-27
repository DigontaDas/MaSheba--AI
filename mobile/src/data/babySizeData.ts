export interface WeeklySize {
  week: number;
  foodNameBn: string;
  foodNameEn: string;
  milestoneBn: string;
  milestoneEn: string;
  weightBn: string;
  lengthBn: string;
}

const sizeData: Record<number, WeeklySize> = {
  1: { week: 1, foodNameBn: "সরিষার দানা", foodNameEn: "Mustard Seed", milestoneBn: "গর্ভধারণের প্রস্তুতি শুরু হচ্ছে।", milestoneEn: "Preparation for conception begins.", weightBn: "০ গ্রাম", lengthBn: "০ মিলিমিটার" },
  2: { week: 2, foodNameBn: "সরিষার দানা", foodNameEn: "Mustard Seed", milestoneBn: "ডিম্বাণু নিষিক্ত হওয়ার প্রক্রিয়া সম্পন্ন হয়।", milestoneEn: "Fertilization process takes place.", weightBn: "০ গ্রাম", lengthBn: "০ মিলিমিটার" },
  3: { week: 3, foodNameBn: "সরিষার দানা", foodNameEn: "Mustard Seed", milestoneBn: "ভ্রূণ জরায়ুর দেয়ালে রোপিত হতে শুরু করে।", milestoneEn: "Embryo begins implanting in the uterine wall.", weightBn: "০ গ্রাম", lengthBn: "০.১ মিলিমিটার" },
  4: { week: 4, foodNameBn: "পোস্ত দানা", foodNameEn: "Poppy Seed", milestoneBn: "ভ্রূণের প্রাথমিক কোষসমূহ সুসংগঠিত হচ্ছে।", milestoneEn: "Embryonic cells are forming rapidly.", weightBn: "০.১ গ্রাম", lengthBn: "১ মিলিমিটার" },
  5: { week: 5, foodNameBn: "কমলা লেবুর বিচি", foodNameEn: "Orange Seed", milestoneBn: "শিশুর হৃদপিণ্ড এবং রক্তনালী গঠন শুরু হয়।", milestoneEn: "Baby's heart and blood vessels begin to form.", weightBn: "০.২ গ্রাম", lengthBn: "২ মিলিমিটার" },
  6: { week: 6, foodNameBn: "মটরশুঁটি", foodNameEn: "Green Pea", milestoneBn: "হৃদস্পন্দন তৈরি হয় এবং আল্ট্রাসাউন্ডে ধরা পড়ে।", milestoneEn: "Heartbeat is detectable via ultrasound.", weightBn: "০.৪ gram", lengthBn: "৫ মিলিমিটার" },
  7: { week: 7, foodNameBn: "দেশী এলাচ", foodNameEn: "Cardamom", milestoneBn: "হাত ও পায়ের ছোট ছোট কুঁড়ি দেখা দিতে শুরু করে।", milestoneEn: "Tiny limb buds for arms and legs appear.", weightBn: "০.৮ গ্রাম", lengthBn: "১.২ সেন্টিমিটার" },
  8: { week: 8, foodNameBn: "গোলাপজাম", foodNameEn: "Rose Apple", milestoneBn: "চোখ ও কানের পাতা গঠিত হতে শুরু করেছে।", milestoneEn: "Eyes and ears are beginning to form.", weightBn: "১ গ্রাম", lengthBn: "১.৬ সেন্টিমিটার" },
  9: { week: 9, foodNameBn: "জলপাই", foodNameEn: "Olive", milestoneBn: "কনুই ও পায়ের পাতা নড়াচড়া করতে পারে।", milestoneEn: "Elbows and feet are capable of moving.", weightBn: "২ গ্রাম", lengthBn: "২.৩ সেন্টিমিটার" },
  10: { week: 10, foodNameBn: "আমলকী", foodNameEn: "Gooseberry / Amla", milestoneBn: "সব গুরুত্বপূর্ণ অঙ্গ ও সিস্টেমের বিকাশ সম্পন্ন হয়।", milestoneEn: "All critical organs and systems are in place.", weightBn: "৪ গ্রাম", lengthBn: "৩ সেন্টিমিটার" },
  11: { week: 11, foodNameBn: "কাঁচা সুপারি", foodNameEn: "Betel Nut", milestoneBn: "শিশুর নখ ও চুলের গ্রন্থি গঠিত হতে শুরু করেছে।", milestoneEn: "Nails and hair follicles begin developing.", weightBn: "৭ গ্রাম", lengthBn: "৪ সেন্টিমিটার" },
  12: { week: 12, foodNameBn: "দেশী লেবু", foodNameEn: "Local Green Lemon", milestoneBn: "হাত ও পায়ের আঙুলগুলো সম্পূর্ণ আলাদা হয়ে যায়।", milestoneEn: "Fingers and toes are completely separated.", weightBn: "১৪ গ্রাম", lengthBn: "৫.৪ সেন্টিমিটার" },
  13: { week: 13, foodNameBn: "লটকন", foodNameEn: "Burmese Grape / Lotkon", milestoneBn: "ভ্রূণ এখন নিজের মুখ নাড়াতে এবং বুড়ো আঙুল চুষতে পারে।", milestoneEn: "Fetus can move its mouth and suck its thumb.", weightBn: "২৩ গ্রাম", lengthBn: "৭.৪ সেন্টিমিটার" },
  14: { week: 14, foodNameBn: "কামরাঙা", foodNameEn: "Starfruit", milestoneBn: "শরীরে ল্যানুগো নামক সূক্ষ্ম লোম গজায়।", milestoneEn: "Fine hair called lanugo grows on the body.", weightBn: "৪৩ গ্রাম", lengthBn: "৮.৭ সেন্টিমিটার" },
  15: { week: 15, foodNameBn: "দেশী আলু", foodNameEn: "Local Potato", milestoneBn: "শিশুর কঙ্কাল আরও শক্ত হতে শুরু করেছে।", milestoneEn: "Baby's skeleton is becoming firmer.", weightBn: "৭০ গ্রাম", lengthBn: "১০ সেন্টিমিটার" },
  16: { week: 16, foodNameBn: "মিষ্টি আলু", foodNameEn: "Sweet Potato", milestoneBn: "চোখ ও কান তাদের সঠিক স্থানে পৌঁছে গেছে।", milestoneEn: "Eyes and ears have reached their final positions.", weightBn: "১০০ গ্রাম", lengthBn: "১১.৬ সেন্টিমিটার" },
  17: { week: 17, foodNameBn: "পেয়ারা", foodNameEn: "Guava", milestoneBn: "ত্বকের নিচে চর্বির স্তর জমা হতে শুরু করেছে।", milestoneEn: "Fat deposits begin storing under the skin.", weightBn: "১৪০ গ্রাম", lengthBn: "১৩ সেন্টিমিটার" },
  18: { week: 18, foodNameBn: "বেল", foodNameEn: "Wood Apple / Bael", milestoneBn: "শিশু এখন আপনার কথার শব্দ শুনতে পায়।", milestoneEn: "Baby can now hear sounds from outside.", weightBn: "১৯০ গ্রাম", lengthBn: "১৪.২ সেন্টিমিটার" },
  19: { week: 19, foodNameBn: "কচি আম", foodNameEn: "Raw Mango", milestoneBn: "মস্তিষ্কে শোনার, দেখার ও স্পর্শের অনুভূতি তৈরি হয়।", milestoneEn: "Sensory zones for sound, sight, and touch develop.", weightBn: "২৪০ গ্রাম", lengthBn: "১৫.৩ সেন্টিমিটার" },
  20: { week: 20, foodNameBn: "আতা ফল", foodNameEn: "Custard Apple / Ata", milestoneBn: "আপনার গর্ভাবস্থার অর্ধেক সময় সম্পন্ন হয়েছে!", milestoneEn: "Halfway through the pregnancy journey!", weightBn: "৩০০ গ্রাম", lengthBn: "১৬.৪ সেন্টিমিটার" },
  21: { week: 21, foodNameBn: "বড় বেগুন", foodNameEn: "Large Eggplant", milestoneBn: "শিশুর পাচক সিস্টেম সক্রিয় এবং শক্তিশালী হচ্ছে।", milestoneEn: "Digestive system is functioning and strengthening.", weightBn: "৩৬০ গ্রাম", lengthBn: "২৬.৭ সেন্টিমিটার" },
  22: { week: 22, foodNameBn: "পেঁপে", foodNameEn: "Papaya", milestoneBn: "চোখের পাপড়ি ও ভ্রূ পুরোপুরি গঠিত হয়েছে।", milestoneEn: "Eyelashes and eyebrows are fully formed.", weightBn: "৪৩০ গ্রাম", lengthBn: "২৭.৮ সেন্টিমিটার" },
  23: { week: 23, foodNameBn: "নারিকেল", foodNameEn: "Coconut", milestoneBn: "শিশুর ফুসফুস শ্বাস-প্রশ্বাসের জন্য প্রস্তুত হচ্ছে।", milestoneEn: "Lungs are preparing for postnatal breathing.", weightBn: "৫০১ গ্রাম", lengthBn: "২৮.৯ সেন্টিমিটার" },
  24: { week: 24, foodNameBn: "কচি কাঁঠাল", foodNameEn: "Baby Jackfruit", milestoneBn: "ভেতরের কান সম্পূর্ণ বিকশিত হয়ে ভারসাম্য রক্ষা করে।", milestoneEn: "Inner ear is fully developed to control balance.", weightBn: "৬০০ গ্রাম", lengthBn: "৩০ সেন্টিমিটার" },
  25: { week: 25, foodNameBn: "বাতাবি লেবু", foodNameEn: "Pomelo / Batabi Lebu", milestoneBn: "শিশুর চুল গজানো এবং রঙের বিকাশ হতে শুরু করেছে।", milestoneEn: "Hair starts growing and color pigmentation develops.", weightBn: "৬৬০ গ্রাম", lengthBn: "৩৪.৬ সেন্টিমিটার" },
  26: { week: 26, foodNameBn: "কাঁচা পেঁপে", foodNameEn: "Green Papaya", milestoneBn: "শিশু মাঝে মাঝে চোখ খুলে তাকায় এবং আলো অনুভব করে।", milestoneEn: "Baby opens eyes occasionally and senses light.", weightBn: "৭৬০ গ্রাম", lengthBn: "৩৫.৬ সেন্টিমিটার" },
  27: { week: 27, foodNameBn: "ছোট তরমুজ", foodNameEn: "Small Watermelon", milestoneBn: "নিয়মিত নড়াচড়া ও বিশ্রামের চক্র তৈরি হয়।", milestoneEn: "Regular sleep and wake cycles are established.", weightBn: "৮৭৫ গ্রাম", lengthBn: "৩৬.৬ সেন্টিমিটার" },
  28: { week: 28, foodNameBn: "বাঁধাকপি", foodNameEn: "Cabbage", milestoneBn: "শিশুর চোখের মণি সম্পূর্ণ বিকশিত হতে পারে।", milestoneEn: "Eye development is now highly mature.", weightBn: "১ কেজি", lengthBn: "৩৭.৬ সেন্টিমিটার" },
  29: { week: 29, foodNameBn: "ওলকপি", foodNameEn: "Kohlrabi", milestoneBn: "শিশুর শরীরে ক্যালসিয়াম ও লোহা জমা হতে থাকে।", milestoneEn: "Stores of iron and calcium increase in baby's body.", weightBn: "১.২ কেজি", lengthBn: "৩৮.৬ সেন্টিমিটার" },
  30: { week: 30, foodNameBn: "ফুলকপি", foodNameEn: "Cauliflower", milestoneBn: "শিশুর নিজস্ব শরীরের তাপমাত্রা নিয়ন্ত্রণ শুরু হয়।", milestoneEn: "Baby begins regulating its own body temperature.", weightBn: "১.৩ কেজি", lengthBn: "৩৯.৯ সেন্টিমিটার" },
  31: { week: 31, foodNameBn: "জলপাই গুচ্ছ", foodNameEn: "Bunch of Olives", milestoneBn: "মস্তিষ্কের কোটি কোটি নিউরনের সংযোগ তৈরি হচ্ছে।", milestoneEn: "Billions of neural connections form in the brain.", weightBn: "১.৫ কেজি", lengthBn: "৪১.১ সেন্টিমিটার" },
  32: { week: 32, foodNameBn: "কচি চালকুমড়া", foodNameEn: "Ash Gourd / Chalkumra", milestoneBn: "শিশুর হাত-পা পুরোপুরি মাংসল ও পুষ্ট হয়ে উঠেছে।", milestoneEn: "Arms and legs are fully fleshed out and mature.", weightBn: "১.৭ কেজি", lengthBn: "৪২.৪ সেন্টিমিটার" },
  33: { week: 33, foodNameBn: "বড় আনারস", foodNameEn: "Large Pineapple", milestoneBn: "মস্তিষ্ক এবং শরীরের রোগ প্রতিরোধ ব্যবস্থা সক্রিয় হয়।", milestoneEn: "Brain and immune systems become highly active.", weightBn: "১.৯ কেজি", lengthBn: "৪৩.৭ সেন্টিমিটার" },
  34: { week: 34, foodNameBn: "মিষ্টি কুমড়া", foodNameEn: "Sweet Pumpkin", milestoneBn: "হাড় পুরোপুরি শক্ত হয়ে গেছে, তবে মাথার খুলি নমনীয় থাকে।", milestoneEn: "Bones are fully developed; skull remains soft for birth.", weightBn: "২.১ কেজি", lengthBn: "৪৫ সেন্টিমিটার" },
  35: { week: 35, foodNameBn: "বড় চালকুমড়া", foodNameEn: "Large Ash Gourd", milestoneBn: "শিশুর ফুসফুস ও অন্যান্য প্রধান অঙ্গ সম্পূর্ণ বিকশিত।", milestoneEn: "Lungs and main organs are virtually fully developed.", weightBn: "২.৪ কেজি", lengthBn: "৪৬.২ সেন্টিমিটার" },
  36: { week: 36, foodNameBn: "তরমুজ", foodNameEn: "Watermelon", milestoneBn: "গর্ভের ভেতর জায়গা সংকুচিত হওয়ায় নড়াচড়া একটু কমতে পারে।", milestoneEn: "Space shrinks inside; baby's kicks feel tighter.", weightBn: "২.৬ কেজি", lengthBn: "৪৭.৪ সেন্টিমিটার" },
  37: { week: 37, foodNameBn: "আস্ত কাঁঠাল", foodNameEn: "Whole Jackfruit", milestoneBn: "শিশু এখন পূর্ণ মেয়াদী (Full Term) এবং প্রসবের জন্য প্রস্তুত।", milestoneEn: "Baby is now considered full-term and ready.", weightBn: "২.৯ কেজি", lengthBn: "৪৮.৬ সেন্টিমিটার" },
  38: { week: 38, foodNameBn: "আস্ত কাঁঠাল", foodNameEn: "Whole Jackfruit", milestoneBn: "শিশুর চোখের মণি এবং প্রসবকালীন প্রতিবর্ত ক্রিয়া সক্রিয়।", milestoneEn: "Eye color is set and grasping reflexes are active.", weightBn: "৩.১ কেজি", lengthBn: "৪৯.৮ সেন্টিমিটার" },
  39: { week: 39, foodNameBn: "আস্ত কাঁঠাল", foodNameEn: "Whole Jackfruit", milestoneBn: "ত্বকের নিচের চর্বির স্তর এখন শিশুকে উষ্ণ রাখতে প্রস্তুত।", milestoneEn: "Fat layer is fully sufficient to keep baby warm.", weightBn: "৩.৩ কেজি", lengthBn: "৫০.৭ সেন্টিমিটার" },
  40: { week: 40, foodNameBn: "আস্ত কাঁঠাল", foodNameEn: "Whole Jackfruit", milestoneBn: "অভিনন্দন! আপনার শিশু যেকোনো মুহূর্তে পৃথিবীতে আসতে প্রস্তুত!", milestoneEn: "Congratulations! Your baby is ready to enter the world!", weightBn: "৩.৫ কেজি", lengthBn: "৫১.২ সেন্টিমিটার" }
};

export function getWeeklySize(week: number): WeeklySize {
  const normalized = Math.max(1, Math.min(40, week));
  return sizeData[normalized] || sizeData[40];
}
