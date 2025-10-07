export const PUNCTUATION_REGEX = /[\.,，。!?！？；;:：、、·‧\-—\(\)\[\]{}"'“”‘’《》〈〉「」『』【】…·～~﹏＿＿‧\u3000\u2026]+/g;

export function normalizeText(text, { ignorePunctuation, collapseWhitespace }) {
  let normalized = text.replace(/\r\n?/g, "\n");
  if (ignorePunctuation) {
    normalized = normalized.replace(PUNCTUATION_REGEX, "");
  }
  if (collapseWhitespace) {
    normalized = normalized.replace(/\s+/g, " ");
  }
  return normalized.trim();
}

export function compareCharByChar(reference, attempt, { ignorePunctuation }) {
  const referenceNormalized = normalizeText(reference, {
    ignorePunctuation,
    collapseWhitespace: false,
  });
  const attemptNormalized = normalizeText(attempt, {
    ignorePunctuation,
    collapseWhitespace: false,
  });

  const referenceChars = Array.from(referenceNormalized);
  const attemptChars = Array.from(attemptNormalized);
  const maxLength = Math.max(referenceChars.length, attemptChars.length);
  const results = [];

  let matches = 0;
  let mismatches = 0;
  let missing = 0;
  let extra = 0;

  for (let index = 0; index < maxLength; index += 1) {
    const referenceChar = referenceChars[index] ?? "";
    const attemptChar = attemptChars[index] ?? "";
    let status = "match";

    if (!referenceChar && attemptChar) {
      status = "extra";
      extra += 1;
    } else if (referenceChar && !attemptChar) {
      status = "missing";
      missing += 1;
    } else if (referenceChar !== attemptChar) {
      status = "mismatch";
      mismatches += 1;
    } else {
      matches += 1;
    }

    results.push({
      index: index + 1,
      referenceChar,
      attemptChar,
      status,
    });
  }

  return {
    results,
    summary: {
      total: results.length,
      matches,
      mismatches,
      missing,
      extra,
    },
  };
}

export function compareFull(reference, attempt, { ignorePunctuation }) {
  const referenceNormalized = normalizeText(reference, {
    ignorePunctuation,
    collapseWhitespace: true,
  });
  const attemptNormalized = normalizeText(attempt, {
    ignorePunctuation,
    collapseWhitespace: true,
  });

  const isPerfect = referenceNormalized === attemptNormalized;
  const differences = [];

  if (!isPerfect) {
    if (referenceNormalized.length !== attemptNormalized.length) {
      differences.push(`長度不同：原文 ${referenceNormalized.length} 字，背誦 ${attemptNormalized.length} 字`);
    }

    const diffIndex = findFirstDifference(referenceNormalized, attemptNormalized);
    if (diffIndex !== -1) {
      const contextRadius = 10;
      const refSnippet = referenceNormalized.slice(Math.max(0, diffIndex - contextRadius), diffIndex + contextRadius);
      const attemptSnippet = attemptNormalized.slice(Math.max(0, diffIndex - contextRadius), diffIndex + contextRadius);
      differences.push(`從第 ${diffIndex + 1} 個字開始不同。原文片段：「${refSnippet || "∅"}」，背誦片段：「${attemptSnippet || "∅"}」`);
    }
  }

  return { referenceNormalized, attemptNormalized, isPerfect, differences };
}

export function findFirstDifference(a, b) {
  const max = Math.min(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i] !== b[i]) return i;
  }
  return a.length === b.length ? -1 : max;
}

export function formatCharForDisplay(char) {
  if (!char) return "∅";
  if (char === "\n") return "↵";
  if (char === "\t") return "⇥";
  if (char === " ") return "␠";
  return char;
}