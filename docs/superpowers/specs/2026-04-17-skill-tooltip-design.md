# Skill Tooltip Design

## Context

HeroPanel, MinisterPanel, and GeneralSkillsPanel have skill buttons that show only a name and cost. Hovering over them does nothing. CardComponent already has a fully working tooltip (via `createPortal` + hover state) that displays skill details for cards in hand or on the battlefield. The same information should appear when hovering over the skill buttons in these three panels.

## Goal

Add hover tooltips to all skill buttons (hero skill, minister skill, general skills) that show: skill name, description, cost, and cooldown/uses-per-turn.

## Approach

Extract the tooltip rendering logic from CardComponent into a shared `SkillTooltip` component. The existing CardComponent tooltip is card-scoped (it shows card name, description, hero skill section, general skills section). The new component should handle a single skill only, keeping it focused and reusable.

### New Component: `SkillTooltip`

File: `packages/client/src/components/board/SkillTooltip.tsx`

A wrapper component that manages hover state on a container `<div>` wrapping the child, and portals a tooltip popup when hovered.

Props:

```ts
interface SkillTooltipProps {
  /** Skill display name */
  name: string;
  /** Skill description text */
  description: string;
  /** Energy cost */
  cost: number;
  /** Cooldown in turns (hero/minister skills) */
  cooldown?: number;
  /** Uses per turn (general skills) */
  usesPerTurn?: number;
  /** The trigger element (button, etc.) */
  children: React.ReactNode;
}
```

Rendering pattern:
- SkillTooltip renders a `<div>` wrapper around `children` that manages `onPointerEnter`/`onPointerLeave` and a `useRef` for measuring bounding rect.
- This avoids `cloneElement` and the fragility of injecting refs/handlers into arbitrary children. The child elements keep their own event handlers (e.g., `onPointerDown`) intact.

Behavior:
- On pointer enter, measure the wrapper `<div>`'s bounding rect via `useRef`.
- Render a portal (`createPortal(..., document.body)`) positioned above or below the wrapper, depending on available viewport space (flip below if too close to top edge).
- On pointer leave, remove the portal.
- The tooltip has `pointer-events: none` so it does not interfere with drag interactions.

Visual style — reuse the same design tokens as CardComponent's skill tooltip section:
- Dark semi-transparent background (`bg-black/70`) with backdrop blur.
- Amber-tinted skill name.
- Cost and cooldown/uses badges matching CardComponent's rounded-pill style.
- Width: `w-[260px]` (slightly wider than CardComponent's "regular" 220px to accommodate longer skill descriptions).

### Changes to Existing Panels

**HeroPanel.tsx:**

New props: `skillDescription?: string`, `skillCooldown?: number`.

Wrap the existing skill `<button>` with `<SkillTooltip>` when the button is rendered (player only, `skillName` present). The `<button>` sits inside the `<SkillTooltip>` wrapper `<div>`.

GameBoard already has `myHeroSkill` (localized HeroSkill object). Pass `myHeroSkill.description` and `myHeroSkill.cooldown` as the new props.

**MinisterPanel.tsx:**

No new props needed. MinisterPanel already calls `getMinistersDisplayText` internally and the active minister's localized `activeSkill.description` and `activeSkill.cost` are available as `active.activeSkill.description` and `active.activeSkill.cost`.

Minister cooldown: The `Minister` type has a top-level `cooldown: number` field (remaining cooldown turns). Minister skills do NOT have their own cooldown field — the cooldown belongs to the minister entity. Show the minister's `cooldown` in the tooltip. Read `ministers[activeIndex].cooldown` (from the raw, non-display-text ministers array). Note: `getMinistersDisplayText` preserves the `cooldown` field at the minister level.

Wrap the skill `<button>` with `<SkillTooltip>`, passing `active.activeSkill.description`, `active.activeSkill.cost`, and `cooldown={ministers[activeIndex].cooldown}`.

**GeneralSkillsPanel.tsx:**

Update the `generalSkills` type in the inline interface to include `description` and `usesPerTurn`:

```ts
generalSkills?: Array<{
  name: string;
  description: string;
  cost: number;
  usesPerTurn: number;
}>;
```

GameBoard already calls `getGeneralSkillsDisplayText` which preserves all `GeneralSkill` fields including `description` and `usesPerTurn`. The current TypeScript interface in GeneralSkillsPanel strips them. Fix the interface to include both fields.

Wrap each skill `<button>` with `<SkillTooltip>`, passing the skill's `description` and `usesPerTurn`.

### GameBoard.tsx Data Flow

Minimal changes. The localized data is already computed:
- `myHeroSkill` — has `.description` and `.cooldown`. Pass as `skillDescription` and `skillCooldown` to HeroPanel.
- `displayMinisters` — available inside MinisterPanel, no change needed.
- `generalsWithDisplayText` — each general's `card.generalSkills[i].description` and `.usesPerTurn` are already populated by `getGeneralSkillsDisplayText`.

Changes:
- Pass `skillDescription` and `skillCooldown` to HeroPanel.
- Ensure GeneralSkillsPanel's interface accepts `description` and `usesPerTurn` in skill items (no GameBoard change needed, just the panel's type).

## Scope

In scope:
- Create `SkillTooltip.tsx`.
- Update HeroPanel, MinisterPanel, GeneralSkillsPanel to use SkillTooltip.
- Update GameBoard to pass new props to HeroPanel.
- Update GeneralSkillsPanel's TypeScript interface to include `description` and `usesPerTurn`.

Out of scope:
- CardComponent tooltip refactoring (leave as-is).
- Tooltip animation or delay (appear immediately on hover, like CardComponent).
- Mobile touch handling (tooltips are hover-only, matching existing behavior).
- Opponent skill buttons (opponent's HeroPanel has no skill button rendered).

## Testing

- Verify tooltips appear on hover for all three skill button types.
- Verify tooltips show correct localized text.
- Verify tooltips do not block drag-to-target interactions (pointer-events: none).
- Verify tooltip placement flips below the button when near viewport top.
- Existing tests should continue passing. Add tests for SkillTooltip rendering.

## Risks

- Tooltip overlap with card tooltips: two tooltips could be visible simultaneously if the user's pointer transitions directly from a skill button to a card. Both use `pointer-events: none` so they won't block interaction. Overlap is unlikely given the layout distance between skill buttons and cards.
- Performance: each tooltip measures DOM rect on hover. This is the same pattern as CardComponent and has no known issues.
