// 周模板
// 手机屏幕放不下 7 列 × 14 行，所以按星期翻页：上面选星期，下面填时间格。
// 同步时只写「今天及以后」，过去的日子补进去只会立刻变成一堆灰掉的过期任务。

const store = require('../../utils/store.js');
const feedback = require('../../utils/feedback.js');
const dateUtil = require('../../utils/date.js');

const DAY_START = 0;
const DAY_END = 24 * 60;

const DAYS = [
  { v: 1, label: '周一' },
  { v: 2, label: '周二' },
  { v: 3, label: '周三' },
  { v: 4, label: '周四' },
  { v: 5, label: '周五' },
  { v: 6, label: '周六' },
  { v: 7, label: '周日' }
];

const HOURS = (function () {
  const arr = [];
  for (let m = DAY_START; m < DAY_END; m += 60) {
    arr.push({ start: m, label: dateUtil.clockByMin(m) });
  }
  return arr;
})();

Page({
  data: {
    theme: 'paper',
    days: DAYS,
    activeDay: 1,
    slots: [],
    editingStart: -1,
    filled: 0
  },

  onLoad() {
    this.setData({ activeDay: dateUtil.weekIndex(new Date()) });
    this.render();
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    this.render();
  },

  render() {
    const day = this.data.activeDay;
    const tpl = store.getList(store.KEYS.TEMPLATE);
    const map = {};
    tpl.forEach(function (item) {
      map[item.day + '_' + item.startMin] = item.text;
    });

    let filled = 0;
    const slots = HOURS.map(function (h) {
      const text = map[day + '_' + h.start] || '';
      if (text) filled += 1;
      return { start: h.start, label: h.label, text: text };
    });

    this.setData({ slots: slots, filled: filled });
  },

  switchDay(e) {
    const day = Number(e.currentTarget.dataset.day);
    if (day === this.data.activeDay) return;
    this.setData({ activeDay: day, editingStart: -1 });
    this.render();
  },

  // 点空格子就地变成输入框，失焦即存，不用再弹一层
  onSlotTap(e) {
    this.setData({ editingStart: Number(e.currentTarget.dataset.start) });
  },

  commitEdit(e) {
    const start = Number(e.currentTarget.dataset.start);
    if (this.committing === start) return;
    this.committing = start;
    setTimeout(() => {
      this.committing = null;
    }, 300);

    const text = (e.detail.value || '').trim();
    const day = this.data.activeDay;
    const rest = store.getList(store.KEYS.TEMPLATE).filter(function (item) {
      return !(item.day === day && item.startMin === start);
    });

    if (text) {
      rest.push({ day: day, startMin: start, text: text, duration: 60, tagId: 's_study' });
    }

    store.set(store.KEYS.TEMPLATE, rest);
    this.setData({ editingStart: -1 });
    this.render();
  },

  clearDay() {
    const day = this.data.activeDay;
    const rest = store.getList(store.KEYS.TEMPLATE).filter(function (item) {
      return item.day !== day;
    });
    store.set(store.KEYS.TEMPLATE, rest);
    this.render();
    feedback.show('这一天的模板清空了');
  },

  syncWeek() {
    const tpl = store.getList(store.KEYS.TEMPLATE);
    if (!tpl.length) {
      feedback.show('模板还空着，先填两格');
      return;
    }

    const now = new Date();
    const weekIndex = dateUtil.weekIndex(now);
    const monday = new Date(now);
    monday.setDate(now.getDate() - (weekIndex - 1));

    // 本周今天及以后的日子
    const scope = {};
    for (let i = weekIndex; i <= 7; i += 1) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + (i - 1));
      scope[dateUtil.dayKey(d)] = true;
    }

    const tasks = store.getList(store.KEYS.TASKS);

    // 已经打过勾的模板任务，重建时把完成状态带过去
    const doneMap = {};
    tasks.forEach(function (t) {
      if (t.source === 'template' && t.done && scope[t.date]) {
        doneMap[t.id] = t.doneTime || '';
      }
    });

    // 先清掉这段时间内由模板生成的任务：模板改了名字、改了时间，同步才跟得上
    const kept = tasks.filter(function (t) {
      return !(t.source === 'template' && scope[t.date]);
    });

    let added = 0;
    tpl.forEach(function (item) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + (item.day - 1));
      const key = dateUtil.dayKey(d);
      if (!scope[key]) return;

      const id = 'tpl:' + key + ':' + item.startMin;
      const done = Object.prototype.hasOwnProperty.call(doneMap, id);

      kept.push({
        id: id,
        date: key,
        startMin: item.startMin,
        endMin: Math.min(item.startMin + (item.duration || 60), 24 * 60),
        title: item.text,
        tagId: item.tagId || 's_study',
        source: 'template',
        done: done,
        doneTime: done ? doneMap[id] : ''
      });
      added += 1;
    });

    store.set(store.KEYS.TASKS, kept);

    if (added) {
      feedback.show('本周排好了 ' + added + ' 条，和模板一致');
    } else {
      feedback.show('模板里没有落在今天之后的安排');
    }
  }
});
