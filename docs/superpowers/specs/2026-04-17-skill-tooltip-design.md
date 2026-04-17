# Skill Tooltip Design

## Context

HeroPanel, MinisterPanel, and GeneralSkillsPanel have skill buttons that show only a name and cost. Hovering over them does nothing. CardComponent already has a fully working tooltip (via `createPortal` + hover state) that displays skill details for cards in hand or on the battlefield. The same information should appear when hovering over the skill buttons in these three panels.

## Goal

Add hover tooltips to all skill buttons (hero skill, minister skill, general skills) that show: skill name, description, cost, and cooldown/uses-per-turn.

## Approach

Extract the tooltip rendering logic from CardComponent into a shared `SkillTooltip` component. The existing CardComponent tooltip is card-scoped (it shows card name, description, hero skill section, general skills section). The new component should handle a single skill only, keeping it focused and reusable.

### New Component: `SkillTooltip`

File: `packages/client/src/components/board/SkillTooltip.tsx`

A renderless wrapper that attaches hover listeners to its child and portals a tooltip popup when hovered.

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
  /** The trigger element — must accept ref + onPointerEnter/Leave */
  children: React.ReactElement;
}
```

Behavior:
- On pointer enter, measure the child element's bounding rect via a ref callback.
- Render a portal (`createPortal(..., document.body)`) positioned above or below the child, depending on available viewport space. Same placement logic as CardComponent (lines 149-155 of CardComponent.tsx).
- On pointer leave, remove the portal.
- The tooltip has `pointer-events: none` so it does not interfere with drag interactions.

Visual style — reuse the same design tokens as CardComponent's skill tooltip section:
- Dark semi-transparent background (`bg-black/70`) with backdrop blur.
- Amber-tinted skill name.
- Cost and cooldown/uses badges matching CardComponent's rounded-pill style.
- Width: `w-[220px]`, matching the "regular" tooltip size in CardComponent.

### Changes to Existing Panels

**HeroPanel.tsx:**

New props: `skillDescription?: string`, `skillCooldown?: number`.

Wrap the existing skill `<button>` with `<SkillTooltip>` when the button is rendered (player only, `skillName` present).

GameBoard already has `myHeroSkill` (localized HeroSkill object). Pass `myHeroSkill.description` and `myHeroSkill.cooldown` as the new props.

**MinisterPanel.tsx:**

New prop: `skillDescription?: string`.

MinisterPanel already receives `ministers` and `activeIndex`. The active minister's `activeSkill.description` is available after localization. Wrap the skill `<button>` with `<SkillTooltip>`.

GameBoard needs to pass the description. The ministers are already localized via `getMinistersDisplayText`. The active minister's skill description is at `displayMinisters[activeIndex].activeSkill.description`. Since MinisterPanel already computes `active` internally, no new prop is needed — the component can read `active.activeSkill.description` directly.

Wait — MinisterPanel already calls `getMinistersDisplayText` and stores the result in `displayMinisters`. The active minister's `activeSkill.description` is already localized. So the description is available inside the component. No new prop needed.

**GeneralSkillsPanel.tsx:**

New prop on each general's card type: `description` added to the generalSkills array items.

Currently the `generals` prop types `generalSkills` as `Array<{ name: string; cost: number }>`. This needs to be extended to `Array<{ name: string; description: string; cost: number }>`.

GameBoard already calls `getGeneralSkillsDisplayText` which includes `description` in each skill. The `generalsWithDisplayText` mapping needs to pass `description` through. Currently it maps `getGeneralSkillsDisplayText(minion.card.generalSkills, locale)` — this already includes description. The issue is the TypeScript interface in GeneralSkillsPanel strips it. Fix the interface to include `description`.

Wrap each skill `<button>` with `<SkillTooltip>`.

### GameBoard.tsx Data Flow

No major changes needed. The localized data is already computed:
- `myHeroSkill` — has `.description` and `.cooldown`
- `displayMinisters` — `active.activeSkill.description` is available inside MinisterPanel
- `generalsWithDisplayText` — each general's `card.generalSkills[i].description` is populated

The only changes:
- Pass `skillDescription` and `skillCooldown` to HeroPanel.
- Ensure GeneralSkillsPanel's interface accepts `description` in skill items.

## Scope

In scope:
- Create `SkillTooltip.tsx`.
- Update HeroPanel, MinisterPanel, GeneralSkillsPanel to use SkillTooltip.
- Update GameBoard to pass new props to HeroPanel.
- Update GeneralSkillsPanel's TypeScript interface.

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

- Tooltip portal stacking: if a card tooltip and a skill tooltip are visible simultaneously, they could overlap. Mitigate by only showing one tooltip at a time (skill tooltip disappears when the pointer leaves the skill button).
- Performance: each tooltip measures DOM rect on hover. This is the same pattern as CardComponent and has no known issues.
