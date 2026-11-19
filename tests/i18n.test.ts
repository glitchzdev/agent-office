import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/client/i18n/index.js';
import { ES_1 } from '../src/client/i18n/es-1.js';
import { ES_2 } from '../src/client/i18n/es-2.js';
import { ES_3 } from '../src/client/i18n/es-3.js';
import { ES_4 } from '../src/client/i18n/es-4.js';

test('the office’s own words come out in Spanish, keeping the spaces around them', () => {
  assert.equal(translate('Hire a worker'), 'Contratar a un empleado');
  assert.equal(translate('  Settings '), '  Ajustes ');
  assert.equal(translate('📋 Task queue'), '📋 Cola de tareas');
});

test('sentences with a name in them are translated by pattern, the name kept', () => {
  assert.equal(translate('🙋 Mochi needs you'), '🙋 Mochi te necesita');
  assert.equal(translate('✨ Hire a worker at Desk 3'), '✨ Contratar a un empleado en Escritorio 3');
  assert.equal(translate('🎉 PR #12 merged: Add the autopilot'), '🎉 PR #12 fusionado: Add the autopilot');
});

test('what isn’t the office’s own text is left alone', () => {
  assert.equal(translate('npm run build'), undefined);
  assert.equal(translate('Mochi'), undefined);
  assert.equal(translate('42'), undefined);
});

test('every English text has one Spanish one, and none is empty', () => {
  const seen = new Set<string>();
  for (const [en, es] of [...ES_1, ...ES_2, ...ES_3, ...ES_4]) {
    assert.ok(en.trim() && es.trim(), `empty entry for ${JSON.stringify(en)}`);
    assert.ok(!seen.has(en), `${JSON.stringify(en)} is in the dictionary twice`);
    seen.add(en);
  }
});

test('the words painted in the 3D world come out in Spanish too', () => {
  assert.equal(translate('Pull Requests'), 'Pull requests (cambios)');
  assert.equal(translate('PR agent'), 'Agente de PR');
  assert.equal(translate('Ask me about PRs'), 'Pregúntame por los PR');
  assert.equal(translate('💬 READY'), '💬 LISTO');
  assert.equal(translate('🔀 PR #9 OPEN'), '🔀 PR #9 ABIERTO');
  assert.equal(translate('Claude Code · Opus 5.5 · High'), 'Claude Code · Opus 5.5 · Alto');
  assert.equal(translate('Claude Code · Opus 5.5 · High · Radar GTA VI'), 'Claude Code · Opus 5.5 · Alto · Radar GTA VI');
  assert.equal(translate('EXIT'), 'SALIDA');
});
