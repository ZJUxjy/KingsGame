import type React from 'react';
import type { Card, CardInstance } from '@king-card/shared';
import type { SupportedLocale } from '../../utils/locale.js';
import { getKeywordText } from '../../utils/cardText.js';

const CIV_COLORS: Record<string, { primary: string; secondary: string; accent: string; emblem: string }> = {
  CHINA: { primary: '#8B0000', secondary: '#FFD700', accent: '#DC143C', emblem: '龙' },
  JAPAN: { primary: '#1a1a2e', secondary: '#C41E3A', accent: '#E8000D', emblem: '桜' },
  USA: { primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF', emblem: '★' },
  UK: { primary: '#003478', secondary: '#C8A951', accent: '#012169', emblem: '♛' },
  GERMANY: { primary: '#1a1a1a', secondary: '#DD0000', accent: '#FFCC00', emblem: '✠' },
  NEUTRAL: { primary: '#374151', secondary: '#6B7280', accent: '#9CA3AF', emblem: '◆' },
};

const TYPE_STYLES: Record<string, { borderColor: string; glowColor: string }> = {
  EMPEROR: { borderColor: '#FFD700', glowColor: 'rgba(255,215,0,0.3)' },
  GENERAL: { borderColor: '#CD7F32', glowColor: 'rgba(205,127,50,0.3)' },
  MINION: { borderColor: '#C0C0C0', glowColor: 'rgba(192,192,192,0.2)' },
  SORCERY: { borderColor: '#9B59B6', glowColor: 'rgba(155,89,182,0.3)' },
  STRATAGEM: { borderColor: '#2E8B57', glowColor: 'rgba(46,139,87,0.3)' },
};

function renderTexturePattern(cardType: string): React.ReactElement {
  switch (cardType) {
    case 'EMPEROR':
      return <><circle cx="6" cy="6" r="2" fill="rgba(255,215,0,0.3)" /><line x1="0" y1="0" x2="12" y2="12" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5" /></>;
    case 'GENERAL':
      return <><rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="rgba(205,127,50,0.2)" strokeWidth="0.5" /></>;
    case 'SORCERY':
      return <><circle cx="6" cy="6" r="4" fill="none" stroke="rgba(155,89,182,0.2)" strokeWidth="0.5" /><line x1="2" y1="6" x2="10" y2="6" stroke="rgba(155,89,182,0.15)" strokeWidth="0.3" /></>;
    case 'STRATAGEM':
      return <><line x1="0" y1="3" x2="12" y2="3" stroke="rgba(46,139,87,0.2)" strokeWidth="0.5" /><line x1="0" y1="9" x2="12" y2="9" stroke="rgba(46,139,87,0.2)" strokeWidth="0.5" /></>;
    default:
      return <><circle cx="3" cy="3" r="1" fill="rgba(192,192,192,0.15)" /><circle cx="9" cy="9" r="1" fill="rgba(192,192,192,0.15)" /></>;
  }
}

type TypeTokenKey = 'soldier' | 'spell' | 'general';

function typeTokenKey(type: string): TypeTokenKey {
  if (type === 'GENERAL') return 'general';
  if (type === 'SPELL' || type === 'SORCERY' || type === 'STRATAGEM') return 'spell';
  return 'soldier';
}

const TYPE_BADGE_ICON: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    MINION: '兵',
    SPELL: '法',
    GENERAL: '将',
    STRATAGEM: '计',
    SORCERY: '术',
    EMPEROR: '帝',
  },
  'en-US': {
    MINION: 'M',
    SPELL: 'Sp',
    GENERAL: 'G',
    STRATAGEM: 'St',
    SORCERY: 'So',
    EMPEROR: 'E',
  },
};

function typeBadgeLabel(type: string, locale: SupportedLocale): string {
  return TYPE_BADGE_ICON[locale][type] ?? TYPE_BADGE_ICON['zh-CN'][type] ?? type;
}

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
  const civColors = CIV_COLORS[card.civilization] ?? CIV_COLORS.NEUTRAL;
  const typeStyle = TYPE_STYLES[card.type] ?? TYPE_STYLES.MINION;
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
        <linearGradient id={`${svgIdBase}-civ-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={civColors.primary} />
          <stop offset="100%" stopColor={`${civColors.primary}CC`} />
        </linearGradient>
        <pattern id={`${svgIdBase}-texture`} width="12" height="12" patternUnits="userSpaceOnUse">
          {renderTexturePattern(card.type)}
        </pattern>
      </defs>

      {/* Outer card glow border */}
      <rect x="1" y="1" width="118" height="170" rx="7" fill="none"
        stroke={typeStyle.borderColor} strokeWidth="1" opacity="0.4"
        style={{ filter: `drop-shadow(0 0 3px ${typeStyle.glowColor})` }} />

      {/* Art area with textured background */}
      <g data-testid="card-art">
        <rect x="0" y="0" width="120" height="104" fill={`url(#${typeGradId})`} />
        <rect x="8" y="24" width="104" height="72" rx="4" fill={`url(#${svgIdBase}-civ-bg)`} />
        <rect x="8" y="24" width="104" height="72" rx="4" fill={`url(#${svgIdBase}-texture)`} opacity="0.15" />

        {/* Central art frame — double border */}
        <ellipse cx="60" cy="60" rx="30" ry="28"
          fill="rgba(0,0,0,0.45)" stroke={typeStyle.borderColor} strokeWidth="2" />
        <ellipse cx="60" cy="60" rx="27" ry="25"
          fill="none" stroke={`${typeStyle.borderColor}66`} strokeWidth="0.5" />

        {/* Type icon — larger, with glow */}
        <text x="60" y="66" textAnchor="middle" fill="white" fontSize="20" opacity="0.8" fontWeight="700"
          style={{ filter: `drop-shadow(0 0 4px ${typeStyle.glowColor})` }}>
          {typeBadgeLabel(card.type, locale)}
        </text>

        {/* Civilization emblem in corner */}
        <text x="100" y="34" textAnchor="middle" fill={civColors.secondary} fontSize="12" opacity="0.5">
          {civColors.emblem}
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
          {typeBadgeLabel(card.type, locale)}
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
  locale: SupportedLocale;
}

export function CardBackArtwork({ svgIdBase, locale }: CardBackArtworkProps) {
  return (
    <svg viewBox="0 0 120 172" width="100%" height="100%">
      <defs>
        <radialGradient id={`${svgIdBase}-back`}>
          <stop offset="0%" stopColor="rgba(99,102,241,0.2)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <pattern id={`${svgIdBase}-back-tex`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="16" height="16" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="120" height="172" fill="#1e1b4b" rx="8" />
      <rect x="0" y="0" width="120" height="172" fill={`url(#${svgIdBase}-back-tex)`} rx="8" />
      <circle cx="60" cy="86" r="35" fill={`url(#${svgIdBase}-back)`} stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" />
      <text x="60" y="95" textAnchor="middle" fill="rgba(165,163,255,0.5)" fontSize="28" fontWeight="bold">
        {locale === 'en-US' ? 'K' : '帝'}
      </text>
    </svg>
  );
}
