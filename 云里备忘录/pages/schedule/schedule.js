// 日程安排
// 全天 24 小时可滚动时间轴 + 顶部概览（关键词简写、可打勾）+ 日期可切换 + 粒度可调。
// 概览只显示「未完成且没过期」的事；打勾的进「已完成」，过期的进「已翻篇」。
// 时间轴始终显示全部，打勾的变淡加删除线，但依然在原来的位置。

const store = require('../../utils/store.js');
const tagLib = require('../../utils/tags.js');
const feedback = require('../../utils/feedback.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');
const keyword = require('../../utils/keywords.js');

const DAY_START = 0;
const DAY_END = 24 * 60;
const HOUR_H = 100;
const DOUBLE_TAP = 320;

// 粒度越细，每小时给的高度越高：15 分钟一格只剩 25rpx 的话根本点不中
const VIEWS = [
  { v: 15, label: '15 分钟', hourH: 150 },
  { v: 30, label: '30 分钟', hourH: 120 },
  { v: 60, label: '1 小时', hourH: 100 }
];

const DURATION_MAP = {
  15: [
    { v: 15, label: '15 分' },
    { v: 30, label: '30 分' },
    { v: 45, label: '45 分' },
    { v: 60, label: '1 小时' },
    { v: 90, label: '1.5 小时' }
  ],
  30: [
    { v: 30, label: '30 分' },
    { v: 60, label: '1 小时' },
    { v: 90, label: '1.5 小时' },
    { v: 120, label: '2 小时' }
  ],
  60: [
    { v: 60, label: '1 小时' },
    { v: 120, label: '2 小时' },
    { v: 180, label: '3 小时' },
    { v: 240, label: '4 小时' }
  ]
};

function gid() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function tint(hex, alpha) {
  const h = (hex || '#B5793F').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function parseKey(key) {
  const p = String(key || '').split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function dayLabel(key) {
  const today = dateUtil.dayKey();
  const d = parseKey(key);
  const body = d.getMonth() + 1 + ' 月 ' + d.getDate() + ' 日 ' + dateUtil.WEEK_CN[d.getDay()];
  if (key === today) return '今天 · ' + body;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === dateUtil.dayKey(tomorrow)) return '明天 · ' + body;
  return body;
}

Page({
  data: {
    theme: 'paper',
    viewDate: '',
    dateLabel: '',
    isToday: true,
    slotMinutes: 60,
    slotH: HOUR_H,
    hourH: HOUR_H,
    scrollH: 660,
    slots: [],
    hours: [],
    views: VIEWS,
    viewLabel: '1 小时',
    bodyHeight: ((DAY_END - DAY_START) / 60) * HOUR_H,
    endLabel: '24:00',
    nowTop: -1,
    nowLabel: '',
    scrollTop: 0,
    activeStart: -1,
    highlightKey: '',
    rows: [],
    overview: [],
    doneList: [],
    passedList: [],
    doneOpen: false,
    passedOpen: false,
    tags: [],
    durations: DURATION_MAP[60],
    viewSheet: { visible: false },
    editing: {
      visible: false,
      id: '',
      title: '',
      startMin: DAY_START,
      endMin: DAY_START + 60,
      duration: 60,
      tagId: '',
      isNew: true,
      range: '',
      focus: false,
      confirmDelete: false
    }
  },

  onLoad() {
    const conf = store.config();
    const slotMinutes = DURATION_MAP[conf.slotMinutes] ? Number(conf.slotMinutes) : 60;
    this.applySlot(slotMinutes);
    this.setData({ viewDate: dateUtil.dayKey() });
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    this.computeScrollH();
    this.load();
    this.startTicker();
    this.scrollToNow();
  },

  onHide() {
    this.stopTicker();
  },

  onUnload() {
    this.stopTicker();
  },

  onShareAppMessage() {
    return { title: '云里备忘录 · 一格一小时，把一天排明白', path: '/pages/index/index' };
  },

  startTicker() {
    this.stopTicker();
    this.ticker = setInterval(() => this.load(), 30000);
  },

  // 时间轴可视高度自适应：屏幕减去导航和上下卡片，剩下的尽量都给时间轴。
  // 固定 660rpx 的话，傍晚的事会被滚动窗口的底边切一半，看起来像内容被截掉了。
  computeScrollH() {
    let winH = 667;
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      winH = info.windowHeight || 667;
    } catch (e) {
      winH = 667;
    }
    const g = getApp().globalData || {};
    const nav = (g.statusBarHeight || 20) + (g.navBarHeight || 44);
    // 日期条 + 概览（按两行估）+ 日志两个头 + 页脚和边距，固定开销按 px 算
    const chrome = nav + 34 + 118 + 100 + 30;
    const rpx = Math.round((winH - chrome) * 2);
    this.setData({ scrollH: Math.max(560, Math.min(940, rpx)) });
  },

  stopTicker() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  },

  /* ---------- 粒度 ---------- */

  applySlot(slotMinutes) {
    const view = VIEWS.filter(function (x) {
      return x.v === slotMinutes;
    })[0] || VIEWS[2];
    const hourH = view.hourH;

    const slots = [];
    for (let m = DAY_START; m < DAY_END; m += slotMinutes) {
      let kind = 'quarter';
      if (m % 60 === 0) kind = 'hour';
      else if (m % 60 === 30) kind = 'half';
      slots.push({
        start: m,
        kind: kind,
        label: kind === 'hour' ? dateUtil.clockByMin(m) : ''
      });
    }

    // 时间列只标整点，按绝对位置钉，别让它跟着格子高度走
    const hours = [];
    for (let m = DAY_START; m < DAY_END; m += 60) {
      hours.push({ top: (m / 60) * hourH, label: dateUtil.clockByMin(m) });
    }

    this.setData({
      slotMinutes: view.v,
      hourH: hourH,
      slotH: (hourH * view.v) / 60,
      bodyHeight: ((DAY_END - DAY_START) / 60) * hourH,
      slots: slots,
      hours: hours,
      durations: DURATION_MAP[view.v] || DURATION_MAP[60],
      viewLabel: view.label
    });
  },

  openViewSheet() {
    this.setData({ 'viewSheet.visible': true });
  },

  closeViewSheet() {
    this.setData({ 'viewSheet.visible': false });
  },

  pickView(e) {
    const v = Number(e.currentTarget.dataset.v);
    store.set(store.KEYS.CONFIG, Object.assign({}, store.config(), { slotMinutes: v }));
    this.applySlot(v);
    this.setData({ 'viewSheet.visible': false });
    this.load();
    feedback.show('时间轴改成 ' + (v === 60 ? '1 小时' : v + ' 分钟') + ' 一格');
  },

  /* ---------- 数据 ---------- */

  load() {
    const viewDate = this.data.viewDate;
    const today = dateUtil.dayKey();
    const nowMin = dateUtil.minutesOfDay(new Date());
    const isToday = viewDate === today;
    const isPast = viewDate < today;

    const tags = tagLib.list('schedule');
    const tagMap = {};
    tags.forEach(function (t) {
      tagMap[t.id] = t;
    });

    const all = store
      .getList(store.KEYS.TASKS)
      .filter(function (t) {
        return t.date === viewDate;
      })
      .map(function (t) {
        const startMin = Number(t.startMin) || 0;
        const endMin = Number(t.endMin) || startMin + 60;
        const tag = tagMap[t.tagId];
        const color = tag ? tag.colorHex : '#B5793F';
        const overdue = isPast || (isToday && endMin <= nowMin);
        return {
          id: t.id,
          title: t.title || '未命名',
          startMin: startMin,
          endMin: endMin,
          color: color,
          bg: tint(color, 0.16),
          done: !!t.done,
          expired: overdue && !t.done,
          range: dateUtil.clockByMin(startMin) + ' - ' + dateUtil.clockByMin(endMin),
          brief: keyword.brief(t.title)
        };
      })
      .sort(function (a, b) {
        return a.startMin - b.startMin;
      });

    const overview = all
      .filter(function (t) {
        return !t.done && !t.expired;
      })
      .map(function (t) {
        return {
          id: t.id,
          time: dateUtil.clockByMin(t.startMin),
          brief: t.brief,
          title: t.title,
          color: t.color
        };
      });

    const doneList = all
      .filter(function (t) {
        return t.done;
      })
      .map(function (t) {
        return { id: t.id, time: dateUtil.clockByMin(t.startMin), brief: t.brief, title: t.title };
      })
      .reverse();

    const passedList = all
      .filter(function (t) {
        return t.expired;
      })
      .map(function (t) {
        return { id: t.id, time: dateUtil.clockByMin(t.startMin), brief: t.brief, title: t.title, color: t.color };
      })
      .reverse();

    const nowTop =
      isToday && nowMin >= DAY_START && nowMin <= DAY_END
        ? ((nowMin - DAY_START) / 60) * this.data.hourH
        : -1;

    this.setData({
      rows: this.buildRows(all),
      overview: overview,
      doneList: doneList,
      passedList: passedList,
      tags: tags,
      isToday: isToday,
      dateLabel: dayLabel(viewDate),
      nowTop: nowTop,
      nowLabel: dateUtil.clock(new Date())
    });
  },

  // 一小时粒度下，同一小时内的事合并成一个块、块内分点；
  // 跨小时的不合并。细粒度下不合并，按真实时长铺开。
  buildRows(list) {
    const merged = this.data.slotMinutes === 60;
    const HH = this.data.hourH;
    const rows = [];

    if (!merged) {
      list.forEach((t) => {
        const height = ((t.endMin - t.startMin) / 60) * HH - 4;
        rows.push({
          key: t.id,
          top: (t.startMin / 60) * HH,
          height: Math.max(26, height),
          color: t.color,
          bg: t.bg,
          compact: height < 62,
          items: [{ id: t.id, title: t.title, done: t.done }]
        });
      });
      return rows;
    }

    const buckets = {};
    const loose = [];

    list.forEach(function (t) {
      const sameHour = Math.floor(t.startMin / 60) === Math.floor((t.endMin - 1) / 60);
      if (!sameHour) {
        loose.push(t);
        return;
      }
      const hour = Math.floor(t.startMin / 60);
      if (!buckets[hour]) buckets[hour] = [];
      buckets[hour].push(t);
    });

    Object.keys(buckets).forEach((hour) => {
      const group = buckets[hour].sort(function (a, b) {
        return a.startMin - b.startMin;
      });
      const last = group[group.length - 1];
      const height = Math.max(26, ((last.endMin - Number(hour) * 60) / 60) * HH - 4);

      rows.push({
        key: 'h' + hour,
        top: Number(hour) * HH,
        height: height,
        color: group[0].color,
        bg: group[0].bg,
        compact: height < 62,
        items: group.map(function (t) {
          return { id: t.id, title: t.title, done: t.done };
        })
      });
    });

    loose.forEach(function (t) {
      const height = ((t.endMin - t.startMin) / 60) * HH - 4;
      rows.push({
        key: t.id,
        top: (t.startMin / 60) * HH,
        height: Math.max(26, height),
        color: t.color,
        bg: t.bg,
        compact: height < 62,
        items: [{ id: t.id, title: t.title, done: t.done }]
      });
    });

    return rows.sort(function (a, b) {
      return a.top - b.top;
    });
  },

  scrollToNow() {
    if (this.scrolled) return;
    this.scrolled = true;
    if (this.data.nowTop > 0) {
      this.setData({ scrollTop: Math.max(0, this.data.nowTop - 220) });
    }
  },

  /* ---------- 日期 ---------- */

  switchDate(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    const d = parseKey(this.data.viewDate);
    d.setDate(d.getDate() + delta);
    this.setData({ viewDate: dateUtil.dayKey(d) }, () => this.load());
  },

  // 直接选日期，不用点三十次
  onPickDate(e) {
    const value = e.detail.value;
    if (!value || value === this.data.viewDate) return;
    this.setData({ viewDate: value }, () => this.load());
  },

  goToday() {
    this.setData({ viewDate: dateUtil.dayKey() }, () => {
      this.load();
      this.setData({ scrollTop: Math.max(0, this.data.nowTop - 220) });
    });
  },

  /* ---------- 打勾 ---------- */

  toggleDone(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const list = store.getList(store.KEYS.TASKS);
    const index = list.findIndex(function (t) {
      return t.id === id;
    });
    if (index < 0) return;

    const next = !list[index].done;
    list[index] = Object.assign({}, list[index], {
      done: next,
      doneTime: next ? dateUtil.dayKey() + ' ' + dateUtil.clock() : ''
    });
    store.set(store.KEYS.TASKS, list);
    this.load();
    feedback.show(next ? '这一件收了' : '又放回去了');
  },

  // 点概览条目：滚到时间轴对应位置并闪一下
  locateTask(e) {
    const id = e.currentTarget.dataset.id;
    let target = null;
    this.data.rows.forEach(function (row) {
      row.items.forEach(function (item) {
        if (item.id === id) target = row;
      });
    });
    if (!target) return;

    this.setData({
      scrollTop: Math.max(0, target.top - 200),
      highlightKey: target.key
    });
    clearTimeout(this.hitTimer);
    this.hitTimer = setTimeout(() => this.setData({ highlightKey: '' }), 1600);
  },

  /* ---------- 编辑 ---------- */

  goTemplate() {
    wx.navigateTo({ url: '/pages/template/template' });
  },

  // 单击就能开编辑；双击也行——第二次点击落在遮罩上，用 openedAt 挡 380ms 防止刚开就关
  onCellTap(e) {
    const start = Number(e.currentTarget.dataset.start);
    if (Date.now() - (this.openedAt || 0) < 380) return;
    this.openedAt = Date.now();
    // 这个格子里已经有事了就打开那件事改，不能再插一件重复的
    const viewDate = this.data.viewDate;
    const hit = store.getList(store.KEYS.TASKS).filter(function (t) {
      if (t.date !== viewDate) return false;
      const s = Number(t.startMin) || 0;
      const en = Number(t.endMin) || s + 60;
      return start >= s && start < en;
    })[0];
    this.openEditor(start, hit || null);
  },

  onTaskTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const task = store.getList(store.KEYS.TASKS).filter(function (t) {
      return t.id === id;
    })[0];
    if (!task) return;
    this.openEditor(Number(task.startMin) || 0, task);
  },

  openEditor(startMin, task) {
    const tagList = this.data.tags;
    const fallbackTag = tagList.length ? tagList[0].id : '';
    const slot = this.data.slotMinutes;
    const endMin = task ? Number(task.endMin) || startMin + slot : Math.min(startMin + slot, DAY_END);

    this.setData({
      editing: {
        visible: true,
        id: task ? task.id : '',
        title: task ? task.title : '',
        startMin: startMin,
        endMin: endMin,
        duration: Math.max(slot, endMin - startMin),
        tagId: task && task.tagId ? task.tagId : fallbackTag,
        isNew: !task,
        range: dateUtil.clockByMin(startMin) + ' - ' + dateUtil.clockByMin(endMin),
        focus: true,
        confirmDelete: false
      }
    });
  },

  closeEditor() {
    // 双击的第二下会落在遮罩上，别让它把刚打开的抽屉关掉
    if (Date.now() - (this.openedAt || 0) < 380) return;
    this.setData({
      'editing.visible': false,
      'editing.focus': false,
      'editing.confirmDelete': false
    });
  },

  noop() {},

  onTitleInput(e) {
    this.setData({ 'editing.title': e.detail.value });
  },

  onTagPick(e) {
    this.setData({ 'editing.tagId': e.currentTarget.dataset.id });
  },

  onDuration(e) {
    const v = Number(e.currentTarget.dataset.v);
    const startMin = this.data.editing.startMin;
    const endMin = Math.min(startMin + v, DAY_END);
    this.setData({
      'editing.duration': v,
      'editing.endMin': endMin,
      'editing.range': dateUtil.clockByMin(startMin) + ' - ' + dateUtil.clockByMin(endMin)
    });
  },

  onSave() {
    const e = this.data.editing;
    const title = (e.title || '').trim();
    if (!title) {
      feedback.show('给它起个名字吧');
      return;
    }

    const list = store.getList(store.KEYS.TASKS);

    if (e.isNew) {
      list.push({
        id: gid(),
        date: this.data.viewDate,
        startMin: e.startMin,
        endMin: e.endMin,
        title: title,
        tagId: e.tagId,
        done: false,
        source: 'manual'
      });
    } else {
      const index = list.findIndex(function (t) {
        return t.id === e.id;
      });
      if (index >= 0) {
        list[index] = Object.assign({}, list[index], {
          startMin: e.startMin,
          endMin: e.endMin,
          title: title,
          tagId: e.tagId
        });
      }
    }

    store.set(store.KEYS.TASKS, list);
    this.closeEditor();
    this.load();
    feedback.show(copy.pick('schedule'));
  },

  onDelete() {
    const e = this.data.editing;
    if (!e.confirmDelete) {
      this.setData({ 'editing.confirmDelete': true });
      return;
    }

    const list = store.getList(store.KEYS.TASKS).filter(function (t) {
      return t.id !== e.id;
    });
    store.set(store.KEYS.TASKS, list);
    this.closeEditor();
    this.load();
    feedback.show('删掉了，位置腾出来了');
  },

  togglePassed() {
    this.setData({ passedOpen: !this.data.passedOpen });
  },

  toggleDoneList() {
    this.setData({ doneOpen: !this.data.doneOpen });
  }
});
