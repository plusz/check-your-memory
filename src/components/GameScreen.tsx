import { useCallback, useEffect, useRef, useState } from 'react';
import { LANGS, makeT } from '../i18n';
import { THEMES, getTheme } from '../themes';
import { playButton, playError, playRoundDone, setMuted } from '../sound';
import { saveSession, type Session } from '../session';

const COUNT = 8;
const NORMAL_LIMIT_MS = 10_000;
const hardLimitMs = (seqLen: number) => 2000 + 800 * seqLen;

// Sequence playback pacing — tune these to taste
const LIT_MS = 1000; // how long a button stays lit during playback
const GAP_MS = 500; // pause between lit buttons
const COUNTDOWN_MS = 800; // per tick of the 3-2-1 countdown

type Phase = 'countdown' | 'show' | 'input' | 'reveal' | 'over';

interface Props {
  session: Session;
  onSessionChange: (s: Session) => void;
  onExit: () => void;
}

const rand = () => Math.floor(Math.random() * COUNT);

export default function GameScreen({ session, onSessionChange, onExit }: Props) {
  const t = makeT(session.lang);
  const theme = getTheme(session.themeId);

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [seq, setSeq] = useState<number[]>(() => [rand()]);
  const [lit, setLit] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeFrac, setTimeFrac] = useState(1);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [revealReason, setRevealReason] = useState<'wrong' | 'timeout'>('wrong');
  const [endReason, setEndReason] = useState<'wrong' | 'timeout' | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const timeoutsRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const scoreRef = useRef(0);
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);
  useEffect(() => setMuted(!session.sound), [session.sound]);

  const limitMs = session.mode === 'hard' ? hardLimitMs(seq.length) : NORMAL_LIMIT_MS;

  // 3-2-1 countdown before the first sequence
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('show');
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), COUNTDOWN_MS);
    return () => window.clearTimeout(id);
  }, [phase, countdown]);

  // Playback of the sequence
  useEffect(() => {
    if (phase !== 'show') return;
    clearTimers();
    const litMs = LIT_MS;
    const gapMs = GAP_MS;
    seq.forEach((btn, i) => {
      const onAt = i * (litMs + gapMs);
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setLit(btn);
          playButton(btn);
        }, onAt),
        window.setTimeout(() => setLit(null), onAt + litMs),
      );
    });
    // switch to input ~150ms after the last button unlights
    const lastOffAt = seq.length * litMs + (seq.length - 1) * gapMs;
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setPhase('input');
        setInputIdx(0);
      }, lastOffAt + 150),
    );
  }, [phase, seq, clearTimers]);

  // Countdown while waiting for input
  useEffect(() => {
    if (phase !== 'input') return;
    const deadline = Date.now() + limitMs;
    setTimeFrac(1);
    intervalRef.current = window.setInterval(() => {
      const left = deadline - Date.now();
      setTimeFrac(Math.max(0, left / limitMs));
      if (left <= 0) {
        playError();
        setRevealReason('timeout');
        setPhase('reveal');
      }
    }, 50);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, limitMs]);

  const endGame = useCallback(
    (reason: 'wrong' | 'timeout') => {
      if (phaseRef.current === 'over') return;
      clearTimers();
      setEndReason(reason);
      setLit(null);
      setPhase('over');
      if (scoreRef.current > session.best) {
        setIsNewRecord(true);
        const next = { ...session, best: scoreRef.current };
        saveSession(next);
        onSessionChange(next);
      }
    },
    [clearTimers, session, onSessionChange],
  );

  // Reveal: wrong press -> blink the correct button 3x;
  // timeout -> flash every remaining (unclicked) step once
  useEffect(() => {
    if (phase !== 'reveal') return;
    const steps =
      revealReason === 'timeout'
        ? seq.slice(inputIdx)
        : [seq[inputIdx], seq[inputIdx], seq[inputIdx]];
    steps.forEach((btn, k) => {
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setLit(btn);
          playButton(btn);
        }, k * 700),
        window.setTimeout(() => setLit(null), k * 700 + 420),
      );
    });
    timeoutsRef.current.push(
      window.setTimeout(() => endGame(revealReason), steps.length * 700 + 250),
    );
  }, [phase, seq, inputIdx, revealReason, endGame]);

  const press = (i: number) => {
    if (phase !== 'input') return;
    if (i !== seq[inputIdx]) {
      setWrongIdx(i);
      playError();
      setRevealReason('wrong');
      setPhase('reveal');
      return;
    }
    playButton(i, 0.18);
    setLit(i);
    window.setTimeout(() => setLit(null), 160);
    const nextIdx = inputIdx + 1;
    if (nextIdx >= seq.length) {
      // round complete -> score = memorized sequence length
      scoreRef.current = seq.length;
      setScore(seq.length);
      // extend sequence and show again
      clearTimers();
      playRoundDone();
      setInputIdx(0);
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setSeq((s) => [...s, rand()]);
          setPhase('show');
        }, 700),
      );
    } else {
      setInputIdx(nextIdx);
    }
  };

  const playAgain = () => {
    clearTimers();
    setSeq([rand()]);
    scoreRef.current = 0;
    setScore(0);
    setInputIdx(0);
    setWrongIdx(null);
    setEndReason(null);
    setIsNewRecord(false);
    setCountdown(3);
    setPhase('countdown');
  };

  const panel = {
    background: theme.panelBg,
    border: `2px solid ${theme.panelBorder}`,
  };

  return (
    <div
      className="min-h-full flex flex-col px-3 py-3 sm:px-6 sm:py-4"
      style={{ background: theme.bg, color: theme.text }}
    >
      {/* top bar */}
      <div className="flex items-center justify-between gap-2 text-sm sm:text-base font-bold">
        <span>
          {t('hello')}, {session.name}! 👋
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-xl px-3 py-1.5"
            style={panel}
            aria-label={t('settings')}
          >
            ⚙️
          </button>
          <button
            onClick={() => onSessionChange({ ...session, sound: !session.sound })}
            className="rounded-xl px-3 py-1.5"
            style={panel}
          >
            {session.sound ? `🔊 ${t('soundOn')}` : `🔇 ${t('soundOff')}`}
          </button>
          <button onClick={onExit} className="rounded-xl px-3 py-1.5" style={panel}>
            {t('changePlayer')}
          </button>
        </div>
      </div>

      {/* score panels */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-3xl py-3 sm:py-5 text-center backdrop-blur-sm" style={panel}>
          <div className="text-sm sm:text-lg font-bold uppercase tracking-widest opacity-80">
            {t('score')}
          </div>
          <div className="text-4xl sm:text-6xl font-extrabold" style={{ color: theme.accent }}>
            {score}
          </div>
        </div>
        <div className="rounded-3xl py-3 sm:py-5 text-center backdrop-blur-sm" style={panel}>
          <div className="text-sm sm:text-lg font-bold uppercase tracking-widest opacity-80">
            {t('best')}
          </div>
          <div className="text-4xl sm:text-6xl font-extrabold">
            {Math.max(session.best, score)}
          </div>
        </div>
      </div>

      {/* status + timer */}
      <div className="mt-3 h-14 flex flex-col items-center justify-center">
        <div className="text-2xl sm:text-3xl font-extrabold drop-shadow">
          {phase === 'show' && t('watch')}
          {phase === 'input' && `${t('yourTurn')} ${inputIdx}/${seq.length}`}
          {phase === 'reveal' && t('gameOver')}
          {phase === 'over' && (endReason === 'timeout' ? t('timeUp') : t('gameOver'))}
        </div>
        {phase === 'input' && (
          <div
            className="mt-2 h-3 w-full max-w-xl rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${timeFrac * 100}%`,
                background: timeFrac > 0.35 ? theme.accent : '#ef4444',
              }}
            />
          </div>
        )}
      </div>

      {/* buttons */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 landscape:grid-cols-8 sm:grid-cols-8 gap-3 sm:gap-4 w-full max-w-4xl">
          {Array.from({ length: COUNT }, (_, i) => {
            const isLit = lit === i;
            const isWrong = wrongIdx === i;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <button
                  onPointerDown={() => press(i)}
                  className={`aspect-square w-full rounded-full transition-transform duration-150 ${isLit ? 'scale-110' : ''} ${isWrong ? 'shake' : ''}`}
                  style={{
                    background: isWrong
                      ? 'radial-gradient(circle at 35% 30%, #fca5a5, #dc2626 65%, #991b1b)'
                      : isLit
                        ? theme.buttonLit
                        : theme.button,
                    boxShadow: isLit
                      ? theme.buttonGlow
                      : '0 6px 0 rgba(0,0,0,0.25), inset 0 -6px 12px rgba(0,0,0,0.2)',
                    cursor: phase === 'input' ? 'pointer' : 'default',
                  }}
                  aria-label={`Button ${i + 1}`}
                />
                <span className="text-xl sm:text-2xl font-extrabold drop-shadow">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-2-1 countdown overlay */}
      {phase === 'countdown' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div
            key={countdown}
            className="btn-pop text-[9rem] sm:text-[14rem] font-extrabold drop-shadow-2xl"
            style={{ color: theme.accent }}
          >
            {countdown}
          </div>
        </div>
      )}

      {/* settings overlay */}
      {showSettings && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 z-20">
          <div
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: theme.bg, border: `3px solid ${theme.panelBorder}` }}
          >
            <div className="text-2xl font-extrabold text-center">⚙️ {t('settings')}</div>

            <label className="block mt-4 text-sm font-bold uppercase tracking-widest opacity-80">
              {t('language')}
            </label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSessionChange({ ...session, lang: l.id })}
                  className="rounded-xl px-2 py-2 text-xs font-bold"
                  style={{
                    background: session.lang === l.id ? theme.accent : 'rgba(255,255,255,0.15)',
                    color: session.lang === l.id ? '#111827' : theme.text,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <label className="block mt-4 text-sm font-bold uppercase tracking-widest opacity-80">
              {t('theme')}
            </label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onSessionChange({ ...session, themeId: th.id })}
                  title={th.label}
                  className="h-10 rounded-xl"
                  style={{
                    background: th.button,
                    outline:
                      session.themeId === th.id
                        ? `3px solid ${th.accent}`
                        : '2px solid rgba(255,255,255,0.2)',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>

            <label className="block mt-4 text-sm font-bold uppercase tracking-widest opacity-80">
              {t('mode')}
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(['normal', 'hard'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onSessionChange({ ...session, mode: m })}
                  className="rounded-xl px-3 py-2 text-xs font-bold"
                  style={{
                    background: session.mode === m ? theme.accent : 'rgba(255,255,255,0.15)',
                    color: session.mode === m ? '#111827' : theme.text,
                  }}
                >
                  {t(m)}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onSessionChange({ ...session, best: 0 });
                setResetDone(true);
                window.setTimeout(() => setResetDone(false), 2500);
              }}
              className="mt-5 w-full rounded-2xl py-3 font-bold"
              style={{ background: '#dc2626', color: '#fff' }}
            >
              🗑️ {t('resetBest')}
            </button>
            {resetDone && (
              <p className="mt-2 text-center text-sm font-bold" style={{ color: theme.accent }}>
                {t('resetDone')}
              </p>
            )}

            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full rounded-2xl py-3 font-extrabold"
              style={{ background: theme.accent, color: '#111827' }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* game over overlay */}
      {phase === 'over' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
            style={{ background: theme.bg, border: `3px solid ${theme.panelBorder}` }}
          >
            <div className="text-4xl font-extrabold">
              {endReason === 'timeout' ? `⏰ ${t('timeUp')}` : `😢 ${t('gameOver')}`}
            </div>
            {isNewRecord && (
              <div className="mt-3 text-2xl font-extrabold" style={{ color: theme.accent }}>
                🏆 {t('newRecord')}
              </div>
            )}
            <div className="mt-4 text-xl font-bold">
              {t('score')}: <span style={{ color: theme.accent }}>{score}</span>
            </div>
            <div className="text-xl font-bold">
              {t('best')}: {Math.max(session.best, score)}
            </div>
            <button
              onClick={playAgain}
              className="mt-6 w-full rounded-2xl py-4 text-xl font-extrabold shadow-lg"
              style={{ background: theme.accent, color: '#111827' }}
            >
              {t('playAgain')} ▶
            </button>
            <button
              onClick={onExit}
              className="mt-3 w-full rounded-2xl py-3 font-bold"
              style={panel}
            >
              {t('changePlayer')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
