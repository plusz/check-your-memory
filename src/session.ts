import type { Lang } from './i18n';

export type Mode = 'normal' | 'hard';

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
