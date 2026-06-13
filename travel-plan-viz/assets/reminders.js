// 出发前提醒：截止日期计算 + 渲染。浏览器与 Node 双用。

// startDateISO: 'YYYY-MM-DD'；items: [{item, leadDays}]
// 返回按 deadline 升序的 [{item, leadDays, deadline}]，deadline 为 'YYYY-MM-DD'
// 用 UTC 做日期运算，避免本地时区导致的偏移。
function computeReminders(startDateISO, items) {
  return items
    .map(function (it) {
      var d = new Date(startDateISO + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - it.leadDays);
      return { item: it.item, leadDays: it.leadDays, deadline: d.toISOString().slice(0, 10) };
    })
    .sort(function (a, b) {
      return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
    });
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderChecklistHTML(reminders) {
  var lis = reminders.map(function (r) {
    return '<li class="todo-item">'
      + '<input type="checkbox"> '
      + '<span class="todo-deadline">' + r.deadline + '前</span> '
      + '<span class="todo-text">' + escapeHTML(r.item) + '（建议提前' + r.leadDays + '天）</span>'
      + '</li>';
  }).join('');
  return '<ul class="pretrip-todo">' + lis + '</ul>';
}

function reminderBadgeHTML(leadDays) {
  return '<span class="reminder-badge">⚠️ 建议提前' + leadDays + '天订</span>';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeReminders: computeReminders,
    renderChecklistHTML: renderChecklistHTML,
    reminderBadgeHTML: reminderBadgeHTML,
  };
}
