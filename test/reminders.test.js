const { test } = require('node:test');
const assert = require('node:assert');
const { computeReminders } = require('../travel-plan-viz/assets/reminders.js');

test('computeReminders 按截止日期升序排序并正确计算', () => {
  const out = computeReminders('2026-07-01', [
    { item: '长白山门票', leadDays: 7 },
    { item: '机票', leadDays: 30 },
  ]);
  assert.deepStrictEqual(out, [
    { item: '机票', leadDays: 30, deadline: '2026-06-01' },
    { item: '长白山门票', leadDays: 7, deadline: '2026-06-24' },
  ]);
});
