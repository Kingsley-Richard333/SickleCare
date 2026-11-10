// Run with: npm test   (uses Node's built-in test runner, no extra installs)
import test from "node:test";
import assert from "node:assert/strict";
import { assess } from "../src/lib/assess.js";

const base = { flags: [], pain: 0, where: [], duration: 0, relief: 0, others: [] };
const level = (over) => assess({ ...base, ...over }).level;

test("every warning sign is an emergency", () => {
  for (const f of ["chest", "breath", "fever", "stroke", "vision", "head", "priapism", "belly"]) {
    assert.equal(level({ flags: [f] }), "emergency", f);
  }
});
test("very severe pain is an emergency", () => {
  assert.equal(level({ pain: 8 }), "emergency");
  assert.equal(level({ pain: 10 }), "emergency");
});
test("strong pain that medicine does not ease is an emergency", () => {
  assert.equal(level({ pain: 6, relief: 2 }), "emergency");
  assert.equal(level({ pain: 7, relief: 2 }), "emergency");
});
test("moderate pain needs a doctor soon", () => {
  assert.equal(level({ pain: 4 }), "soon");
  assert.equal(level({ pain: 7 }), "soon");
});
test("pain that medicine only partly eases needs a doctor soon", () => {
  assert.equal(level({ pain: 3, relief: 1 }), "soon");
});
test("pain lasting more than 3 days needs a doctor soon", () => {
  assert.equal(level({ pain: 1, duration: 2 }), "soon");
});
test("each concerning symptom needs a doctor soon", () => {
  for (const o of ["yellow", "urine", "pee", "cough", "swelling", "vomit"]) {
    assert.equal(level({ others: [o] }), "soon", o);
  }
});
test("tiredness alone is managed at home, but not with other symptoms", () => {
  assert.equal(level({ others: ["tired"] }), "home");
  assert.equal(level({ others: ["tired", "throat"] }), "soon");
});
test("mild pain and nothing else is managed at home", () => {
  assert.equal(level({}), "home");
  assert.equal(level({ pain: 2 }), "home");
  assert.equal(level({ pain: 3, relief: 0 }), "home");
});
test("an emergency is never downgraded by other answers", () => {
  assert.equal(level({ flags: ["chest"], pain: 0, relief: 0 }), "emergency");
  assert.equal(level({ flags: ["fever"], others: ["tired"] }), "emergency");
});
test("every result has a reason", () => {
  for (const over of [{}, { pain: 5 }, { flags: ["chest"] }]) {
    assert.ok(assess({ ...base, ...over }).reasons.length > 0);
  }
});
