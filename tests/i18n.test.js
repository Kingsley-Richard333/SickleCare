// Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";
import en from "../src/i18n/en.js";
import fr from "../src/i18n/fr.js";
import es from "../src/i18n/es.js";
import { FLAGS, LOCS, OTHERS, SOON_OTHERS, TIPS } from "../src/lib/assess.js";

const langs = { fr, es };
const enKeys = Object.keys(en.strings);
const holes = (s) => (s.match(/\{[a-z]+\}/g) || []).sort().join(",");

test("every language has exactly the same phrases as English", () => {
  for (const [name, l] of Object.entries(langs)) {
    const keys = Object.keys(l.strings);
    assert.deepEqual(enKeys.filter((k) => !keys.includes(k)), [], `${name} is missing phrases`);
    assert.deepEqual(keys.filter((k) => !enKeys.includes(k)), [], `${name} has extra phrases`);
  }
});

test("placeholders like {n} are kept in every translation", () => {
  for (const [name, l] of Object.entries(langs)) {
    for (const k of enKeys) assert.equal(holes(l.strings[k]), holes(en.strings[k]), `${name}: ${k}`);
  }
});

test("no translation is empty", () => {
  for (const [name, l] of [["en", en], ...Object.entries(langs)]) {
    for (const [k, v] of Object.entries(l.strings)) assert.ok(v.trim().length > 0, `${name}: ${k}`);
  }
});

test("every phrase the symptom checker builds dynamically exists", () => {
  const needed = [
    ...FLAGS.map((f) => `sc.flag.${f}`), ...LOCS.map((l) => `sc.loc.${l}`), ...OTHERS.map((o) => `sc.oth.${o}`),
    ...SOON_OTHERS.map((o) => `sc.oth.${o}`), ...[0, 1, 2].map((i) => `sc.dur.${i}`), ...[0, 1, 2].map((i) => `sc.rel.${i}`),
    ...["severe", "noRelief", "moderate", "long", "partial", "tiredMore", "none"].map((r) => `sc.r.${r}`),
  ];
  for (const [level, n] of Object.entries(TIPS)) {
    needed.push(`sc.res.${level}.title`, `sc.res.${level}.text`);
    for (let i = 1; i <= n; i++) needed.push(`sc.res.${level}.tip${i}`);
  }
  for (const k of needed) for (const [name, l] of [["en", en], ...Object.entries(langs)]) assert.ok(l.strings[k], `${name}: ${k}`);
});

test("languages that are not reviewed say so", () => {
  assert.equal(en.meta.reviewed, true);
  for (const l of Object.values(langs)) assert.equal(typeof l.meta.reviewed, "boolean");
});
