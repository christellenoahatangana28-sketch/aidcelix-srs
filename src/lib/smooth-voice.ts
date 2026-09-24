"use client";

const NATURAL = /natural|neural|online|premium|enhanced|wavenet|google/;
const ROBOTIC = /espeak|zira|david|mark|hazel|fred|albert|hortense|compact|bad news|bahh|bells|boing|whisper|trinoids|zarvox/;
const MALE =
  /google uk english male|\bmale\b|\bguy\b|\bbrian\b|\bandrew\b|\bryan\b|\bdavis\b|\bdaniel\b|\balex\b|\baaron\b|\bchristopher\b|\beric\b|\bhenri\b|\bpaul\b|\bclaude\b|\bthomas\b|\bnicolas\b|\bmathieu\b|remy|rémy/;

let generation = 0;

function languageOf(locale: "en" | "fr") {
  return locale === "fr" ? "fr" : "en";
}

function scoreVoice(voice: SpeechSynthesisVoice, locale: "en" | "fr"): number | null {
  const lang = languageOf(locale);
  const name = voice.name.toLowerCase();
  const voiceLang = voice.lang.toLowerCase();
  if (!voiceLang.startsWith(lang)) return null;
  let score = 20;
  if (NATURAL.test(name)) score += 100;
  if (MALE.test(name)) score += 45;
  if (voice.localService === false) score += 25;
  if (ROBOTIC.test(name)) score -= 140;
  if (locale === "fr" && name.includes("google")) score += 20;
  if (voiceLang === (locale === "fr" ? "fr-fr" : "en-gb") || voiceLang === "en-us") score += 5;
  return score;
}

export function pickSmoothVoice(locale: "en" | "fr") {
  const ranked = window.speechSynthesis
    .getVoices()
    .flatMap((voice) => {
      const score = scoreVoice(voice, locale);
      return score === null ? [] : [{ voice, score }];
    })
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  return ranked.find((row) => row.score >= 80) ?? ranked[0];
}

function spokenText(text: string) {
  return text.replace(/\bAidcel\b/g, "Aid-cel").replace(/\bAIDCELIX\b/g, "Aid-celix");
}

function voicesReady() {
  if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", finish);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish);
    window.speechSynthesis.getVoices();
    window.setTimeout(finish, 800);
  });
}

export function stopSpeaking() {
  generation += 1;
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

export function speakSmooth(text: string, locale: "en" | "fr") {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  const token = ++generation;
  window.speechSynthesis.cancel();

  return voicesReady().then(
    () =>
      new Promise<void>((resolve) => {
        if (token !== generation) {
          resolve();
          return;
        }
        const picked = pickSmoothVoice(locale);
        const smooth = Boolean(picked && picked.score >= 80);
        const lines = spokenText(text)
          .split(/(?<=[.!?])\s+/)
          .map((part) => part.trim())
          .filter(Boolean);
        const queue = lines.length > 0 ? lines : [text];

        const speakAt = (index: number) => {
          if (token !== generation || index >= queue.length) {
            resolve();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(queue[index]);
          if (picked) utterance.voice = picked.voice;
          utterance.lang = locale === "fr" ? "fr-FR" : "en-GB";
          utterance.rate = smooth ? 0.94 : 0.9;
          utterance.pitch = smooth ? 0.96 : 0.86;
          utterance.volume = 1;
          utterance.onend = () => window.setTimeout(() => speakAt(index + 1), smooth ? 120 : 200);
          utterance.onerror = () => resolve();
          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        };

        window.setTimeout(() => speakAt(0), 40);
      }),
  );
}
