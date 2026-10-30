// 我的（底栏第三个 tab）
// 不做登录、不取头像昵称，这里只显示这台手机上到底存了多少东西。

const store = require('../../utils/store.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: {
    theme: 'paper',
    stats: {
      tasks: 0,
      notes: 0,
      ledger: 0
    },
    monthLabel: '',
    monthSpend: '0',
    line: ''
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.refresh();
  },

  refresh() {
    const tasks = store.getList(store.KEYS.TASKS);
    const notes = store.getList(store.KEYS.NOTES);
    const ledger = store.getList(store.KEYS.LEDGER);

    const month = dateUtil.dayKey().slice(0, 7);
    const spent = ledger.reduce(function (sum, item) {
      const isMonth = String(item.occurTime || '').slice(0, 7) === month;
      return isMonth && item.type !== 'income' ? sum + Number(item.amount || 0) : sum;
    }, 0);

    const today = dateUtil.dayKey();
    const pending = tasks.filter(function (t) {
      return t.date === today;
    }).length;

    this.setData({
      stats: {
        tasks: tasks.length,
        notes: notes.length,
        ledger: ledger.length
      },
      monthLabel: month.replace('-', ' 年 ') + ' 月',
      monthSpend: spent % 1 === 0 ? String(spent) : spent.toFixed(2),
      line: pending === 0 && notes.length === 0 ? copy.pick('empty') : copy.pick('general')
    });
  }
});
