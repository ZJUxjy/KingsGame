import type { EffectHandler } from '@king-card/shared';
import { registerEffectHandler } from './registry.js';

/**
 * LIFESTEAL keyword handler.
 *
 * Resolution lives inside action-executor.attack() — after damage is applied,
 * if the attacker carries LIFESTEAL and dealt actual HP damage (NOT absorbed
 * by DIVINE_SHIELD), the attacker's hero is healed for that amount. Phase 1
 * covers minion-attack lifesteal only; spell-source lifesteal is deferred to
 * Phase 2 when reactive triggers land.
 *
 * The detection uses the same HP-snapshot diff that POISONOUS uses —
 * `damage > 0` alone is insufficient because it represents the swing's
 * intended damage, not the damage that actually landed on HP after shields.
 *
 * This handler exists for registry parity (matches TAUNT/CHARGE/DIVINE_SHIELD
 * pattern of placeholder + inline engine logic).
 */
const lifestealHandler: EffectHandler = {
  keyword: 'LIFESTEAL',
};

registerEffectHandler(lifestealHandler);
