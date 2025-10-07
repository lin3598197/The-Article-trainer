import assert from "node:assert/strict";
import {
  compareCharByChar,
  compareFull,
  normalizeText,
  formatCharForDisplay,
} from "../text-utils.js";

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: "passed" });
  } catch (error) {
    results.push({ name, status: "failed", error });
  }
}

test("compareCharByChar returns full match when identical", () => {
  const { summary } = compareCharByChar("天地玄黃", "天地玄黃", { ignorePunctuation: false });
  assert.equal(summary.total, 4);
  assert.equal(summary.matches, 4);
  assert.equal(summary.mismatches, 0);
  assert.equal(summary.missing, 0);
  assert.equal(summary.extra, 0);
});

test("compareCharByChar detects missing characters", () => {
  const { summary, results: items } = compareCharByChar("江山如畫", "江山如", { ignorePunctuation: false });
  assert.equal(summary.total, 4);
  assert.equal(summary.matches, 3);
  assert.equal(summary.missing, 1);
  assert.equal(summary.extra, 0);
  assert.equal(items.at(-1).status, "missing");
});

test("compareCharByChar ignores punctuation when requested", () => {
  const { summary } = compareCharByChar("山川，含秀氣", "山川含秀氣", { ignorePunctuation: true });
  assert.equal(summary.matches, summary.total);
});

test("compareFull flags differences and provides context", () => {
  const { isPerfect, differences } = compareFull("海日生殘夜", "海日昇殘夜", { ignorePunctuation: false });
  assert.equal(isPerfect, false);
  assert.ok(differences.some((msg) => msg.includes("長度不同")) === false);
  assert.ok(differences.some((msg) => msg.includes("原文片段")));
});

test("normalizeText removes punctuation when toggled", () => {
  const normalized = normalizeText("雲想衣裳花想容。", { ignorePunctuation: true, collapseWhitespace: true });
  assert.equal(normalized, "雲想衣裳花想容");
});

test("formatCharForDisplay renders whitespace symbols", () => {
  assert.equal(formatCharForDisplay(""), "∅");
  assert.equal(formatCharForDisplay("\n"), "↵");
  assert.equal(formatCharForDisplay(" "), "␠");
});

const failed = results.filter((item) => item.status === "failed");

results.forEach((item) => {
  if (item.status === "passed") {
    console.log(`✔ ${item.name}`);
  } else {
    console.error(`✖ ${item.name}`);
    console.error(item.error);
  }
});

if (failed.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${results.length} tests passed`);
}
