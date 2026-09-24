export type LabeledMedication = {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  dosage: string;
};

const STOP = new Set([
  "acid",
  "acids",
  "adult",
  "apres",
  "avant",
  "avec",
  "boite",
  "boites",
  "cachet",
  "capsule",
  "capsules",
  "chez",
  "cold",
  "combo",
  "comprime",
  "comprimes",
  "cp",
  "cps",
  "cream",
  "creme",
  "dans",
  "date",
  "dose",
  "doses",
  "fois",
  "gelule",
  "gelules",
  "inhaler",
  "jour",
  "jours",
  "lotion",
  "matin",
  "medicament",
  "medicaments",
  "medecin",
  "mg",
  "midi",
  "ml",
  "nom",
  "notice",
  "nuit",
  "oral",
  "ordonnance",
  "pack",
  "patient",
  "pendant",
  "pharmacie",
  "pommade",
  "pour",
  "prise",
  "prises",
  "repas",
  "sachet",
  "sachets",
  "salts",
  "sans",
  "signature",
  "sirop",
  "soir",
  "solution",
  "sulfate",
  "sulphate",
  "suspension",
  "syrup",
  "tablet",
  "tablets",
  "vial",
  "voie",
]);

const ALIASES: Record<string, string> = {
  acetylsalicylique: "acetylsalicylic",
  ascorbique: "ascorbic",
  clavulanique: "clavulanic",
  folique: "folic",
  insuline: "insulin",
  metformine: "metformin",
  nystatine: "nystatin",
  rehydratation: "rehydration",
  sro: "ors",
  ventoline: "ventolin",
  vitamine: "vitamin",
  vitamines: "vitamin",
};

const SHORT = new Set(["ors"]);

const FORM_RULES: { pattern: RegExp; product: RegExp }[] = [
  { pattern: /\b(sirop|syrup|suspension)\b/, product: /syrup|suspension/i },
  { pattern: /\b(inhalateur|inhaler|spray)\b/, product: /inhaler/i },
  { pattern: /\b(creme|cream|pommade|lotion)\b/, product: /cream|lotion/i },
  { pattern: /\b(sachet|sachets)\b/, product: /sachet/i },
];

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function words(value: string) {
  return fold(value).split(/[^a-z0-9]+/).filter(Boolean);
}

function expandText(value: string) {
  const tokens = words(value);
  const extra: string[] = [];
  for (const word of tokens) {
    const alias = ALIASES[word];
    if (alias) extra.push(alias);
    if (word.length >= 7 && word.endsWith("e") && !STOP.has(word)) extra.push(word.slice(0, -1));
  }
  return [...tokens, ...extra].join(" ");
}

function significant(value: string) {
  return words(value).filter((word) => (word.length >= 4 || SHORT.has(word)) && !STOP.has(word));
}

function containsWord(haystack: string, needle: string) {
  return new RegExp(`(?:^|[^a-z0-9])${needle}(?:[^a-z0-9]|$)`).test(haystack);
}

function numbers(value: string) {
  return new Set(
    (value.match(/\d+(?:[.,]\d+)?/g) ?? []).filter((token) => {
      const numeric = Number(token.replace(",", "."));
      return numeric >= 10 || token.includes(".") || token.includes(",");
    }),
  );
}

function lineFor(text: string, token: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => containsWord(expandText(line), token)) ?? text;
}

export function matchPrescription<T extends LabeledMedication>(text: string, items: T[]): T[] {
  const expanded = expandText(text);
  const scored = items.flatMap((item) => {
    const keys = [...new Set([item.name, item.genericName, item.brand].flatMap(significant))];
    const matched = keys.filter((key) => containsWord(expanded, key));
    if (matched.length === 0) return [];

    const extras = item.genericName
      .split("+")
      .slice(1)
      .flatMap(significant);
    const conditional =
      extras.length > 0 && !extras.some((token) => containsWord(expanded, token));

    const focus = lineFor(text, matched[0]);
    let score = matched.length * 2;
    for (const token of numbers(item.dosage)) {
      if (numbers(focus).has(token)) score += 3;
    }
    const foldedLine = fold(focus);
    const productText = `${item.name} ${item.dosage}`;
    for (const rule of FORM_RULES) {
      if (!rule.pattern.test(foldedLine)) continue;
      score += rule.product.test(productText) ? 3 : -1;
    }

    return [{ item, score, conditional }];
  });

  const hasPlain = scored.some((row) => !row.conditional);
  const kept = hasPlain ? scored.filter((row) => !row.conditional) : scored;
  if (kept.length === 0) return [];
  const best = Math.max(...kept.map((row) => row.score));
  return kept
    .filter((row) => row.score >= best - 2)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map((row) => row.item);
}
