// Spanish for the words painted in the 3D world: signs, boards, name tags and the bubbles and cards
// over workers' heads (see canvas.ts). The DOM's words are in es-1 to es-3.
export const ES_4: ReadonlyArray<readonly [string, string]> = [
  // Boards and signs
  ['Pull Requests', 'Pull requests (cambios)'],
  ['EXIT', 'SALIDA'],
  // Board agents
  ['Issues agent', 'Agente de pendientes'],
  ['PR agent', 'Agente de PR'],
  ['Queue agent', 'Agente de la cola'],
  ['Ask me about issues', 'Pregúntame por los pendientes'],
  ['Ask me about PRs', 'Pregúntame por los PR'],
  ['Ask me to queue work', 'Pídeme que encole trabajo'],
  ['📌 Ask me', '📌 Pregúntame'],
  ['🔀 Ask me', '🔀 Pregúntame'],
  ['📋 Ask me', '📋 Pregúntame'],
  ['📡 Ask me', '📡 Pregúntame'],
  ['📜 Ask me', '📜 Pregúntame'],
  // Workers' bubbles and the pill on their cards
  ['🙋 NEEDS YOU', '🙋 TE NECESITA'],
  ['⏳ STARTING', '⏳ EMPEZANDO'],
  ['💬 READY', '💬 LISTO'],
  ['⌨️ WORKING', '⌨️ TRABAJANDO'],
  ['✅ DONE', '✅ TERMINADO'],
  ['💤 ASLEEP', '💤 DORMIDO'],
  ['🌿 WORKTREE DELETED', '🌿 WORKTREE BORRADO'],
  ['🌿 worktree deleted', '🌿 worktree borrado'],
  ['✅ done!', '✅ ¡listo!'],
  ['⌨️ working', '⌨️ trabajando'],
  // More signs around the building
  ['👑 Boss Office', '👑 Oficina del jefe'],
  ['👑 BOSS', '👑 JEFE'],
  ['🏎️  GARAGE', '🏎️  GARAJE'],
  ['MINESWEEPER', 'BUSCAMINAS'],
  ['🎯 DARTS', '🎯 DARDOS'],
  ['⛳ Hole 1 · Par 1', '⛳ Hoyo 1 · Par 1'],
  ['🍺 Ale', '🍺 Cerveza'],
  ['🤝 The small council', '🤝 El pequeño consejo'],
  ['🍦 Snacks', '🍦 Botanas'],
  ['🏎️ SCENIC LOOP', '🏎️ CIRCUITO PANORÁMICO'],
  ['🌾 farm · 🌲 pines · 🏔️ mountains · 🏖️ beach — 1.4 km, either way ⟷', '🌾 granja · 🌲 pinos · 🏔️ montañas · 🏖️ playa — 1.4 km, en cualquier sentido ⟷'],
  ['⚠️ Airlock', '⚠️ Esclusa'],
  ['☕ Hot drinks', '☕ Bebidas calientes'],
  ['🤝 Briefing room', '🤝 Sala de reuniones'],
  ['🚀 Docking port', '🚀 Puerto de atraque'],
  ['Rooftop bar', 'Bar de la azotea'],
  ['Floors & projects', 'Plantas y proyectos'],
];

/** The same world's words that carry a number or a name. */
export const ES_4_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(🔀|🎉) PR #(\d+) OPEN$/, '$1 PR #$2 ABIERTO'],
  [/^(🔀|🎉) PR #(\d+) MERGED$/, '$1 PR #$2 FUSIONADO'],
  [/^(🔀|🎉) PR #(\d+) open$/, '$1 PR #$2 abierto'],
  [/^(🔀|🎉) PR #(\d+) merged$/, '$1 PR #$2 fusionado'],
  [/^\+(\d+) more$/, '+$1 más'],
  [/^🛰️ (.+) STATION$/, '🛰️ ESTACIÓN $1'],
  // "Claude Code · Opus 5.5 · High", with or without more after it: only the effort changes.
  [/^(.+?) · (Low|Medium|High|Extra high|Max)((?: · .*)?)$/, '$1 · $2$3'],
];
