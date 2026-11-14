import type { Lang } from './i18n';

export type Mode = 'normal' | 'hard' | 'expert' | 'master';

export interface Session {
  name: string;
  isPublic: boolean;
  lang: Lang;
  themeId: string;
  mode: Mode;
  best: number;
  sound: boolean;
}

const KEY = 'check-your-memory:session';

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.name) return null;
    return {
      name: s.name,
      isPublic: !!s.isPublic,
      lang: s.lang,
      themeId: s.themeId,
      mode: s.mode,
      best: s.best ?? 0,
      sound: s.sound ?? true,
    };
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}

// --- Persistent per-player records (localStorage; skipped on public computers) ---

export interface PlayerRecord {
  name: string;
  best: number;
  lang: Lang;
  themeId: string;
  mode: Mode;
}

const PLAYERS_KEY = 'check-your-memory:players';

function loadPlayers(): Record<string, PlayerRecord> {
  try {
    return JSON.parse(localStorage.getItem(PLAYERS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function loadPlayer(name: string): PlayerRecord | null {
  return loadPlayers()[name.trim().toLowerCase()] ?? null;
}

export function savePlayer(s: Session) {
  const players = loadPlayers();
  players[s.name.trim().toLowerCase()] = {
    name: s.name,
    best: s.best,
    lang: s.lang,
    themeId: s.themeId,
    mode: s.mode,
  };
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}
