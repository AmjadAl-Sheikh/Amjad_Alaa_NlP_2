import { useState, useRef, useCallback, useEffect } from "react";

export type SpeechState = "idle" | "listening" | "speaking";

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface UseSpeechReturn {
  state: SpeechState;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useSpeech(onTranscript?: (text: string) => void): UseSpeechReturn {
  const [state, setState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
    "speechSynthesis" in window;

  useEffect(() => {
    if (!isSupported) return;
    synthRef.current = window.speechSynthesis;
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (synthRef.current?.speaking) synthRef.current.cancel();

    const SpeechRecognitionImpl =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) return;

    const rec = new SpeechRecognitionImpl();
    rec.lang = "ar-PS";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState("listening");
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = final || interim;
      setTranscript(current);
      if (final && onTranscript) onTranscript(final);
    };
    rec.onend = () => {
      setState("idle");
      setTranscript("");
    };
    rec.onerror = () => {
      setState("idle");
      setTranscript("");
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isSupported, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("idle");
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const sentences = clean.split(/(?<=[.،؟!])\s+/).filter(Boolean);
    const chunks = sentences.length > 1 ? sentences : (clean.match(/.{1,180}/g) ?? [clean]);

    const voices = synthRef.current.getVoices();
    const arVoice =
      voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith("ar")) ||
      voices.find(v => v.lang === "ar-SA") ||
      voices.find(v => v.lang === "ar-EG") ||
      voices.find(v => v.lang.startsWith("ar"));

    let idx = 0;
    const speakChunk = () => {
      if (idx >= chunks.length) { setState("idle"); return; }
      const utt = new SpeechSynthesisUtterance(chunks[idx++]);
      utt.lang = "ar";
      utt.rate = 1.35;
      utt.pitch = 0.9;
      utt.volume = 1.0;
      if (arVoice) utt.voice = arVoice;
      utt.onend = speakChunk;
      utt.onerror = () => setState("idle");
      setState("speaking");
      synthRef.current!.speak(utt);
    };

    if (synthRef.current.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakChunk();
    } else {
      speakChunk();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    setState("idle");
  }, []);

  return { state, transcript, startListening, stopListening, speak, stopSpeaking, isSupported };
}
