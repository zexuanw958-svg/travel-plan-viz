const { test } = require('node:test');
const assert = require('node:assert');
const { computeReminders, renderChecklistHTML, reminderBadgeHTML } = require('../travel-plan-viz/assets/reminders.js');

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

test('renderChecklistHTML 输出含截止日期与事项的清单', () => {
  const html = renderChecklistHTML([
    { item: '机票', leadDays: 30, deadline: '2026-06-01' },
  ]);
  assert.ok(html.includes('<ul class="pretrip-todo">'));
  assert.ok(html.includes('2026-06-01前'));
  assert.ok(html.includes('机票'));
  assert.ok(html.includes('建议提前30天'));
  assert.ok(html.includes('type="checkbox"'));
});

test('reminderBadgeHTML 输出带提前天数的徽标', () => {
  const badge = reminderBadgeHTML(7);
  assert.ok(badge.includes('⚠️'));
  assert.ok(badge.includes('建议提前7天订'));
});
