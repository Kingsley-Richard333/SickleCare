// Draft content. Have a doctor review every article before launch.
export const categories = ["Basics", "Pain", "Daily living", "Prevention", "Mental health"];

export const articles = [
  {
    slug: "what-is-sickle-cell", title: "What is sickle cell disease?", category: "Basics", minutes: 3,
    summary: "A simple explanation of what happens in the body and why it causes pain and tiredness.",
    body: [
      { p: ["Sickle cell disease is a condition people are born with. It changes the haemoglobin, the part of red blood cells that carries oxygen around the body."] },
      { h: "What happens in the body", p: ["Normal red blood cells are round and bendy, so they flow easily through small blood vessels. In sickle cell disease, many cells become stiff and curved like a crescent. They can block small vessels and they break down faster than normal cells."], },
      { h: "Why it matters", list: ["Blocked vessels can cause sudden, severe pain, called a pain crisis.", "Cells that break down early can cause anaemia, which brings tiredness and paleness.", "Over time it can affect organs, so regular check-ups matter."] },
      { p: ["Sickle cell disease is not infectious. You cannot catch it from another person. With good care, many people live full lives."] },
    ],
  },
  {
    slug: "genotypes-and-inheritance", title: "Genotypes and how sickle cell is inherited", category: "Basics", minutes: 3,
    summary: "AA, AS, SS and SC explained, and what they mean for children.",
    body: [
      { h: "Your genotype", p: ["Everyone inherits one haemoglobin gene from each parent. The pair you get is your genotype."], list: ["AA: no sickle gene.", "AS: sickle cell trait. You carry one sickle gene and usually stay well.", "SS: sickle cell anaemia. You inherited a sickle gene from both parents.", "SC: another form of sickle cell disease, often a little milder, but it still needs care."] },
      { h: "What it means for children", p: ["If both parents have the trait (AS), each pregnancy has a 1 in 4 chance of a child with SS, a 2 in 4 chance of a child with the trait, and a 1 in 4 chance of a child with no sickle gene."] },
      { p: ["A simple blood test finds your genotype. Many people choose to learn theirs before starting a family. A doctor or counsellor can talk this through with you."] },
    ],
  },
  {
    slug: "pain-crisis", title: "Understanding a pain crisis", category: "Pain", minutes: 3,
    summary: "What a crisis feels like, what can set one off, and when it is an emergency.",
    body: [
      { p: ["A pain crisis happens when sickle-shaped cells block blood flow and parts of the body do not get enough oxygen. The pain can be sudden and severe. It often affects the back, chest, belly, arms, or legs."] },
      { h: "Common triggers", list: ["Not drinking enough water", "Cold weather or cold water", "Infection or fever", "Stress and lack of sleep", "Very hard physical effort"] },
      { h: "Get help straight away if", list: ["The pain is severe or your medicine does not ease it.", "You have a fever, chest pain, or trouble breathing.", "You feel weak on one side, confused, or your vision changes."] },
      { p: ["Not every crisis has a clear cause. Keeping a pain diary helps you and your doctor spot your own patterns."] },
    ],
  },
  {
    slug: "managing-pain-at-home", title: "Managing mild pain at home", category: "Pain", minutes: 2,
    summary: "Safe, simple steps for mild pain, and when to stop and call for help.",
    body: [
      { p: ["Mild pain can often be managed at home. Always follow the pain plan your own doctor has given you, including which medicines to take and when."] },
      { h: "Things that often help", list: ["Drink water regularly.", "Rest in a warm place and use a warm, not hot, cloth on the sore area.", "Take your prescribed medicine on time, as directed.", "Try to relax with slow breathing, quiet music, or gentle distraction."] },
      { h: "Things to avoid", list: ["Cold packs or ice on the skin", "Hot water bottles or heating pads that are too hot, which can burn", "Taking extra medicine beyond your doctor's directions"] },
      { p: ["If pain gets worse, does not ease, or you have any warning signs, do not wait. Use the symptom checker or go to the hospital."] },
    ],
  },
  {
    slug: "water-and-hydration", title: "Why water matters", category: "Daily living", minutes: 2,
    summary: "How staying hydrated helps blood flow, and easy ways to drink more.",
    body: [
      { p: ["When the body is short of water, blood becomes thicker and sickle cells are more likely to clump and block vessels. Staying hydrated is one of the simplest ways to lower the risk of a crisis."] },
      { h: "Easy habits", list: ["Keep a bottle with you at school, work, or when travelling.", "Sip steadily through the day instead of waiting until you are thirsty.", "Drink more in hot weather, when you are active, or when you have a fever.", "Pale yellow urine is a good sign. Dark urine suggests you need more fluids."] },
      { p: ["Ask your doctor how much is right for you. Needs differ by age, weight, and health."] },
    ],
  },
  {
    slug: "food-and-nutrition", title: "Eating well with sickle cell", category: "Daily living", minutes: 3,
    summary: "Food choices that support energy, growth, and healthy blood.",
    body: [
      { p: ["The body makes new red blood cells all the time, so good food matters. Aim for regular meals with a mix of foods."] },
      { h: "A good plate includes", list: ["Fruits and vegetables, including leafy greens", "Beans, eggs, fish, or meat for protein", "Whole grains, yam, rice, or other staples for energy", "Plenty of water"] },
      { h: "Good to know", list: ["Many doctors prescribe folic acid. Take it as directed.", "Do not take iron tablets unless your doctor tells you to. Most people with sickle cell do not need extra iron, and too much can harm the body.", "Ask your doctor or a dietitian before starting any supplement or herbal remedy."] },
    ],
  },
  {
    slug: "infections-and-vaccines", title: "Preventing infections", category: "Prevention", minutes: 3,
    summary: "Why infections are riskier with sickle cell, and the habits and vaccines that protect you.",
    body: [
      { p: ["In sickle cell disease the spleen often does not work well, so the body fights some infections less effectively. A simple infection can become serious quickly."] },
      { h: "Protect yourself", list: ["Wash hands often with soap and clean water.", "Keep vaccinations up to date. Ask your doctor which ones you need.", "Take any preventive medicine your doctor prescribes, especially for young children.", "Use clean, safe drinking water and well-cooked food.", "Sleep under a treated mosquito net if you live where malaria is common, and ask your doctor about malaria prevention."] },
      { h: "Fever is urgent", p: ["A temperature of 38°C (100.4°F) or higher needs medical care the same day, even if you feel fairly well. Do not wait it out."] },
    ],
  },
  {
    slug: "living-well", title: "Living well: school, work, and your mind", category: "Mental health", minutes: 3,
    summary: "Practical ideas for daily life, and why looking after your mood is part of your care.",
    body: [
      { p: ["Living with a long-term condition can be tiring and sometimes frightening. Feeling worried, low, or frustrated is common, and it is a real part of health, not a weakness."] },
      { h: "At school or work", list: ["Tell a teacher, manager, or trusted colleague about your condition so they can help in an emergency.", "Ask for water breaks, a warm place to sit, and rest when you need it.", "Plan around appointments and recovery time after a crisis."] },
      { h: "Looking after your mind", list: ["Talk to someone you trust about how you feel.", "Join a support group to meet people who understand.", "Tell your doctor if you feel sad, anxious, or hopeless for more than a couple of weeks. Help is available."] },
    ],
  },
];
