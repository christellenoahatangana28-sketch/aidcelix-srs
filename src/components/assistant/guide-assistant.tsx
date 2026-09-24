"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AudioLines, Send, Volume2, VolumeX, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n";
import { GUIDE_STARTERS, guideReply, guideWelcome, type GuideReply } from "@/lib/assistant-guide";
import { speakSmooth, stopSpeaking } from "@/lib/smooth-voice";

type Turn = {
  id: number;
  from: "aidcel" | "user";
  text: string;
  href?: string;
  link?: string;
};

const VOICE_KEY = "aidcelix.aidcel.voice";

export function GuideAssistant() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [draft, setDraft] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const speechRef = useRef(0);
  const greeted = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VOICE_KEY);
      if (stored === "off") setVoiceOn(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, open]);

  useEffect(() => {
    if (open) return;
    stopSpeaking();
    setSpeaking(false);
  }, [open]);

  function say(text: string) {
    if (!voiceOn) return;
    const mine = ++speechRef.current;
    setSpeaking(true);
    void speakSmooth(text, locale).finally(() => {
      if (mine === speechRef.current) setSpeaking(false);
    });
  }

  function pushAidcel(reply: GuideReply) {
    idRef.current += 1;
    setTurns((current) => [...current, { id: idRef.current, from: "aidcel", ...reply }]);
    say(reply.text);
  }

  function openPanel() {
    setOpen(true);
    if (greeted.current) return;
    greeted.current = true;
    pushAidcel({ text: guideWelcome(locale, user?.role ?? null) });
  }

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    idRef.current += 1;
    setTurns((current) => [...current, { id: idRef.current, from: "user", text: trimmed }]);
    setDraft("");
    pushAidcel(guideReply(trimmed, locale, user?.role ?? null));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  function toggleVoice() {
    setVoiceOn((current) => {
      const next = !current;
      try {
        localStorage.setItem(VOICE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      if (!next) {
        stopSpeaking();
        setSpeaking(false);
      }
      return next;
    });
  }

  const starters = user?.role === "pharmacy" ? GUIDE_STARTERS[locale].pharmacy : GUIDE_STARTERS[locale].customer;

  if (!open) {
    return (
      <button
        type="button"
        data-press
        onClick={openPanel}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-black/40 hover:bg-emerald-300"
        aria-label={t.assistantOpen}
      >
        <AudioLines className="h-5 w-5" />
        {t.assistantName}
      </button>
    );
  }

  return (
    <section
      className="fixed bottom-5 right-5 z-40 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#07140f]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
      aria-label={t.assistantName}
    >
      <header className="flex items-start gap-3 border-b border-white/10 px-4 py-3">
        <span className="relative grid h-10 w-10 place-items-center rounded-full bg-emerald-400 text-black">
          <AudioLines className={`h-5 w-5 ${speaking ? "animate-pulse" : ""}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">{t.assistantName}</p>
          <p className="truncate text-xs text-white/60">{speaking ? t.assistantSpeaking : t.assistantSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={toggleVoice}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-pressed={voiceOn}
          aria-label={voiceOn ? t.assistantVoiceOn : t.assistantVoiceOff}
        >
          {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label={t.assistantClose}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={listRef} className="flex max-h-[22rem] flex-col gap-3 overflow-y-auto px-4 py-4">
        {turns.map((turn) =>
          turn.from === "user" ? (
            <p key={turn.id} className="ml-8 rounded-2xl rounded-br-md bg-white px-3 py-2 text-sm text-black">
              {turn.text}
            </p>
          ) : (
            <div key={turn.id} className="mr-6 rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-sm leading-relaxed text-white">
              <p>{turn.text}</p>
              {turn.href && turn.link ? (
                <Link href={turn.href} prefetch data-press className="mt-2 inline-block font-semibold text-emerald-300 hover:text-emerald-200">
                  {turn.link}
                </Link>
              ) : null}
            </div>
          ),
        )}
        <div className="flex flex-wrap gap-2">
          {starters.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => ask(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-white/10 p-3">
        <label className="sr-only" htmlFor="aidcel-question">
          {t.assistantPlaceholder}
        </label>
        <input
          id="aidcel-question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.assistantPlaceholder}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400"
        />
        <button
          type="submit"
          data-press
          className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400 text-black hover:bg-emerald-300"
          aria-label={t.assistantSend}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
