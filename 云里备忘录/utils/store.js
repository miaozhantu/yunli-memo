// 本地存储适配层
// 约定：页面和组件一律不直接调 wx.getStorageSync / wx.setStorageSync，
// 全部走这里。将来做 HTML 版时，只替换本文件的实现即可复用全部业务逻辑。

const PREFIX = 'yl_';

const KEYS = {
  TASKS: 'tasks',           // 日程
  TEMPLATE: 'weekly_tpl',   // 周模板
  NOTES: 'notes',           // 笔记
  LEDGER: 'ledger',         // 账目
  TAGS: 'tags',             // 标签库
  CONFIG: 'config'          // 用户设置
};

const DEFAULTS = {
  [KEYS.TASKS]: [],
  [KEYS.TEMPLATE]: [],
  [KEYS.NOTES]: [],
  [KEYS.LEDGER]: [],
  [KEYS.TAGS]: [],
  [KEYS.CONFIG]: {
    moodCopy: true,       // 情绪文案开关
    autoTranslate: false, // 记事本默认开启翻译
    slotMinutes: 60       // 日程时间轴粒度：15 / 30 / 60
  }
};

function realKey(key) {
  return PREFIX + key;
}

function get(key, fallback) {
  let value;
  try {
    value = wx.getStorageSync(realKey(key));
  } catch (e) {
    value = '';
  }
  if (value === '' || value === undefined || value === null) {
    if (fallback !== undefined) return fallback;
    return DEFAULTS[key] !== undefined ? clone(DEFAULTS[key]) : null;
  }
  return value;
}

function set(key, value) {
  try {
    wx.setStorageSync(realKey(key), value);
    return true;
  } catch (e) {
    return false;
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(realKey(key));
    return true;
  } catch (e) {
    return false;
  }
}

// 读出来改一点再写回去，省掉每个调用点重复的 get/set
function update(key, updater, fallback) {
  const current = get(key, fallback);
  const next = updater(clone(current));
  set(key, next);
  return next;
}

function getList(key) {
  const value = get(key, []);
  return Array.isArray(value) ? value : [];
}

function config() {
  return Object.assign({}, DEFAULTS[KEYS.CONFIG], get(KEYS.CONFIG, {}));
}

function clone(value) {
  if (value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  KEYS,
  get,
  set,
  remove,
  update,
  getList,
  config,
  clone
};
