# Card Definition Builders Design

## Context

The card definition files under `packages/core/src/cards/definitions` are already split by civilization and card type. That structure is useful and should stay intact. The main pain is repeated object scaffolding across cards, especially ministers, generals, and emperors.

The refactor should optimize for two goals:

- Reduce repeated boilerplate in card definition objects.
- Make adding new cards feel closer to filling a focused configuration shape.

The refactor should not turn the definitions into a heavy DSL or hide each card's identity. Card text, stats, keywords, and effect parameters should remain easy to read at the call site.

## Recommended Approach

Add a small builder module at:

`packages/core/src/cards/definitions/builders.ts`

The module should provide three layers of helpers.

### Effect Helpers

Effect helpers should remove repeated trigger declarations without hiding effect type or parameters.

Proposed API:

```ts
onPlay(type, params)
onDeath(type, params)
onKill(type, params)
onTurnStart(type, params)
onTurnEnd(type, params)
onAttack(type, params)
```

Each helper returns a `CardEffect`.

Example:

```ts
onPlay('DRAW', { count: 1 })
onPlay('DAMAGE', { target: 'ENEMY_MINION', amount: 2 })
```

### Skill Helpers

Skill helpers should absorb stable defaults while leaving names, descriptions, costs, and effects visible.

Proposed API:

```ts
createMinisterSkill({
  name,
  description,
  cost,
  effect,
})

createGeneralSkill({
  name,
  description,
  effect,
  cost = 0,
  usesPerTurn = 1,
})

createHeroSkill({
  name,
  description,
  cost,
  cooldown,
  effect,
})
```

Defaults:

- `createGeneralSkill` defaults `cost` to `0`.
- `createGeneralSkill` defaults `usesPerTurn` to `1`.
- Minister and hero skill cooldowns remain explicit at the entity level.

### Entity Builders

Entity builders should remove stable object scaffolding without changing exported names or array composition.

Proposed API:

```ts
createMinister({
  id,
  emperorId,
  name,
  type,
  activeSkill,
  cooldown,
})

createGeneralCard({
  id,
  name,
  civilization,
  cost,
  attack,
  health,
  description,
  keywords = [],
  effects = [],
  generalSkills,
  rarity = 'LEGENDARY',
})

createEmperorCard({
  id,
  name,
  civilization,
  cost,
  health = 30,
  description,
  heroSkill,
  effects = [],
  keywords = [],
  rarity = 'LEGENDARY',
})
```

Defaults:

- `createMinister` sets `skillUsedThisTurn` to `false`.
- `createGeneralCard` sets `type` to `GENERAL`.
- `createGeneralCard` defaults `rarity` to `LEGENDARY`.
- `createGeneralCard` defaults `effects` to `[]`.
- `createGeneralCard` defaults `keywords` to `[]`.
- `createEmperorCard` sets `type` to `EMPEROR`.
- `createEmperorCard` sets `attack` to `0`.
- `createEmperorCard` defaults `health` to `30`.
- `createEmperorCard` defaults `rarity` to `LEGENDARY`.
- `createEmperorCard` defaults `effects` to `[]`.
- `createEmperorCard` defaults `keywords` to `[]`.

## Scope

The first implementation pass should target high-repetition files only.

In scope:

- Add `builders.ts`.
- Refactor minister definitions to use `createMinister`, `createMinisterSkill`, and `onPlay`.
- Refactor general skills to use `createGeneralSkill` and `onPlay`.
- Preserve all existing named exports and aggregate arrays.

Optional follow-up:

- Refactor emperor definitions with `createEmperorCard`, `createHeroSkill`, and `onPlay`.

Out of scope for the first pass:

- A full data-table or DSL rewrite.
- Automatic description generation.
- Reorganizing the existing civilization/card-type file layout.
- Replacing all minion, sorcery, and stratagem definitions with card factories.
- Deeply typed effect parameter unions.

## Example

Before:

```ts
export const LISI: Minister = {
  id: 'china_lisi',
  emperorId: 'china_qin_shihuang',
  name: '李斯',
  type: 'STRATEGIST',
  activeSkill: {
    name: '上书',
    description: '抽一张牌',
    cost: 1,
    effect: {
      trigger: 'ON_PLAY',
      type: 'DRAW',
      params: { count: 1 },
    },
  },
  skillUsedThisTurn: false,
  cooldown: 1,
};
```

After:

```ts
export const LISI = createMinister({
  id: 'china_lisi',
  emperorId: 'china_qin_shihuang',
  name: '李斯',
  type: 'STRATEGIST',
  activeSkill: createMinisterSkill({
    name: '上书',
    description: '抽一张牌',
    cost: 1,
    effect: onPlay('DRAW', { count: 1 }),
  }),
  cooldown: 1,
});
```

## Compatibility

The refactor must preserve runtime shapes exactly:

- `Card` objects must still satisfy `@king-card/shared`'s `Card` interface.
- `Minister` objects must still satisfy `@king-card/shared`'s `Minister` interface.
- Existing exported constants must keep the same names.
- Existing aggregate arrays such as `CHINA_MINISTERS` and `GERMANY_GENERALS` must keep the same names and order.

This keeps downstream imports and tests stable.

## Testing

Verification should include:

- Type checking or the repository's standard build command.
- Existing core tests.
- Focused comparison for representative refactored definitions, especially ministers and generals.

Useful checks:

- Confirm all named exports still resolve.
- Confirm card and minister arrays keep the same length and order.
- Confirm builder-created objects contain the expected default fields.

## Risks

The main risk is over-abstraction. If builders accept too many options or try to generate card text, card definitions will become harder to read. The API should stay intentionally small and only remove stable boilerplate.

Another risk is hiding invalid effect parameters. The existing shared type uses `Record<string, unknown>` for `CardEffect.params`, so this design does not attempt to solve deep effect parameter typing. That can be a later, separate refactor.

## Migration Plan

1. Add `builders.ts` with effect, skill, and entity builders.
2. Refactor one minister file as a pilot and run verification.
3. Refactor the remaining minister files.
4. Refactor general skills.
5. Optionally refactor emperor files after confirming the builder API remains clear.
6. Leave minion, sorcery, and stratagem definitions mostly unchanged, except where simple effect helpers clearly improve readability.
