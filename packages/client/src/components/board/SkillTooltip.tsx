import { useId, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocaleStore } from '../../stores/localeStore.js';

interface SkillTooltipProps {
  name: string;
  description: string;
  cost: number;
  cooldown?: number;
  usesPerTurn?: number;
  children: React.ReactNode;
}

const TOOLTIP_WIDTH = 260;
const VIEWPORT_MARGIN = 16;

function formatCooldown(cooldown: number, locale: 'zh-CN' | 'en-US'): string {
  return locale === 'en-US'
    ? `CD ${cooldown} turn${cooldown === 1 ? '' : 's'}`
    : `冷却 ${cooldown} 回合`;
}

function formatUsesPerTurn(uses: number, locale: 'zh-CN' | 'en-US'): string {
  return locale === 'en-US'
    ? `${uses} use${uses === 1 ? '' : 's'}/turn`
    : `每回合 ${uses} 次`;
}

export function SkillTooltip({
  name,
  description,
  cost,
  cooldown,
  usesPerTurn,
  children,
}: SkillTooltipProps) {
  const locale = useLocaleStore((s) => s.locale);
  const tooltipId = useId().replace(/:/g, '_');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [placement, setPlacement] = useState<'above' | 'below'>('above');
  const [positionLeft, setPositionLeft] = useState(0);
  const [positionTop, setPositionTop] = useState<number | undefined>(undefined);
  const [positionBottom, setPositionBottom] = useState<number | undefined>(undefined);
  const [estimatedHeight, setEstimatedHeight] = useState(120);

  useLayoutEffect(() => {
    if (!isHovered) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const tooltipHeight = estimatedHeight;

    // Vertical placement
    const spaceAbove = wrapperRect.top;
    const spaceBelow = viewportHeight - wrapperRect.bottom;
    const nextPlacement = spaceAbove >= tooltipHeight + VIEWPORT_MARGIN ? 'above' : 'below';
    setPlacement(nextPlacement);

    // Compute vertical position (stored in state, not read during render)
    if (nextPlacement === 'below') {
      setPositionTop(wrapperRect.bottom + 8);
      setPositionBottom(undefined);
    } else {
      setPositionBottom(viewportHeight - wrapperRect.top + 8);
      setPositionTop(undefined);
    }

    // Horizontal centering with clamping
    const centerX = wrapperRect.left + wrapperRect.width / 2;
    const halfWidth = TOOLTIP_WIDTH / 2;
    const clampedLeft = Math.max(
      VIEWPORT_MARGIN,
      Math.min(centerX - halfWidth, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
    );
    setPositionLeft(clampedLeft);
  }, [isHovered, estimatedHeight]);

  const showPortal = isHovered && name && description;

  return (
    <>
      <div
        ref={wrapperRef}
        aria-describedby={showPortal ? tooltipId : undefined}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {showPortal && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          ref={(el) => {
            if (el && el.offsetHeight !== estimatedHeight) {
              setEstimatedHeight(el.offsetHeight);
            }
          }}
          className={`pointer-events-none fixed rounded-xl border border-white/15 bg-black/70 px-3 py-2 text-xs leading-5 text-stone-100 shadow-[0_18px_36px_rgba(0,0,0,0.45)] backdrop-blur-sm`}
          style={{
            left: positionLeft,
            width: TOOLTIP_WIDTH,
            zIndex: 9999,
            pointerEvents: 'none',
            ...(placement === 'below'
              ? { top: positionTop }
              : { bottom: positionBottom }),
          }}
        >
          <div className="mb-1 text-sm font-bold text-amber-200">{name}</div>
          <div>{description}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-300/90">
            <span className="rounded-full border border-amber-300/20 bg-amber-200/10 px-1.5 py-0.5">
              {locale === 'en-US' ? 'Cost' : '费用'} {cost}
            </span>
            {cooldown !== undefined && (
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5">
                {formatCooldown(cooldown, locale)}
              </span>
            )}
            {usesPerTurn !== undefined && (
              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5">
                {formatUsesPerTurn(usesPerTurn, locale)}
              </span>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
