import { useCallback, useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import {
  clearSession,
  loadPlayer,
  loadSession,
  savePlayer,
  saveSession,
  type Session,
} from './session';

const PUBLIC_IDLE_MS = 5 * 60 * 1000;

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [playing, setPlaying] = useState(false);
  const [wiped, setWiped] = useState(false);
  const idleTimer = useRef<number | null>(null);

  // Public computer: wipe session after 5 min of inactivity
  useEffect(() => {
    if (!session?.isPublic) return;
    const arm = () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        clearSession();
        setSession(null);
        setPlaying(false);
        setWiped(true);
      }, PUBLIC_IDLE_MS);
    };
    arm();
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, arm));
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [session?.isPublic]);

  const start = useCallback((s: Session) => {
    let merged = s;
    if (!s.isPublic) {
      // returning player: restore their persistent record
      const saved = loadPlayer(s.name);
      merged = { ...s, best: Math.max(saved?.best ?? 0, s.best) };
      savePlayer(merged);
    }
    saveSession(merged);
    setSession(merged);
    setWiped(false);
    setPlaying(true);
  }, []);

  const updateSession = useCallback((s: Session) => {
    saveSession(s);
    if (!s.isPublic) savePlayer(s);
    setSession(s);
  }, []);

  const exit = useCallback(() => {
    setPlaying(false);
  }, []);

  if (playing && session) {
    return <GameScreen session={session} onSessionChange={updateSession} onExit={exit} />;
  }
  return <StartScreen initial={session} wiped={wiped} onStart={start} />;
}
