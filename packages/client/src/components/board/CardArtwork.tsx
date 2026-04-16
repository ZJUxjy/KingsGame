import type { Card, CardInstance } from '@king-card/shared';
import type { SupportedLocale } from '../../utils/locale.js';
import { getKeywordText } from '../../utils/cardText.js';

type TypeTokenKey = 'soldier' | 'spell' | 'general';

function typeTokenKey(type: string): TypeTokenKey {
  if (type === 'GENERAL') return 'general';
  if (type === 'SPELL' || type === 'SORCERY' || type === 'STRATAGEM') return 'spell';
  return 'soldier';
}

const TYPE_BADGE_ICON: Record<string, string> = {
  MINION: '兵',
  SPELL: '法',
  GENERAL: '将',
  STRATAGEM: '计',
  SORCERY: '术',
  EMPEROR: '帝',
};

type CardSize = 'hand' | 'battlefield' | 'detail' | 'collection';

interface CardArtworkProps {
  card: Card;
  instance?: CardInstance;
  svgIdBase: string;
  size: CardSize;
  locale: SupportedLocale;
}

interface DescriptionLayout {
  maxCharsPerLine: number;
  maxLines: number;
  startY: number;
  lineHeight: number;
}

function getDescriptionLayout(card: Card, size: CardSize): DescriptionLayout {
  if (size === 'detail') {
    return {
      maxCharsPerLine: 17,
      maxLines: card.type === 'GENERAL' ? 5 : 4,
      startY: card.keywords.length > 0 ? 104 : 100,
      lineHeight: 6,
    };
  }

  if (size === 'collection' && (card.type === 'STRATAGEM' || card.type === 'SORCERY')) {
    return {
      maxCharsPerLine: 10,
      maxLines: 3,
      startY: card.keywords.length > 0 ? 138 : 132,
      lineHeight: 6,
    };
  }

  return {
    maxCharsPerLine: size === 'collection' ? 10 : 12,
    maxLines: 2,
    startY: card.keywords.length > 0 ? 138 : 132,
    lineHeight: 8,
  };
}

function splitDescription(description: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (!description) {
    return [];
  }

  const normalized = description.replace(/\s+/g, '');
  const lines: string[] = [];
  const leadingPunctuation = /^[，。！？；：、）】》」』’”]/;

  for (let index = 0; index < normalized.length && lines.length < maxLines; index += maxCharsPerLine) {
    const remaining = normalized.length - index;
    let rawLine = normalized.slice(index, index + maxCharsPerLine);

    if (lines.length > 0 && rawLine && leadingPunctuation.test(rawLine[0])) {
      lines[lines.length - 1] += rawLine[0];
      rawLine = rawLine.slice(1);
    }

    if (!rawLine) {
      continue;
    }

    const isLastLine = lines.length === maxLines - 1 && remaining > maxCharsPerLine;
    lines.push(isLastLine ? `${rawLine.slice(0, Math.max(0, rawLine.length - 1))}…` : rawLine);
  }

  return lines;
}

export function CardArtwork({ card, instance, svgIdBase, size, locale }: CardArtworkProps) {
  const typeKey = typeTokenKey(card.type);
  const isMinion = card.type === 'MINION' || card.type === 'GENERAL';
  const attack = instance?.currentAttack ?? card.attack ?? 0;
  const health = instance?.currentHealth ?? card.health ?? 0;
  const maxHealth = instance?.currentMaxHealth ?? card.health ?? 0;
  const descriptionLayout = getDescriptionLayout(card, size);
  const descriptionLines = splitDescription(
    card.description,
    descriptionLayout.maxCharsPerLine,
    descriptionLayout.maxLines,
  );

  const costGlowId = `${svgIdBase}-cost-glow`;
  const typeGradId = `${svgIdBase}-type-grad`;
  const atkGradId = `${svgIdBase}-atk-grad`;
  const hpGradId = `${svgIdBase}-hp-grad`;

  return (
    <svg
      viewBox="0 0 120 172"
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <radialGradient id={costGlowId}>
          <stop offset="0%" stopColor="var(--cost-glow)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id={typeGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`var(--type-${typeKey}-from)`} />
          <stop offset="100%" stopColor={`var(--type-${typeKey}-to)`} />
        </linearGradient>
        <linearGradient id={atkGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--atk-from)" />
          <stop offset="100%" stopColor="var(--atk-to)" />
        </linearGradient>
        <linearGradient id={hpGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--hp-from)" />
          <stop offset="100%" stopColor="var(--hp-to)" />
        </linearGradient>
      </defs>

      {/* Art area with elliptical frame */}
      <g data-testid="card-art">
        <rect x="0" y="0" width="120" height="104" fill={`url(#${typeGradId})`} />
        <ellipse
          data-testid="card-art-frame"
          cx="60"
          cy="56"
          rx="38"
          ry="42"
          fill="rgba(0,0,0,0.34)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="1.5"
        />
        <text x="60" y="62" textAnchor="middle" fill="white" fontSize="26" opacity="0.58" fontWeight="700">
          {TYPE_BADGE_ICON[card.type] ?? '?'}
        </text>
      </g>

      {/* Cost badge – hexagonal crystal */}
      <g data-testid="card-cost">
        <circle cx="18" cy="18" r="14" fill={`url(#${costGlowId})`} />
        <path
          d="M18 6 L28 12 L28 24 L18 30 L8 24 L8 12 Z"
          fill="#1d4ed8"
          stroke="var(--cost-border)"
          strokeWidth="1"
        />
        <text x="18" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          {card.cost}
        </text>
      </g>

      {/* Type badge pill */}
      <g data-testid="card-type-badge">
        <rect x="88" y="84" width="26" height="16" rx="7" fill={`var(--badge-${typeKey})`} />
        <text x="101" y="95" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          {TYPE_BADGE_ICON[card.type] ?? card.type}
        </text>
      </g>

      {/* Name */}
      <text x="60" y="116" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
        {card.name.length > 11 ? card.name.substring(0, 11) + '…' : card.name}
      </text>

      {/* Keywords */}
      {card.keywords.length > 0 && (
        <text x="60" y="128" textAnchor="middle" fill="#facc15" fontSize="8" fontWeight="bold">
          {getKeywordText(card.keywords, locale)}
        </text>
      )}

      {/* Description snippet */}
      {descriptionLines.length > 0 && (
        <text
          data-testid="card-description-snippet"
          x="60"
          y={descriptionLayout.startY}
          textAnchor="middle"
          fill="#d6d3d1"
          fontSize="8"
        >
          {descriptionLines.map((line, index) => (
            <tspan key={`${line}-${index}`} x="60" dy={index === 0 ? 0 : descriptionLayout.lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      )}

      {/* ATK badge – diamond */}
      {isMinion && (
        <g data-testid="card-atk">
          <path
            d="M16 148 L28 155 L16 162 L4 155 Z"
            fill={`url(#${atkGradId})`}
            stroke="var(--atk-border)"
            strokeWidth="1"
          />
          <text x="16" y="158" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
            {attack}
          </text>
        </g>
      )}

      {/* HP badge – circle */}
      {isMinion && (
        <g data-testid="card-hp">
          <circle
            cx="104"
            cy="155"
            r="13"
            fill={`url(#${hpGradId})`}
            stroke="var(--hp-border)"
            strokeWidth="1"
          />
          <text
            x="104"
            y="159"
            textAnchor="middle"
            fill={health < maxHealth ? 'var(--hp-text-damaged)' : 'var(--hp-text-full)'}
            fontSize="11"
            fontWeight="bold"
          >
            {health}
          </text>
        </g>
      )}
    </svg>
  );
}

interface CardBackArtworkProps {
  svgIdBase: string;
}

export function CardBackArtwork({ svgIdBase }: CardBackArtworkProps) {
  const backGradId = `${svgIdBase}-back-grad`;

  return (
    <svg
      viewBox="0 0 120 172"
      width="100%"
      height="100%"
    >
      <defs>
        <radialGradient id={backGradId}>
          <stop offset="0%" stopColor="rgba(148,163,184,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle
        cx="60"
        cy="85"
        r="30"
        fill={`url(#${backGradId})`}
        stroke="rgba(148,163,184,0.25)"
        strokeWidth="1.5"
      />
      <text x="60" y="94" textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="24">
        帝
      </text>
    </svg>
  );
}
