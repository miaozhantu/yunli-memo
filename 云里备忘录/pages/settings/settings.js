// 设置（底栏第二个 tab）
// 第一阶段只放能真正生效的开关，不做假功能。

const store = require('../../utils/store.js');
const feedback = require('../../utils/feedback.js');
const dateUtil = require('../../utils/date.js');
const themeLib = require('../../utils/theme.js');

Page({
  data: {
    theme: 'paper',
    themeName: '米黄纸',
    moodCopy: true,
    version: '0.3.0',
    summary: ''
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    const current = themeLib.current();
    this.setData({
      moodCopy: store.config().moodCopy !== false,
      themeName: themeLib.meta(current).name,
      summary: this.buildSummary()
    });
  },

  goTheme() {
    wx.navigateTo({ url: '/pages/theme/theme' });
  },

  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' });
  },

  buildSummary() {
    const tasks = store.getList(store.KEYS.TASKS).length;
    const notes = store.getList(store.KEYS.NOTES).length;
    const ledger = store.getList(store.KEYS.LEDGER).length;
    return tasks + ' 条日程 · ' + notes + ' 篇笔记 · ' + ledger + ' 笔账';
  },

  onMoodChange(e) {
    const value = e.detail.value;
    store.set(store.KEYS.CONFIG, Object.assign({}, store.config(), { moodCopy: value }));
    this.setData({ moodCopy: value });
    feedback.show(value ? '好，文案继续贫嘴' : '好，改成朴素的说话方式');
  },

  // 导出成 JSON：先落成本地文件，再走「转发给朋友/自己」，这样电脑上也能收
  exportData() {
    const payload = {
      app: '云里备忘录',
      version: 1,
      exportedAt: dateUtil.dayKey() + ' ' + dateUtil.clock(),
      tasks: store.getList(store.KEYS.TASKS),
      notes: store.getList(store.KEYS.NOTES),
      ledger: store.getList(store.KEYS.LEDGER),
      tags: store.getList(store.KEYS.TAGS),
      template: store.getList(store.KEYS.TEMPLATE),
      config: store.config()
    };

    const total = payload.tasks.length + payload.notes.length + payload.ledger.length;
    if (!total) {
      feedback.show('还没有东西可以导出');
      return;
    }

    const text = JSON.stringify(payload, null, 2);
    const path = wx.env.USER_DATA_PATH + '/云里备忘录备份.json';

    try {
      wx.getFileSystemManager().writeFileSync(path, text, 'utf8');
    } catch (e) {
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.hideToast();
          feedback.show('存成文件失败了，内容已经放进剪贴板');
        }
      });
      return;
    }

    if (!wx.shareFileMessage) {
      feedback.show('当前微信版本不支持发送文件，请用电脑端导出');
      return;
    }

    wx.shareFileMessage({
      filePath: path,
      fileName: '云里备忘录备份.json',
      success: () => feedback.show('备份发出去了，存到自己聊天里就行'),
      fail: () => feedback.show('没发出去，可以再试一次')
    });
  },

  copyData() {
    const payload = {
      app: '云里备忘录',
      version: 1,
      exportedAt: dateUtil.dayKey() + ' ' + dateUtil.clock(),
      tasks: store.getList(store.KEYS.TASKS),
      notes: store.getList(store.KEYS.NOTES),
      ledger: store.getList(store.KEYS.LEDGER),
      tags: store.getList(store.KEYS.TAGS),
      template: store.getList(store.KEYS.TEMPLATE),
      config: store.config()
    };
    wx.setClipboardData({
      data: JSON.stringify(payload),
      success: () => {
        wx.hideToast();
        feedback.show('全部数据已复制，粘贴到备忘录里就能存');
      }
    });
  }
});
