export type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number };
};

export function readableTranscript(words: OcrWord[], fallback: string, fallbackConfidence: number) {
  const kept = words.filter((word) => {
    const token = word.text.trim();
    const letters = /[A-Za-zÀ-ÿ]{3,}/.test(token);
    const dose = /^\d{2,4}$/.test(token);
    if (letters && word.confidence >= 50) return true;
    if (dose && word.confidence >= 45) return true;
    return false;
  });
  if (kept.length === 0) return { text: "", confidence: fallbackConfidence };

  const sorted = [...kept].sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
  const lines: string[][] = [];
  let lineY = sorted[0].bbox.y0;
  let bucket: string[] = [];
  for (const word of sorted) {
    if (bucket.length > 0 && Math.abs(word.bbox.y0 - lineY) > 16) {
      lines.push(bucket);
      bucket = [];
      lineY = word.bbox.y0;
    }
    bucket.push(word.text.trim());
  }
  if (bucket.length > 0) lines.push(bucket);

  const confidence = kept.reduce((sum, word) => sum + word.confidence, 0) / kept.length;
  const text = lines.map((line) => line.join(" ")).join("\n").trim();
  if (!text) return { text: "", confidence };
  if (confidence < 50) return { text: "", confidence };
  return { text, confidence: confidence || fallbackConfidence };
}
