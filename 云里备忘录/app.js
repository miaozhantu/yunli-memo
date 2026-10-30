// 云里备忘录 · 入口
App({
  globalData: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuRect: null,
    theme: 'paper'
  },

  onLaunch() {
    this.measureSystem();
    this.loadTheme();
  },

  loadTheme() {
    try {
      const theme = require('./utils/theme.js');
      this.globalData.theme = theme.current();
    } catch (e) {
      this.globalData.theme = 'paper';
    }
  },

  // 自定义导航栏要贴着胶囊按钮排，这里统一量一次，页面复用
  measureSystem() {
    let info = {};
    try {
      info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    } catch (e) {
      info = {};
    }

    let menuRect = null;
    try {
      menuRect = wx.getMenuButtonBoundingClientRect();
    } catch (e) {
      menuRect = null;
    }

    const statusBarHeight = info.statusBarHeight || 20;
    const navBarHeight =
      menuRect && menuRect.height
        ? (menuRect.top - statusBarHeight) * 2 + menuRect.height
        : 44;

    this.globalData.statusBarHeight = statusBarHeight;
    this.globalData.navBarHeight = navBarHeight;
    this.globalData.menuRect = menuRect;
  }
});
