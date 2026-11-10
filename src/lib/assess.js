// The symptom checker's decision rules, kept separate so they can be tested.
// A doctor should review every threshold in this file before launch.

export const FLAGS = ["chest", "breath", "fever", "stroke", "vision", "head", "priapism", "belly"];
export const LOCS = ["chest", "back", "belly", "limbs", "joints", "head"];
export const OTHERS = ["tired", "yellow", "swelling", "cough", "urine", "pee", "throat", "vomit"];
export const SOON_OTHERS = ["yellow", "urine", "pee", "cough", "swelling", "vomit"];
export const TIPS = { emergency: 2, soon: 4, home: 5 };

export function assess(a) {
  const emergency = a.flags.map((f) => ({ k: `sc.flag.${f}` }));
  if (a.pain >= 8) emergency.push({ k: "sc.r.severe", v: { n: a.pain } });
  if (a.pain >= 6 && a.relief === 2) emergency.push({ k: "sc.r.noRelief" });
  if (emergency.length) return { level: "emergency", reasons: emergency };

  const soon = [];
  if (a.pain >= 4) soon.push({ k: "sc.r.moderate", v: { n: a.pain } });
  if (a.duration === 2 && a.pain > 0) soon.push({ k: "sc.r.long" });
  if (a.pain >= 3 && a.relief >= 1) soon.push({ k: "sc.r.partial" });
  SOON_OTHERS.forEach((o) => a.others.includes(o) && soon.push({ k: `sc.oth.${o}` }));
  if (a.others.includes("tired") && a.others.length > 1) soon.push({ k: "sc.r.tiredMore" });
  if (soon.length) return { level: "soon", reasons: soon };
  return { level: "home", reasons: [{ k: "sc.r.none" }] };
}
