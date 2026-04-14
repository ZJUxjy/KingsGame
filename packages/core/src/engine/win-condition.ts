import type { GameState, WinReason } from '@king-card/shared';

export function checkWinCondition(state: GameState): { isGameOver: boolean; winnerIndex: number | null; winReason: WinReason | null } {
  // 检查两个玩家的 hero.health <= 0
  for (let i = 0; i < 2; i++) {
    if (state.players[i].hero.health <= 0) {
      return { isGameOver: true, winnerIndex: (1 - i) as 0 | 1, winReason: 'HERO_KILLED' };
    }
  }
  // 检查牌库为空（这个检查由 drawCards 中的逻辑处理，这里不需要额外检查）
  return { isGameOver: state.isGameOver, winnerIndex: state.winnerIndex, winReason: state.winReason };
}
