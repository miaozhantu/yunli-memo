// 主题皮肤
// 三套配色，只换 CSS 变量，不改结构。页面根节点挂 .root.theme-x 即可生效。

const store = require('./store.js');

const THEMES = [
  {
    id: 'paper',
    name: '米黄纸',
    desc: '默认配色，暖一点的纸，白天看着不刺眼',
    swatch: ['#f9f6f0', '#c0553f', '#3b342a']
  },
  {
    id: 'bubble',
    name: '奶茶碎花',
    desc: '奶茶色纸底，撒一层很淡的小碎花，不闹',
    swatch: ['#faf1e7', '#c0705a', '#4a3f35']
  },
  {
    id: 'onyx',
    name: '机械黑金',
    desc: '近黑的底子压一层细斜纹，金色只用在关键处',
    swatch: ['#14120f', '#c9a227', '#efe6d2']
  },
  {
    id: 'kraft',
    name: '牛皮纸',
    desc: '像一本用了很久的本子，颜色沉，边角更旧',
    swatch: ['#efe3ce', '#a9503a', '#4a3a28']
  },
  {
    id: 'night',
    name: '夜读',
    desc: '关灯之后用，纸变成深色，字还是暖的',
    swatch: ['#1f1c19', '#c97b62', '#e8e1d4']
  }
];

function list() {
  return THEMES;
}

function current() {
  const id = store.config().theme || 'paper';
  const found = THEMES.filter(function (t) {
    return t.id === id;
  });
  return found.length ? id : 'paper';
}

function meta(id) {
  const key = id || current();
  const found = THEMES.filter(function (t) {
    return t.id === key;
  });
  return found.length ? found[0] : THEMES[0];
}

function apply(id) {
  store.set(store.KEYS.CONFIG, Object.assign({}, store.config(), { theme: id }));
  const app = getApp();
  if (app && app.globalData) app.globalData.theme = id;
}

module.exports = { THEMES, list, current, meta, apply };
