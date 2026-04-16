// ─── Card Builders Barrel ────────────────────────────────────────────
// 聚合 effects DSL + civilization 工厂，并预构 5 大文明单例方便导入。

import { createCivilization } from './civilization.js';

export * from './effects.js';
export * from './civilization.js';

export const china = createCivilization({ code: 'CHINA', idPrefix: 'china' });
export const japan = createCivilization({ code: 'JAPAN', idPrefix: 'japan' });
export const germany = createCivilization({ code: 'GERMANY', idPrefix: 'germany' });
export const usa = createCivilization({ code: 'USA', idPrefix: 'usa' });
export const uk = createCivilization({ code: 'UK', idPrefix: 'uk' });
