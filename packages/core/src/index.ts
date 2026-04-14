export { EventBus } from './engine/event-bus.js';
export { DefaultRNG, SeededRNG } from './engine/rng.js';
export { createStateMutator, resetStratagemCounter } from './engine/state-mutator.js';
export { createCardInstance, resetInstanceCounter } from './models/card-instance.js';
export { createPlayer } from './models/player.js';
export { createGameState } from './models/game.js';
export { checkWinCondition } from './engine/win-condition.js';
export { executeTurnStart } from './engine/game-loop.js';
export { executePlayCard, executeAttack, executeEndTurn } from './engine/action-executor.js';
export { GameEngine } from './engine/game-engine.js';

// ─── Card definitions & emperor data ───────────────────────────────
export {
  CHINA_ALL_CARDS,
  CHINA_EMPEROR_DATA_LIST,
  EMPEROR_QIN,
  EMPEROR_HAN,
  EMPEROR_TANG,
} from './cards/definitions/index.js';
