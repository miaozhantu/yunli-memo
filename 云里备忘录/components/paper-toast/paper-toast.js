// 底部轻提示
// 1.5 秒后自动淡出，没有任何按钮。页面里挂一个 id="paper-toast" 的实例，
// 然后统一用 utils/feedback.js 的 show() 调用。

const DURATION = 1500;
const LEAVE = 220;

Component({
  options: {
    addGlobalClass: true
  },

  data: {
    visible: false,
    leaving: false,
    text: ''
  },

  lifetimes: {
    detached() {
      this.clearTimers();
    }
  },

  methods: {
    show(text) {
      if (!text) return;
      this.clearTimers();
      this.setData({ visible: true, leaving: false, text: text });

      this.holdTimer = setTimeout(() => {
        this.setData({ leaving: true });
        this.leaveTimer = setTimeout(() => {
          this.setData({ visible: false, leaving: false, text: '' });
        }, LEAVE);
      }, DURATION);
    },

    clearTimers() {
      if (this.holdTimer) clearTimeout(this.holdTimer);
      if (this.leaveTimer) clearTimeout(this.leaveTimer);
      this.holdTimer = null;
      this.leaveTimer = null;
    }
  }
});
