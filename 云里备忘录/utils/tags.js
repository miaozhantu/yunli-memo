// 标签库
// 日程 / 记事 / 记账 共用一套结构，用 scope 区分。
// 每次读取都与内置默认值做一次合并（按 id 补齐），所以后续加默认标签不用写迁移。

const store = require('./store.js');

const DEFAULT_TAGS = [
  // 日程
  { id: 's_work', name: '工作', colorHex: '#7A8FA6', scope: 'schedule' },
  { id: 's_study', name: '学习', colorHex: '#5F7A5E', scope: 'schedule' },
  { id: 's_life', name: '生活', colorHex: '#B5793F', scope: 'schedule' },
  { id: 's_sport', name: '运动', colorHex: '#C0553F', scope: 'schedule' },
  // 记事
  { id: 'n_work', name: '工作', colorHex: '#7A8FA6', scope: 'note' },
  { id: 'n_idea', name: '灵感', colorHex: '#B5793F', scope: 'note' },
  { id: 'n_study', name: '学习', colorHex: '#5F7A5E', scope: 'note' },
  { id: 'n_life', name: '生活', colorHex: '#C0553F', scope: 'note' },
  // 记账：颜色按大众直觉配，餐饮橙、购物玫红、交通天蓝
  { id: 'l_food', name: '餐饮', colorHex: '#D97742', scope: 'ledger' },
  { id: 'l_shop', name: '购物', colorHex: '#C0506A', scope: 'ledger' },
  { id: 'l_traffic', name: '交通', colorHex: '#5B93C7', scope: 'ledger' },
  { id: 'l_social', name: '社交', colorHex: '#C0553F', scope: 'ledger' },
  { id: 'l_home', name: '住房', colorHex: '#A98763', scope: 'ledger' },
  { id: 'l_fun', name: '娱乐', colorHex: '#7C6BA6', scope: 'ledger' },
  { id: 'l_study', name: '学习', colorHex: '#5F7A5E', scope: 'ledger' },
  { id: 'l_other', name: '其他', colorHex: '#8C8C8C', scope: 'ledger' }
];

function all() {
  let tags = store.getList(store.KEYS.TAGS);
  let changed = false;

  DEFAULT_TAGS.forEach(function (def) {
    const exists = tags.some(function (t) {
      return t.id === def.id;
    });
    if (!exists) {
      tags.push(def);
      changed = true;
    }
  });

  if (changed) store.set(store.KEYS.TAGS, tags);
  return tags;
}

function list(scope) {
  return all().filter(function (t) {
    return !scope || t.scope === scope;
  });
}

function byId(id) {
  const found = all().filter(function (t) {
    return t.id === id;
  });
  return found.length ? found[0] : null;
}

function color(id, fallback) {
  const tag = byId(id);
  return tag ? tag.colorHex : fallback || '#B5793F';
}

function nameOf(id, fallback) {
  const tag = byId(id);
  return tag ? tag.name : fallback || '未分类';
}

function add(name, colorHex, scope) {
  const tags = all();
  const tag = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: name,
    colorHex: colorHex,
    scope: scope || 'schedule'
  };
  tags.push(tag);
  store.set(store.KEYS.TAGS, tags);
  return tag;
}

module.exports = { DEFAULT_TAGS, all, list, byId, color, nameOf, add };
