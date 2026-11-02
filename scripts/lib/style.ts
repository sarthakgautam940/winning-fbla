// House-style scan for prose. Code, inline code and math never reach this
// function; it only sees markdown text nodes and plain strings.

const BANNED: [RegExp, string][] = [
  [/\bdelve(s|d)?\b/i, "banned word: delve"],
  [/\bdiv(e|ing) into\b/i, "banned phrase: dive into"],
  [/\bdeep[- ]dive\b/i, "banned phrase: deep dive"],
  [/fast-paced world/i, "banned phrase: fast-paced world"],
  [/it'?s important to note/i, "banned phrase: it's important to note"],
  [/\bunleash/i, "banned word: unleash"],
  [/\bsupercharg/i, "banned word: supercharge"],
  [/\bseamless(ly)?\b/i, "banned word: seamless"],
  [/\brobust(ly|ness)?\b/i, "banned word: robust"],
  [/\bempower/i, "banned word: empower"],
  [/\bleverag(e|es|ed|ing) (the|a|an|your|their|our|this|these|its|data|ai|it)\b/i, "banned: leverage as a verb"],
  [/\bgame[- ]changer/i, "banned word: game-changer"],
  [/\bunlock(s|ing)? (the|your|new|a) (power|potential|full)/i, "banned: unlock as hype"],
  [/\bnot just\b[^.;:]{1,80}\bbut\b/i, "banned pattern: not just X but Y"],
  [/\bnot only\b[^.;:]{1,80}\bbut also\b/i, "banned pattern: not only X but also Y"],
  [/\bin conclusion\b/i, "filler: in conclusion"],
  [/\bembark(s|ed|ing)? on\b/i, "filler: embark on"],
  [/\btapestry\b/i, "banned word: tapestry"],
];

const EMOJI = /\p{Extended_Pictographic}/u;

export function scanStyle(text: string): string[] {
  const problems: string[] = [];
  if (text.includes("—")) problems.push("em dash (—) is not allowed");
  if (text.includes("―")) problems.push("horizontal bar is not allowed");
  if (/[·•∙]/.test(text)) problems.push("middot or bullet character used as a separator");
  if (/\s--\s/.test(text)) problems.push("double hyphen used as a dash");
  if (EMOJI.test(text)) problems.push("emoji are not allowed");
  // En dash only between numbers: 68–95, 10–20.
  for (const m of text.matchAll(/–/g)) {
    const i = m.index ?? 0;
    const before = text.slice(Math.max(0, i - 1), i);
    const after = text.slice(i + 1, i + 2);
    if (!/[0-9]/.test(before) || !/[0-9]/.test(after)) {
      problems.push("en dash (–) used outside a number range");
      break;
    }
  }
  for (const [re, msg] of BANNED) if (re.test(text)) problems.push(msg);
  return problems;
}
