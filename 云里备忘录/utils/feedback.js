// 底部轻提示
// 项目里禁止用带按钮的模态弹窗做操作反馈，一切反馈都走这里。
// 实现方式：找到当前页面上的 paper-toast 组件，交给它播一段 1.5 秒的浮层。

function currentToast() {
  const pages = getCurrentPages();
  if (!pages.length) return null;
  const page = pages[pages.length - 1];
  if (!page || typeof page.selectComponent !== 'function') return null;
  return page.selectComponent('#paper-toast');
}

function show(text) {
  if (!text) return;
  const toast = currentToast();
  if (toast) {
    toast.show(text);
    return;
  }
  // 兜底：页面上还没挂组件时不至于静默失败
  wx.showToast({ title: text, icon: 'none', duration: 1500 });
}

module.exports = { show };
