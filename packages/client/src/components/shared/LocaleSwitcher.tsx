import { useLocaleStore } from '../../stores/localeStore.js';

const OPTIONS = [
  { value: 'zh-CN' as const, label: '中文' },
  { value: 'en-US' as const, label: 'English' },
];

export function LocaleSwitcher() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/45 p-1 text-sm text-stone-100 shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-md">
      {OPTIONS.map((option) => {
        const active = locale === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option.value)}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${active ? 'bg-amber-200 text-stone-900' : 'text-stone-100 hover:bg-white/10'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}