import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * POISONOUS keyword handler.
 *
 * Resolution lives inside action-executor.attack() — after damage is applied,
 * if either side carries POISONOUS and that side actually reduced the opposing
 * minion's HP (or overkilled it; DIVINE_SHIELD-absorbed hits do not count
 * because no HP was lost), the opposing minion is destroyed regardless of
 * remaining HP. The detection uses an HP-snapshot diff taken before the damage
 * call, NOT a `damage > 0` check on the attack stat — the latter would
 * incorrectly fire when DIVINE_SHIELD absorbed the swing.
 *
 * This handler exists for registry parity (matches TAUNT/CHARGE/DIVINE_SHIELD
 * pattern of placeholder + inline engine logic).
 */
const poisonousHandler: EffectHandler = {
  keyword: 'POISONOUS',
};

registerEffectHandler(poisonousHandler);
