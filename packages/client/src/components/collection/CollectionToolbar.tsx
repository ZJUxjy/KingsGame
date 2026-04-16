import { CIVILIZATION_META, CIVILIZATION_ORDER, type Civilization } from '@king-card/shared';
import type { CollectionCardTypeFilter } from './collection-utils.js';

interface CollectionToolbarProps {
  civilization: Civilization;
  selectedType: CollectionCardTypeFilter;
  search: string;
  canToggleBoundOnly: boolean;
  showBoundOnly: boolean;
  onCivilizationChange: (civilization: Civilization) => void;
  onTypeChange: (type: CollectionCardTypeFilter) => void;
  onSearchChange: (value: string) => void;
  onToggleBoundOnly: () => void;
}

const TYPE_LABELS: Record<CollectionCardTypeFilter, string> = {
  ALL: '全部',
  MINION: '随从',
  GENERAL: '将领',
  STRATAGEM: '谋略',
  SORCERY: '巫术',
};

export function CollectionToolbar(props: CollectionToolbarProps) {
  return (
    <div className="rounded-[28px] border border-amber-950/40 bg-[rgba(59,32,18,0.88)] px-6 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full bg-black/20 px-4 py-2 text-stone-100">
          <span className="text-sm tracking-[0.2em] text-amber-100/70">文明</span>
          <div className="flex flex-wrap gap-2">
            {CIVILIZATION_ORDER.map((civilization) => (
              <button
                key={civilization}
                onClick={() => props.onCivilizationChange(civilization)}
                className={`rounded-full px-4 py-2 text-sm transition ${props.civilization === civilization ? 'bg-amber-200 text-stone-900' : 'bg-stone-800/70 text-stone-100 hover:bg-stone-700/70'}`}
              >
                {CIVILIZATION_META[civilization].name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as CollectionCardTypeFilter[]).map((type) => (
            <button
              key={type}
              onClick={() => props.onTypeChange(type)}
              className={`rounded-full px-4 py-2 text-sm transition ${props.selectedType === type ? 'bg-yellow-300 text-stone-900' : 'bg-stone-950/50 text-stone-200 hover:bg-stone-900/70'}`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <input
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder="搜索名称、描述或关键词"
          className="ml-auto min-w-64 rounded-full border border-stone-700 bg-stone-950/70 px-4 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-500"
        />

        <button
          onClick={props.onToggleBoundOnly}
          disabled={!props.canToggleBoundOnly}
          className={`rounded-full px-4 py-2 text-sm transition ${props.canToggleBoundOnly ? props.showBoundOnly ? 'bg-emerald-300 text-stone-900' : 'bg-stone-900/70 text-stone-100 hover:bg-stone-800/80' : 'cursor-not-allowed bg-stone-900/30 text-stone-500'}`}
        >
          只看绑定
        </button>
      </div>
    </div>
  );
}