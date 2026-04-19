export {
  registerEffectHandler,
  resolveEffects,
  getRegisteredHandlers,
  clearEffectHandlers,
} from './registry.js';
export { executeCardEffects } from './execute-card-effects.js';

// ─── Import keyword handlers (triggers registration) ────────────

import './battlecry.js';
import './deathrattle.js';
import './taunt.js';
import './rush.js';
import './charge.js';
import './assassin.js';
import './combo-strike.js';
import './mobilize.js';
import './garrison.js';
import './aura.js';
import './blockade.js';
import './colony.js';
import './research.js';
import './mobilization-order.js';
import './iron-fist.js';
import './blitz.js';
import './divine-shield.js';
import './poisonous.js';
import './windfury.js';
import './lifesteal.js';
