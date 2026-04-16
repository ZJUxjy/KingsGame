import { useState } from 'react';
import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { CIVILIZATION_META, CIVILIZATION_ORDER, type Civilization } from '@king-card/shared';
import { useGameStore } from '../../stores/gameStore.js';
import { useLocaleStore } from '../../stores/localeStore.js';
import { getCardDisplayText } from '../../utils/cardText.js';

const EMPEROR_OPTIONS = ALL_EMPEROR_DATA_LIST.map((emperorData, index) => ({
  index,
  data: emperorData,
}));

type EmperorOption = (typeof EMPEROR_OPTIONS)[number];

export default function HeroSelect() {
  const joinGame = useGameStore((s) => s.joinGame);
  const joinPvp = useGameStore((s) => s.joinPvp);
  const gameMode = useGameStore((s) => s.gameMode);
  const connected = useGameStore((s) => s.connected);
  const error = useGameStore((s) => s.error);
  const reset = useGameStore((s) => s._reset);
  const locale = useLocaleStore((state) => state.locale);
  const [selectedCivilization, setSelectedCivilization] = useState<Civilization | null>(null);
  const [selectedEmperorIndex, setSelectedEmperorIndex] = useState<number | null>(null);

  const civilizationEmperors = selectedCivilization === null
    ? []
    : EMPEROR_OPTIONS.filter(({ data }: EmperorOption) => data.emperorCard.civilization === selectedCivilization);

  const step1Label = locale === 'en-US' ? 'Step 1' : '步骤 1';
  const step2Label = locale === 'en-US' ? 'Step 2' : '步骤 2';
  const heading = locale === 'en-US' ? 'Choose Your Civilization' : '选择你的文明';
  const intro = locale === 'en-US'
    ? 'Pick a civilization first, then choose an emperor from that roster.'
    : '先决定文明阵营，再从该文明的帝王中选择出战领袖。';
  const backLabel = locale === 'en-US' ? 'Back To Main Menu' : '返回主菜单';
  const emperorSectionTitle = selectedCivilization === null
    ? locale === 'en-US' ? 'Choose An Emperor' : '选择帝王'
    : locale === 'en-US'
      ? `${CIVILIZATION_META[selectedCivilization].name} Emperors`
      : `${CIVILIZATION_META[selectedCivilization].name} 帝王`;
  const emperorSectionIntro = selectedCivilization === null
    ? locale === 'en-US'
      ? 'Select a civilization above before locking in your emperor.'
      : '请选择上方文明后，再从对应帝王中确认出战阵容。'
    : locale === 'en-US'
      ? 'The emperor pool switches with civilization to prevent cross-civilization picks.'
      : '帝王池会随文明切换，避免出现跨文明选择。';
  const currentCivilizationLabel = locale === 'en-US' ? 'Current Civilization' : '当前文明';
  const civilizationNotSelectedLabel = locale === 'en-US' ? 'No civilization selected yet' : '文明尚未选定';
  const emperorCountSuffix = locale === 'en-US' ? 'emperors' : '位帝王';
  const costLabel = locale === 'en-US' ? 'Cost' : '费用';
  const healthLabel = locale === 'en-US' ? 'Health' : '体力';
  const skillCostLabel = locale === 'en-US' ? 'Skill Cost' : '技能费用';
  const emperorSkillLabel = locale === 'en-US' ? 'Hero Skill' : '帝王技能';
  const connectingLabel = locale === 'en-US' ? 'Connecting to server...' : '正在连接服务器...';
  const startLabel = gameMode === 'pvp'
    ? locale === 'en-US' ? 'Find Opponent' : '匹配对手'
    : locale === 'en-US' ? 'Start Battle' : '开始对战';

  const handleStart = () => {
    if (selectedEmperorIndex === null) {
      return;
    }

    if (gameMode === 'pvp') {
      joinPvp(selectedEmperorIndex);
    } else {
      joinGame(selectedEmperorIndex);
    }
  };

  const handleCivilizationSelect = (civilization: Civilization) => {
    setSelectedCivilization(civilization);
    setSelectedEmperorIndex(null);
  };

  return (
    <div className="min-h-screen bg-board-gradient px-6 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
        <div className="mb-10 flex w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            <p className="mb-3 text-sm uppercase tracking-[0.45em] text-yellow-200/70">{step1Label}</p>
            <h2 className="text-4xl font-bold text-yellow-400">{heading}</h2>
            <p className="mt-3 text-base text-stone-300">{intro}</p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-stone-500/80 bg-stone-950/60 px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-yellow-400/70 hover:text-yellow-100"
          >
            {backLabel}
          </button>
        </div>

        <div className="mb-10 grid w-full gap-5 md:grid-cols-2 xl:grid-cols-5">
          {CIVILIZATION_ORDER.map((civilization) => {
            const meta = CIVILIZATION_META[civilization];
            const emperorCount = EMPEROR_OPTIONS.filter(
              ({ data }: EmperorOption) => data.emperorCard.civilization === civilization,
            ).length;
            const isSelected = selectedCivilization === civilization;

            return (
              <button
                key={civilization}
                onClick={() => handleCivilizationSelect(civilization)}
                className={`rounded-3xl border px-6 py-7 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-yellow-300 bg-stone-950/85 shadow-lg shadow-yellow-950/40'
                    : 'border-stone-700/80 bg-stone-950/65 hover:border-yellow-500/70 hover:bg-stone-950/80'
                }`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-4xl text-yellow-300">{meta.icon}</span>
                  <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
                    {emperorCount} {emperorCountSuffix}
                  </span>
                </div>
                <div className="text-2xl font-bold text-stone-100">{meta.name}</div>
                <div className="mt-3 text-sm leading-6 text-stone-400">{meta.description}</div>
              </button>
            );
          })}
        </div>

        <div className="mb-12 w-full rounded-[28px] border border-stone-700/80 bg-stone-950/70 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.45em] text-yellow-200/70">{step2Label}</p>
              <h3 className="text-3xl font-bold text-yellow-100">
                {emperorSectionTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                {emperorSectionIntro}
              </p>
            </div>

            {selectedCivilization !== null && (
              <div className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-300">
                {currentCivilizationLabel}: {CIVILIZATION_META[selectedCivilization].name}
              </div>
            )}
          </div>

          {selectedCivilization === null ? (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-700 px-6 py-12 text-center text-stone-400">
              {civilizationNotSelectedLabel}
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-5">
              {civilizationEmperors.map(({ index, data }: EmperorOption) => {
                const isSelected = selectedEmperorIndex === index;
                const emperor = getCardDisplayText(data.emperorCard, locale);

                return (
                  <button
                    key={data.emperorCard.id}
                    onClick={() => setSelectedEmperorIndex(index)}
                    className={`min-h-72 flex-1 basis-80 rounded-3xl border p-6 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-yellow-300 bg-yellow-950/20 shadow-lg shadow-yellow-950/40'
                        : 'border-stone-700/80 bg-stone-900/70 hover:border-yellow-500/70 hover:bg-stone-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-bold text-yellow-100">{emperor.name}</div>
                        <div className="mt-2 text-sm text-stone-400">{emperor.description}</div>
                      </div>
                      <div className="rounded-full border border-stone-600 px-3 py-1 text-xs text-stone-300">
                        {costLabel} {data.emperorCard.cost}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 text-sm text-stone-300 md:grid-cols-2">
                      <div className="rounded-2xl bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{healthLabel}</div>
                        <div className="mt-2 text-lg font-semibold text-stone-100">{data.emperorCard.health}</div>
                      </div>
                      <div className="rounded-2xl bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{skillCostLabel}</div>
                        <div className="mt-2 text-lg font-semibold text-stone-100">{data.emperorCard.heroSkill?.cost ?? '-'}</div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-stone-800 bg-black/20 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.3em] text-stone-500">{emperorSkillLabel}</div>
                      <div className="mt-2 text-base font-semibold text-yellow-50">{emperor.heroSkill?.name}</div>
                      <div className="mt-2 text-sm text-stone-300">{emperor.heroSkill?.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/80 px-6 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!connected && !error && (
          <div className="mb-4 rounded-lg bg-yellow-900/80 px-6 py-2 text-sm text-yellow-200 animate-pulse">
            {connectingLabel}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleStart}
            disabled={selectedEmperorIndex === null || !connected}
            className={`rounded-xl px-12 py-4 text-xl font-bold transition-all duration-200 ${
              selectedEmperorIndex !== null && connected
                ? 'cursor-pointer bg-yellow-600 text-white hover:bg-yellow-500'
                : 'cursor-not-allowed bg-gray-700 text-gray-500'
            }`}
          >
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
