// 首页 · 仪表盘
// 三件事：进得去（三大入口）、待得住（剪报，按时段换内容）、说得清（数据现状）。

const icons = require('../../utils/icons.js');
const store = require('../../utils/store.js');
const feedback = require('../../utils/feedback.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');
const content = require('../../utils/content.js');

const SWIPE_MS = 15000;
const TICK = 200;

Page({
  data: {
    icons,
    entryIcons: {
      schedule: icons.schedule_paper,
      notes: icons.notes_paper,
      ledger: icons.ledger_paper
    },
    theme: 'paper',
    masthead: '',
    greeting: '',
    greetHour: -1,
    entrySub: {
      schedule: '',
      notes: '',
      ledger: ''
    },
    slides: [],
    interval: SWIPE_MS,
    current: 0,
    progress: 0
  },

  onLoad() {
    this.setData({
      masthead: dateUtil.masthead(),
      greeting: copy.greet(),
      greetHour: new Date().getHours()
    });
    this.refreshSlides();
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    this.syncIcons();
    this.syncTabBar();
    this.refreshSummary();
    this.refreshGreeting();
    this.refreshSlides();
    this.startProgress();
  },

  // 五套皮肤各有一份配色图标，换主题就换图
  syncIcons() {
    const t = getApp().globalData.theme || 'paper';
    const pick = function (name) {
      return icons[name + '_' + t] || icons[name + '_paper'];
    };
    this.setData({
      entryIcons: {
        schedule: pick('schedule'),
        notes: pick('notes'),
        ledger: pick('ledger')
      }
    });
  },

  onHide() {
    this.stopProgress();
  },

  onUnload() {
    this.stopProgress();
  },

  onShareAppMessage() {
    return {
      title: '云里备忘录 · 日程、笔记、账本，一本就够',
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return { title: '云里备忘录 · 一本纸质感的手账' };
  },

  syncTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 挂后台几小时再回来，问候语要跟着当前时段走，不能还停在「早上好」
  refreshGreeting() {
    const hour = new Date().getHours();
    if (this.data.greetHour === hour) return;
    this.setData({ greeting: copy.greet(hour), greetHour: hour });
  },

  // 剪报按当前时段取一组，内容库自己管「不重复」，这里只管换
  refreshSlides() {
    const hour = new Date().getHours();
    const slides = content.batch(hour, 0, 3).map(function (item) {
      return {
        key: item.title,
        tag: item.tag,
        title: item.title,
        desc: item.desc,
        keyword: item.keyword
      };
    });
    this.setData({ slides: slides, current: 0 });
  },

  shuffle() {
    this.refreshSlides();
    this.startProgress();
    feedback.show('换了一批');
  },

  refreshSummary() {
    const now = new Date();
    const today = dateUtil.dayKey(now);
    const month = today.slice(0, 7);

    const tasks = store.getList(store.KEYS.TASKS);
    const nowMin = dateUtil.minutesOfDay(now);
    const pending = tasks.filter(function (t) {
      return t.date === today && !t.done && Number(t.endMin || 0) > nowMin;
    }).length;

    const notes = store.getList(store.KEYS.NOTES);

    const ledger = store.getList(store.KEYS.LEDGER);
    const spent = ledger.reduce(function (sum, item) {
      const isMonth = String(item.occurTime || '').slice(0, 7) === month;
      return isMonth && item.type !== 'income' ? sum + Number(item.amount || 0) : sum;
    }, 0);

    this.setData({
      'entrySub.schedule': pending ? '今天还有 ' + pending + ' 件' : '今天还没安排',
      'entrySub.notes': notes.length ? '已经记了 ' + notes.length + ' 篇' : '还没写过东西',
      'entrySub.ledger': spent ? '本月已花 ¥' + this.money(spent) : '还没开始记'
    });
  },

  money(value) {
    const num = Number(value) || 0;
    return num % 1 === 0 ? String(num) : num.toFixed(2);
  },

  startProgress() {
    this.stopProgress();
    if (!this.data.progress || this.data.progress >= 100) {
      this.setData({ progress: 0 });
    }
    const step = (100 / SWIPE_MS) * TICK;
    this.progressTimer = setInterval(() => {
      let next = this.data.progress + step;
      if (next > 100) next = 100;
      this.setData({ progress: next });
    }, TICK);
  },

  stopProgress() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  },

  onSwiperChange(e) {
    this.setData({ current: e.detail.current, progress: 0 });
    this.startProgress();
  },

  go(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.navigateTo({ url: url });
  },

  onKnow(e) {
    const keyword = e.currentTarget.dataset.keyword;
    wx.setClipboardData({
      data: keyword,
      success: () => {
        wx.hideToast();
        feedback.show(copy.pick('copyKeyword'));
      },
      fail: () => {
        feedback.show('复制没成功，再点一次试试');
      }
    });
  }
});
