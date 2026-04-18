export { EventBus } from './engine/event-bus.js';
export { DefaultRNG, SeededRNG } from './engine/rng.js';
export { createStateMutator } from './engine/state-mutator.js';
export { createCardInstance } from './models/card-instance.js';
export { IdCounter } from './engine/id-counter.js';
export { createPlayer } from './models/player.js';
export { createGameState } from './models/game.js';
export { checkWinCondition } from './engine/win-condition.js';
export { executeTurnStart } from './engine/game-loop.js';
export { executePlayCard, executeAttack, executeEndTurn } from './engine/action-executor.js';
export { GameEngine } from './engine/game-engine.js';
export { EventBusImpl } from './engine/event-bus.js';

// ─── Card definitions & emperor data ───────────────────────────────
export {
  CHINA_ALL_CARDS,
  CHINA_EMPEROR_DATA_LIST,
  EMPEROR_QIN,
  EMPEROR_HAN,
  EMPEROR_TANG,
  JAPAN_ALL_CARDS,
  JAPAN_EMPEROR_DATA_LIST,
  USA_ALL_CARDS,
  USA_EMPEROR_DATA_LIST,
  UK_ALL_CARDS,
  UK_EMPEROR_DATA_LIST,
  GERMANY_ALL_CARDS,
  GERMANY_EMPEROR_DATA_LIST,
  ALL_CARDS,
  ALL_EMPEROR_DATA_LIST,
} from './cards/definitions/index.js';
