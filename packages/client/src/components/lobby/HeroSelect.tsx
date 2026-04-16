import { useState } from 'react';
import { ALL_EMPEROR_DATA_LIST } from '@king-card/core';
import { CIVILIZATION_META, CIVILIZATION_ORDER, type Civilization } from '@king-card/shared';
import { useGameStore } from '../../stores/gameStore.js';

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
  const [selectedCivilization, setSelectedCivilization] = useState<Civilization | null>(null);
  const [selectedEmperorIndex, setSelectedEmperorIndex] = useState<number | null>(null);

  const civilizationEmperors = selectedCivilization === null
    ? []
    : EMPEROR_OPTIONS.filter(({ data }: EmperorOption) => data.emperorCard.civilization === selectedCivilization);

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
            <p className="mb-3 text-sm uppercase tracking-[0.45em] text-yellow-200/70">Step 1</p>
            <h2 className="text-4xl font-bold text-yellow-400">选择你的文明</h2>
            <p className="mt-3 text-base text-stone-300">先决定文明阵营，再从该文明的帝王中选择出战领袖。</p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-stone-500/80 bg-stone-950/60 px-5 py-3 text-sm font-bold text-stone-100 transition hover:border-yellow-400/70 hover:text-yellow-100"
          >
            返回主菜单
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
                    {emperorCount} 位帝王
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
              <p className="mb-2 text-sm uppercase tracking-[0.45em] text-yellow-200/70">Step 2</p>
              <h3 className="text-3xl font-bold text-yellow-100">
                {selectedCivilization === null
                  ? '选择帝王'
                  : `${CIVILIZATION_META[selectedCivilization].name} 帝王`}
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                {selectedCivilization === null
                  ? '请选择上方文明后，再从对应帝王中确认出战阵容。'
                  : '帝王池会随文明切换，避免出现跨文明选择。'}
              </p>
            </div>

            {selectedCivilization !== null && (
              <div className="rounded-full border border-stone-600 px-4 py-2 text-sm text-stone-300">
                当前文明：{CIVILIZATION_META[selectedCivilization].name}
              </div>
            )}
          </div>

          {selectedCivilization === null ? (
            <div className="mt-8 rounded-2xl border border-dashed border-stone-700 px-6 py-12 text-center text-stone-400">
              文明尚未选定
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-5">
              {civilizationEmperors.map(({ index, data }: EmperorOption) => {
                const isSelected = selectedEmperorIndex === index;

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
                        <div className="text-2xl font-bold text-yellow-100">{data.emperorCard.name}</div>
                        <div className="mt-2 text-sm text-stone-400">{data.emperorCard.description}</div>
                      </div>
                      <div className="rounded-full border border-stone-600 px-3 py-1 text-xs text-stone-300">
                        费用 {data.emperorCard.cost}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 text-sm text-stone-300 md:grid-cols-2">
                      <div className="rounded-2xl bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.3em] text-stone-500">体力</div>
                        <div className="mt-2 text-lg font-semibold text-stone-100">{data.emperorCard.health}</div>
                      </div>
                      <div className="rounded-2xl bg-black/20 px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.3em] text-stone-500">技能费用</div>
                        <div className="mt-2 text-lg font-semibold text-stone-100">{data.emperorCard.heroSkill?.cost ?? '-'}</div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-stone-800 bg-black/20 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.3em] text-stone-500">帝王技能</div>
                      <div className="mt-2 text-base font-semibold text-yellow-50">{data.emperorCard.heroSkill?.name}</div>
                      <div className="mt-2 text-sm text-stone-300">{data.emperorCard.heroSkill?.description}</div>
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
            正在连接服务器...
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
            {gameMode === 'pvp' ? '匹配对手' : '开始对战'}
          </button>
        </div>
      </div>
    </div>
  );
}
