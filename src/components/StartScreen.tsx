import { useState } from 'react';
import { LANGS, makeT, type Lang } from '../i18n';
import { THEMES, getTheme } from '../themes';
import type { Mode, Session } from '../session';

interface Props {
  initial: Session | null;
  wiped: boolean;
  onStart: (s: Session) => void;
}

export default function StartScreen({ initial, wiped, onStart }: Props) {
  const [lang, setLang] = useState<Lang>(initial?.lang ?? 'en');
  const [name, setName] = useState(initial?.name ?? '');
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? false);
  const [themeId, setThemeId] = useState(initial?.themeId ?? 'classic');
  const [mode, setMode] = useState<Mode>(initial?.mode ?? 'normal');

  const t = makeT(lang);
  const theme = getTheme(themeId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onStart({
      name: trimmed,
      isPublic,
      lang,
      themeId,
      mode,
      best: initial?.best ?? 0,
      sound: initial?.sound ?? true,
    });
  };

  return (
    <div
      className="min-h-full flex items-center justify-center p-4"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl"
        style={{ background: 'rgba(0,0,0,0.25)', border: `2px solid ${theme.panelBorder}` }}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-1 drop-shadow">
          🧠 {t('title')}
        </h1>
        {wiped && (
          <p className="text-center text-sm mt-2 opacity-90">{t('sessionWiped')}</p>
        )}

        <label className="block mt-6 text-lg font-bold">{t('yourName')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('namePlaceholder')}
          maxLength={20}
          autoFocus
          className="mt-2 w-full rounded-2xl px-4 py-3 text-xl text-gray-900 outline-none focus:ring-4"
          style={{ ['--tw-ring-color' as string]: theme.accent }}
        />

        <label className="flex items-start gap-3 mt-4 cursor-pointer text-sm leading-snug">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-blue-500"
          />
          <span>{t('publicComputer')}</span>
        </label>

        <label className="block mt-5 text-lg font-bold">{t('language')}</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLang(l.id)}
              className="rounded-xl px-2 py-2 text-sm font-bold transition"
              style={{
                background: lang === l.id ? theme.accent : 'rgba(255,255,255,0.15)',
                color: lang === l.id ? '#111827' : theme.text,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="block mt-5 text-lg font-bold">{t('theme')}</label>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setThemeId(th.id)}
              title={th.label}
              className="h-12 rounded-xl transition"
              style={{
                background: th.button,
                outline: themeId === th.id ? `3px solid ${th.accent}` : '2px solid rgba(255,255,255,0.2)',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>

        <label className="block mt-5 text-lg font-bold">{t('mode')}</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(['normal', 'hard'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded-xl px-3 py-3 text-sm font-bold transition"
              style={{
                background: mode === m ? theme.accent : 'rgba(255,255,255,0.15)',
                color: mode === m ? '#111827' : theme.text,
              }}
            >
              {t(m)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          className="mt-7 w-full rounded-2xl py-4 text-2xl font-extrabold transition disabled:opacity-40 shadow-lg"
          style={{ background: theme.accent, color: '#111827' }}
        >
          {t('start')} ▶
        </button>
      </div>
    </div>
  );
}
