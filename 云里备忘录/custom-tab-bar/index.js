// 自定义底栏
// 原生 tabBar 只能用 PNG 且做不了手账风，所以整体自绘。
// 约定：三个 tab 页在 onShow 里调 this.getTabBar().setData({ selected: n })。

const icons = require('../utils/icons.js');
const theme = require('../utils/theme.js');

Component({
  data: {
    theme: 'paper',
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'tabHome' },
      { pagePath: '/pages/settings/settings', text: '设置', icon: 'tabSetting' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'tabMine' }
    ],
    icons
  },

  lifetimes: {
    attached() {
      // 底栏是独立组件，拿不到页面的变量，得自己挂主题类
      this.setData({ theme: theme.current() });
    }
  },

  pageLifetimes: {
    show() {
      this.setData({ theme: theme.current() });
    }
  },

  methods: {
    onTap(e) {
      const index = Number(e.currentTarget.dataset.index);
      const item = this.data.list[index];
      if (!item || index === this.data.selected) return;
      wx.switchTab({ url: item.pagePath });
    }
  }
});
