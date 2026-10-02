/**
 * History management via localStorage.
 */
import type { AnalysisResult } from "./scamDetector";

const HISTORY_KEY = "scamshield_history";
const MAX_ENTRIES = 20;

export interface HistoryEntry {
  id: string;
  message: string;
  score: number;
  verdict: string;
  level: "low" | "medium" | "high";
  extreme: boolean;
  timestamp: number;
  firstFlag: string | null; // first matched phrase, or null if none
}

function encode(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* localStorage full or unavailable — silently fail */
  }
}

function decode(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  return decode();
}

export function addHistoryEntry(result: AnalysisResult): HistoryEntry[] {
  const entries = decode();
  const entry: HistoryEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    message: result.message,
    score: result.score,
    verdict: result.verdict,
    level: result.level,
    extreme: result.extreme,
    timestamp: Date.now(),
    firstFlag: result.flags.length > 0 ? result.flags[0].phrase : null,
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  encode(entries);
  return entries;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* noop */
  }
}