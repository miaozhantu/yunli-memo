// 主题皮肤
// 只换 CSS 变量，结构和交互一律不动。换完 reLaunch 回首页，让所有页面重建。

const themeLib = require('../../utils/theme.js');
const feedback = require('../../utils/feedback.js');

Page({
  data: {
    theme: 'paper',
    themes: []
  },

  onLoad() {
    this.setData({ theme: themeLib.current(), themes: themeLib.list() });
  },

  pick(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.theme) return;

    themeLib.apply(id);
    this.setData({ theme: id });
    feedback.show('换好了，看看合不合眼');

    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' });
    }, 900);
  }
});
