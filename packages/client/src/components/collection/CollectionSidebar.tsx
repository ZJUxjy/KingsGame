import { CIVILIZATION_META, type Civilization, type EmperorData } from '@king-card/shared';

interface CollectionSidebarProps {
  civilization: Civilization;
  emperors: EmperorData[];
  selectedEmperorId: string | null;
  visibleCount: number;
  totalCount: number;
  onSelectEmperor: (emperorId: string) => void;
  onBack: () => void;
}

export function CollectionSidebar(props: CollectionSidebarProps) {
  return (
    <aside className="collection-wood-frame w-[320px] shrink-0 rounded-[32px] border border-amber-950/40 p-5 text-stone-100 shadow-[0_24px_54px_rgba(0,0,0,0.35)]">
      <div className="rounded-[20px] border border-amber-200/15 bg-stone-950/25 px-5 py-4 text-center text-2xl font-bold tracking-[0.18em] text-amber-100">
        {CIVILIZATION_META[props.civilization].name} 帝王册
      </div>

      <div className="mt-5 space-y-4">
        {props.emperors.map((item) => {
          const active = props.selectedEmperorId === item.emperorCard.id;

          return (
            <button
              key={item.emperorCard.id}
              aria-label={item.emperorCard.name}
              onClick={() => props.onSelectEmperor(item.emperorCard.id)}
              className={`block w-full rounded-[20px] border px-4 py-4 text-left transition ${active ? 'border-yellow-300 bg-yellow-200/10 shadow-[0_0_20px_rgba(250,204,21,0.18)]' : 'border-amber-100/10 bg-black/15 hover:bg-black/25'}`}
            >
              <div className="text-lg font-bold text-yellow-50">{item.emperorCard.name}</div>
              <div className="mt-1 text-sm text-stone-300">{item.emperorCard.heroSkill?.name}</div>
              <div className="mt-2 text-xs tracking-[0.2em] text-stone-400">
                绑定 {item.boundGenerals.length + item.boundSorceries.length} 张
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[24px] border border-amber-100/10 bg-black/20 px-5 py-4">
        <div className="text-sm tracking-[0.25em] text-stone-400">当前展示</div>
        <div className="mt-2 text-4xl font-black text-amber-50">{props.visibleCount}/{props.totalCount}</div>
        <div className="mt-2 text-sm leading-6 text-stone-300">收藏页仅展示当前文明与中立卡池，右侧点击帝王后可高亮或过滤其绑定将领与巫术。</div>
      </div>

      <button
        onClick={props.onBack}
        className="mt-6 w-full rounded-[20px] border border-amber-200/20 bg-amber-200/10 px-5 py-4 text-lg font-bold text-amber-50 transition hover:bg-amber-200/20"
      >
        返回大厅
      </button>
    </aside>
  );
}