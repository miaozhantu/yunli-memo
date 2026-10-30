// 自定义导航栏
// 微信右上角的胶囊按钮不可挪动，标题必须真正居中、返回键要让开胶囊，
// 所以高度和左右安全边距都按胶囊的实际位置算。

const icons = require('../../utils/icons.js');

Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },

  properties: {
    title: {
      type: String,
      value: '云里备忘录'
    },
    // 首页等一级页面传 false
    showBack: {
      type: Boolean,
      value: true
    }
  },

  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    rightOffset: 96,
    icons,
    backIcon: icons.back_paper
  },

  lifetimes: {
    attached() {
      const app = getApp();
      const g = (app && app.globalData) || {};
      const menu = g.menuRect;
      const theme = g.theme || 'paper';

      let rightOffset = 96;
      if (menu && menu.left) {
        // 右侧按钮要让开胶囊：从屏幕右边到胶囊左边的距离，再留 8px
        let width = 375;
        try {
          const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          width = info.windowWidth || 375;
        } catch (e) {
          width = 375;
        }
        rightOffset = width - menu.left + 8;
      }

      this.setData({
        statusBarHeight: g.statusBarHeight || 20,
        navBarHeight: g.navBarHeight || 44,
        rightOffset: rightOffset,
        backIcon: icons['back_' + theme] || icons.back_paper
      });
    }
  },

  methods: {
    onBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
        return;
      }
      // 从分享链接直接进二级页时没有上一页，回首页
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
