// Near-duplicate detection for question stems: Jaccard similarity of word
// bigrams after normalization. Numbers are kept so that the same template with
// different values is not flagged.

export function normalizeStem(s: string): string {
  return s
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/\s+/g, " "))
    .replace(/[`*_$\\|#>]/g, " ")
    .replace(/[^a-z0-9.%\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cache = new Map<string, Set<string>>();

function bigrams(s: string): Set<string> {
  const hit = cache.get(s);
  if (hit) return hit;
  const words = s.split(" ");
  const set = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) set.add(`${words[i]} ${words[i + 1]}`);
  if (words.length === 1) set.add(words[0]);
  cache.set(s, set);
  return set;
}

export function similarity(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  const smaller = A.size < B.size ? A : B;
  const larger = A.size < B.size ? B : A;
  // Quick reject: the overlap can be at most the smaller set.
  if (smaller.size / larger.size < 0.85) return 0;
  let inter = 0;
  for (const x of smaller) if (larger.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}
