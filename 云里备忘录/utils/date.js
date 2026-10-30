// 日期时间小工具（页面和后面的阶段共用）

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// YYYY-MM-DD，用作日程/账目的日期键
function dayKey(date) {
  const d = date || new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// 09:30
function clock(date) {
  const d = date || new Date();
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 540 -> 09:00
function clockByMin(min) {
  const m = Math.max(0, Math.min(1440, Math.round(min)));
  return pad(Math.floor(m / 60)) + ':' + pad(m % 60);
}

// 当天 0 点起的分钟数，日程判断过期用
function minutesOfDay(date) {
  const d = date || new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// 'THU · 10.29'
function masthead(date) {
  const d = date || new Date();
  return WEEK_EN[d.getDay()] + ' · ' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
}

// '10 月 29 日 周四'
function fullLabel(date) {
  const d = date || new Date();
  return d.getMonth() + 1 + ' 月 ' + d.getDate() + ' 日 ' + WEEK_CN[d.getDay()];
}

// 0-7 的周序号，周一为 1
function weekIndex(date) {
  const d = date || new Date();
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

module.exports = { pad, dayKey, clock, clockByMin, minutesOfDay, masthead, fullLabel, weekIndex, WEEK_CN };
