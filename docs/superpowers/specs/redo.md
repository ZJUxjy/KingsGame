# React Frontend Refactoring Design

**Date**: 2025-04-15
**Status**: Approved
**Scope**: Replace Phaser 3 UI with React + Node.js server architecture

## Background

Current `ui-phaser` package uses Phaser 3 (Canvas-based) for game rendering. Issues:
- Text overflow and layout problems hard to fix in Canvas
- Blurry rendering on high-DPI screens
- Layout requires manual coordinate calculation (no CSS flex/grid)
- No path to multiplayer — engine runs entirely client-side

Reference project: `/home/xu/code/hstone/hearthstone/fireplace` — a Hearthstone simulator with React frontend + Python backend + Socket.IO communication.

## Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Client-server | Enables multiplayer, anti-cheat, logic security |
| State management | Zustand | Lightweight, hook-friendly, minimal boilerplate |
| CSS approach | Tailwind CSS | Utility-first, fast dev, avoids 63KB CSS file problem |
| Server runtime | Node.js + Express | Natural fit with TypeScript core engine |
| Communication | Socket.IO | Real-time bidirectional, room support, reconnection |
| Package structure | Approach A: clean split | Clear separation, delete ui-phaser entirely |

## Package Structure

```
KingsGame/
  packages/
    shared/          → @king-card/shared (UNCHANGED)
    core/            → @king-card/core (UNCHANGED)
    server/          → @king-card/server (NEW)
      src/
        index.ts           → Entry point: start Express + Socket.IO
        gameManager.ts     → Manage game room instances
        socketHandler.ts   → WebSocket event routing to engine operations
        serialization.ts   → GameState → JSON (hide opponent hand)
        aiPlayer.ts        → Simple random AI for PvE
      package.json
      tsconfig.json
    client/          → @king-card/client (NEW)
      src/
        main.tsx           → React entry
        App.tsx             → Route: lobby → hero-select → game-board
        stores/
          gameStore.ts      → Zustand: game state + actions
        services/
          socketService.ts  → Socket.IO connection manager (singleton)
        components/
          board/
            GameBoard.tsx     → Main board layout
            CardComponent.tsx → Single card (CSS-rendered)
            HandZone.tsx      → Hand fan arrangement
            Battlefield.tsx   → Minion zone (up to 7)
            HeroPanel.tsx     → Hero info + skill button
            EnergyBar.tsx     → Energy crystals
            MinisterPanel.tsx → Minister display
            TurnIndicator.tsx → Turn info + end-turn button
            GameOverlay.tsx   → Turn transition / game over overlay
          lobby/
            Lobby.tsx         → Mode selection (PvE / PvP)
            HeroSelect.tsx    → Emperor selection
        hooks/
          useGameSocket.ts  → Socket events → Zustand store sync
        utils/
          fanLayout.ts      → Hand fan layout algorithm
        index.css          → Tailwind entry
      package.json
      tsconfig.json
      vite.config.ts
      tailwind.config.ts
```

**Dependency graph**:
```
shared ← core ← server
shared ← client
```
Client does NOT depend on `core` — forces all logic through Socket communication.

## Server Architecture

### GameManager

```typescript
class GameManager {
  private games: Map<string, GameSession>;
  createGame(player1: string, player2: string, config: GameConfig): GameSession;
  getGame(gameId: string): GameSession | undefined;
  destroyGame(gameId: string): void;
}

interface GameSession {
  id: string;
  engine: GameEngine;           // @king-card/core
  players: [string, string];    // socket IDs
  state: 'waiting' | 'playing' | 'finished';
}
```

### Socket.IO Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `join_game` | `{ emperorIndex }` | Join match / create room |
| `play_card` | `{ handIndex, boardPosition? }` | Play card from hand |
| `attack` | `{ attackerId, targetRef }` | Declare attack |
| `end_turn` | `{}` | End current turn |
| `use_hero_skill` | `{}` | Use hero skill |
| `use_minister_skill` | `{}` | Use minister skill |
| `switch_minister` | `{ ministerIndex }` | Switch active minister |
| `concede` | `{}` | Surrender |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `game_joined` | `{ gameId, playerIndex }` | Game room joined |
| `game_state` | `SerializedGameState` | Full state push (player-specific view) |
| `valid_actions` | `ValidAction[]` | Current legal actions |
| `game_over` | `{ winnerIndex, reason }` | Game ended |
| `error` | `{ code, message }` | Illegal action / server error |

### Serialization

```typescript
function serializeForPlayer(game: GameState, playerIndex: 0 | 1): SerializedGameState {
  const me = game.players[playerIndex];
  const opponent = game.players[playerIndex === 0 ? 1 : 0];

  return {
    turnNumber: game.turnNumber,
    currentPlayerIndex: game.currentPlayerIndex,
    phase: game.phase,
    me: {
      hero: me.hero,
      hand: me.hand,                     // full card data
      battlefield: me.battlefield,
      energyCrystal: me.energyCrystal,
      maxEnergy: me.maxEnergy,
      deckCount: me.deck.length,
      activeMinisterIndex: me.activeMinisterIndex,
      ministerPool: me.ministerPool,
    },
    opponent: {
      hero: opponent.hero,
      hand: opponent.hand.map(() => ({ hidden: true })),  // hide contents
      battlefield: opponent.battlefield,
      energyCrystal: opponent.energyCrystal,
      maxEnergy: opponent.maxEnergy,
      deckCount: opponent.deck.length,
    },
  };
}
```

### State Push Timing

1. **After player action**: server calls engine → serialize → push `game_state` to both players
2. **Turn change**: push `game_state` + `valid_actions` to new active player
3. **Error**: immediate `error` event, no state change

### AI Opponent

```typescript
function runAiTurn(engine: GameEngine, playerIndex: 0 | 1): void {
  const actions = engine.getValidActions(playerIndex);

  // Simple strategy: play cards, then attack, then end turn
  for (const action of shuffle(actions.filter(a => a.type === 'PLAY_CARD'))) {
    engine.playCard(playerIndex, action.handIndex, action.boardPosition);
  }
  for (const action of actions.filter(a => a.type === 'ATTACK')) {
    engine.attack(playerIndex, action.attackerId, action.targetRef);
  }
  engine.endTurn(playerIndex);
}
```

AI actions have 500ms-1s delays so the player can observe them.

## Client Architecture

### Zustand Store

```typescript
interface GameStore {
  // Connection
  connected: boolean;
  gameId: string | null;
  playerIndex: 0 | 1;

  // Game state (from server)
  gameState: SerializedGameState | null;
  validActions: ValidAction[];

  // UI state
  phase: 'lobby' | 'hero-select' | 'playing' | 'game-over';
  selectedAttacker: string | null;
  isMyTurn: boolean;
  winner: number | null;

  // Actions (send to server via socket)
  joinGame: (emperorIndex: number) => void;
  playCard: (handIndex: number, boardPosition?: number) => void;
  attack: (attackerId: string, targetRef: TargetRef) => void;
  endTurn: () => void;
  useHeroSkill: () => void;
  useMinisterSkill: () => void;
  switchMinister: (index: number) => void;
  concede: () => void;

  // Internal
  setGameState: (state: SerializedGameState) => void;
  setSelectedAttacker: (id: string | null) => void;
  reset: () => void;
}
```

### useGameSocket Hook

```typescript
function useGameSocket() {
  const store = useGameStore();

  useEffect(() => {
    socket.on('game_state', (data) => store.setGameState(data.state));
    socket.on('valid_actions', (data) => { /* update validActions */ });
    socket.on('game_over', (data) => { /* update winner */ });
    return () => { socket.off(...); };
  }, []);
}
```

### Component Hierarchy

```
App.tsx
  ├── Lobby.tsx              Mode selection, matchmaking
  ├── HeroSelect.tsx         Emperor selection (3 buttons)
  └── GameBoard.tsx          Main board
        ├── EnemyHeroPanel    Opponent hero + armor
        ├── EnemyBattlefield  Opponent minions (up to 7)
        ├── TurnBar           Turn number + end-turn button
        ├── PlayerBattlefield Player minions
        ├── PlayerHeroPanel   Player hero + skill button
        ├── EnergyBar         Energy crystals
        ├── MinisterPanel     Minister display
        ├── HandZone          Hand fan arrangement
        └── GameOverlay       Turn transition / game over
```

### CardComponent — Pure CSS

```
┌──────────────┐
│ ⬡ 3          │  ← Cost (top-left circle)
│              │
│   Card Name  │  ← Centered, word-wrap
│              │
│   (desc)     │  ← Optional description
│              │
│ ⚔ 4    ❤ 5  │  ← Attack (bottom-left) / Health (bottom-right)
└──────────────┘
```

- Size: 120×170px
- Rarity border colors: Common=gray, Rare=blue, Epic=purple, Legendary=gold
- Highlight: CSS `ring` + `scale` transition
- Hover: `transform: translateY(-20px) scale(1.08)` with `transition: all 150ms`

### HandZone Fan Layout

```typescript
// utils/fanLayout.ts
interface FanCardTransform {
  x: number;        // horizontal offset
  y: number;        // vertical arc offset
  rotation: number; // rotation angle (degrees)
  zIndex: number;   // layer order
}

function computeFanLayout(
  count: number,
  containerWidth: number,
  maxAngle: number = 30,
): FanCardTransform[]
```

Each card positioned with `position: absolute` + `transform`. Hover raises `z-index` to top.

### Board Layout (Tailwind)

```
┌─────────────────────────────────────────────────┐  h-screen
│ flex flex-col max-w-[1280px] mx-auto            │
│ ┌───────────────────────────────────────────────┐│
│ │ [Enemy Hero]                     [Enemy Info] ││  h-[100px]
│ ├───────────────────────────────────────────────┤│
│ │         [Enemy Battlefield - 7 slots]        ││  h-[160px]
│ ├───────────────────────────────────────────────┤│
│ │              [Turn Bar / End Turn]            ││  h-[50px]
│ ├───────────────────────────────────────────────┤│
│ │         [Player Battlefield - 7 slots]       ││  h-[160px]
│ ├───────────────────────────────────────────────┤│
│ │ [Hero+Skill] [Energy] [Minister]             ││  h-[100px]
│ ├───────────────────────────────────────────────┤│
│ │           [Hand Zone - fan cards]             ││  h-[150px]
│ └───────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Interaction Flow

### Attack State Machine

```
IDLE ──click own minion──→ SELECTING_TARGET ──click target──→ IDLE
                              │                        ↑
                              └──End Turn / right-click→ IDLE
```

```typescript
function handleMinionClick(instanceId: string, isMine: boolean) {
  if (isMine && canAttack(instanceId)) {
    store.setSelectedAttacker(instanceId);
  } else if (!isMine && store.selectedAttacker) {
    store.attack(store.selectedAttacker, { type: 'MINION', instanceId });
    store.setSelectedAttacker(null);
  }
}

// Highlight valid targets via validActions filter
const attackTargets = useMemo(() => {
  if (!store.selectedAttacker) return new Set<string>();
  return new Set(
    store.validActions
      .filter(a => a.type === 'ATTACK' && a.attackerId === store.selectedAttacker)
      .flatMap(a => a.targets.map(t => t.instanceId))
  );
}, [store.validActions, store.selectedAttacker]);
```

### Card Play Interaction

Two methods:

1. **Click**: Click hand card → play directly (or enter target selection if needed)
2. **Drag**: HTML5 Drag & Drop → drag to Battlefield zone → drop to play

```typescript
// Drag source (hand card)
<div draggable onDragStart={(e) => {
  e.dataTransfer.setData('handIndex', String(index));
}}>

// Drop target (battlefield)
<div onDragOver={(e) => e.preventDefault()}
     onDrop={(e) => {
       const handIndex = Number(e.dataTransfer.getData('handIndex'));
       store.playCard(handIndex);
     }}>
```

### Action Flow Sequence

```
Client                    Server                   Core Engine
  │                         │                          │
  │── playCard(index) ────→│                          │
  │                         │── engine.playCard() ───→│
  │                         │                          │── validate
  │                         │                          │── mutate state
  │                         │                          │── emit events
  │                         │←── EngineResult ────────│
  │                         │                          │
  │                         │── serializeForPlayer() ─→│
  │←── game_state ─────────│                          │
  │←── valid_actions ──────│                          │
  │                         │── game_state (opp) ────→│ (to opponent)
  │                         │                          │
  │  [React re-renders]    │                          │
```

### Error Handling

Server wraps all engine calls in try-catch:
```typescript
try {
  const result = engine.playCard(playerIndex, handIndex, boardPosition);
  if (!result.success) {
    socket.emit('error', { code: result.error, message: result.message });
    return;
  }
  broadcastGameState(gameId);
} catch (err) {
  socket.emit('error', { code: 'INTERNAL', message: 'Server error' });
}
```

Client shows toast notifications for errors.

## Development Phases

### Phase 1: Scaffolding + Server Skeleton
- Delete `ui-phaser` package
- Create `server` package: Express + Socket.IO + TypeScript
- Create `client` package: React 19 + Vite + Zustand + Tailwind
- Minimal Socket communication: connect, ping-pong
- Update pnpm-workspace.yaml and root package.json

### Phase 2: Server Game Logic
- `gameManager.ts`: create/destroy game instances
- `socketHandler.ts`: all 8 client→server event handlers
- `serialization.ts`: `serializeForPlayer()` dual-view serialization
- `aiPlayer.ts`: simple random AI
- Integration test: simulated two-player game via Socket.IO client

### Phase 3: Client Core UI
- Zustand store + `useGameSocket` hook
- `GameBoard.tsx` board layout framework
- `CardComponent.tsx` pure CSS card rendering
- `HandZone.tsx` fan layout + hover/drag
- `Battlefield.tsx` minion zone + target highlighting
- `HeroPanel.tsx` + `EnergyBar.tsx` + `MinisterPanel.tsx`
- `TurnIndicator.tsx` + End Turn button

### Phase 4: Interaction + Lobby
- Attack state machine (select → target)
- Card play (click + drag)
- Hero skill / minister skill buttons
- `Lobby.tsx` mode selection (PvE / PvP)
- `HeroSelect.tsx` emperor selection
- `GameOverlay.tsx` turn transition / game over
- Toast error notifications

### Phase 5: Polish + Cleanup
- CSS transitions for card play, attack, death animations
- Turn timer (optional)
- Responsive min-width: 1024px
- Remove all `ui-phaser` references
- Update docs

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Server unit | Vitest | serialization, gameManager, aiPlayer |
| Server integration | Vitest + socket.io-client | Full game: create → play → attack → end |
| Client components | Vitest + React Testing Library | CardComponent, HandZone rendering |
| E2E | Manual | Full game flow in browser |

## Explicit Non-Goals

- Real artwork assets (continue CSS placeholders)
- Account/login system
- Ranked matchmaking (direct room creation only)
- Mobile adaptation
- Non-China civilizations
- Spectator mode
- Replay system
