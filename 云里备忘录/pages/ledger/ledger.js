// 记账
// 看板 + 输入 + 明细 + Canvas 月报。明细严格按「发生时间」倒序，不按录入时间。

const store = require('../../utils/store.js');
const tagLib = require('../../utils/tags.js');
const feedback = require('../../utils/feedback.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');

const COLORS = ['#D97742', '#C0506A', '#5B93C7', '#C0553F', '#A98763', '#7C6BA6', '#5F7A5E', '#8C8C8C'];

function money(value) {
  const n = Number(value) || 0;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// 金额只认数字和一个小数点，小数最多两位。
// type="digit" 只能保证键盘是数字的，外部键盘、粘贴、部分输入法仍能塞进字母，这里统一挡掉。
function cleanAmount(raw) {
  let s = String(raw == null ? '' : raw).replace(/[^\d.]/g, '');
  const first = s.indexOf('.');
  if (first >= 0) {
    s = s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, '');
    const seg = s.split('.');
    if (seg[1] && seg[1].length > 2) s = seg[0] + '.' + seg[1].slice(0, 2);
  }
  if (s.indexOf('.') < 0 && s.length > 9) s = s.slice(0, 9);
  return s;
}

function sumOf(list, month, type) {
  return list.reduce(function (sum, item) {
    const inMonth = String(item.occurTime || '').slice(0, 7) === month;
    const sameType = (item.type || 'expense') === type;
    return inMonth && sameType ? sum + (Number(item.amount) || 0) : sum;
  }, 0);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let top = y;
  for (let i = 0; i < text.length; i += 1) {
    const test = line + text[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, top);
      line = text[i];
      top += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, top);
  return top;
}

Page({
  data: {
    theme: 'paper',
    month: '',
    monthLabel: '',
    expenseText: '0',
    incomeText: '0',
    tags: [],
    colors: COLORS,
    form: {
      amount: '',
      type: 'expense',
      tagId: '',
      remark: '',
      date: '',
      time: ''
    },
    timeSheet: { visible: false, date: '', time: '' },
    timeTarget: 'form',
    editing: {
      visible: false,
      id: '',
      amount: '',
      type: 'expense',
      tagId: '',
      remark: '',
      date: '',
      time: '',
      confirmDelete: false
    },
    maxDate: '',
    timeText: '',
    tagSheet: { visible: false, name: '', color: COLORS[0] },
    keyword: '',
    groups: [],
    totalCount: 0,
    compare: null,
    reportVisible: false,
    reportPath: '',
    reportH: 1200
  },

  onLoad() {
    const now = new Date();
    const tags = tagLib.list('ledger');
    const date = dateUtil.dayKey(now);
    const time = dateUtil.clock(now);

    this.setData({
      month: date.slice(0, 7),
      maxDate: date,
      tags: tags,
      'form.tagId': (tags[0] && tags[0].id) || '',
      'form.date': date,
      'form.time': time,
      timeText: date + ' ' + time
    });
    this.load();
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    this.load();
  },

  load() {
    const tags = tagLib.list('ledger');
    const items = store.getList(store.KEYS.LEDGER);
    const month = this.data.month;
    const keyword = (this.data.keyword || '').trim();

    const tagMap = {};
    tags.forEach(function (t) {
      tagMap[t.id] = t;
    });

    const expense = sumOf(items, month, 'expense');
    const income = sumOf(items, month, 'income');

    // 没搜索时只看本月；一开始搜就跨月找，不然老账翻不出来
    const scoped = items.filter(function (item) {
      if (keyword) return true;
      return String(item.occurTime || '').slice(0, 7) === month;
    });

    const matched = scoped.filter(function (item) {
      if (!keyword) return true;
      const tag = tagMap[item.tagId];
      const haystack = [String(item.amount || ''), item.remark || '', tag ? tag.name : ''].join(' ');
      return haystack.indexOf(keyword) >= 0;
    });

    matched.sort(function (a, b) {
      return String(b.occurTime || '').localeCompare(String(a.occurTime || ''));
    });

    const groups = [];
    let current = null;

    matched.forEach((item) => {
      const day = String(item.occurTime || '').slice(0, 10);
      if (!current || current.day !== day) {
        current = { day: day, label: this.dayLabel(day), items: [] };
        groups.push(current);
      }
      const tag = tagMap[item.tagId];
      current.items.push({
        id: item.id,
        amountText: (item.type === 'income' ? '+' : '-') + money(item.amount),
        isIncome: item.type === 'income',
        tagName: tag ? tag.name : '未分类',
        color: tag ? tag.colorHex : '#8C8C8C',
        remark: item.remark || '',
        timeText: String(item.occurTime || '').slice(11, 16)
      });
    });

    const m = Number(month.split('-')[1]);

    this.setData({
      tags: tags,
      expenseText: money(expense),
      incomeText: money(income),
      monthLabel: month.slice(0, 4) + ' 年 ' + m + ' 月',
      groups: groups,
      totalCount: matched.length,
      compare: this.buildCompare(items, month, expense)
    });
  },

  // 和上个月比一比。只跟「支出」比，收入波动大，比了容易误导
  buildCompare(items, month, expense) {
    const parts = month.split('-').map(Number);
    const prevDate = new Date(parts[0], parts[1] - 2, 1);
    const prevMonth = dateUtil.dayKey(prevDate).slice(0, 7);
    const prev = sumOf(items, prevMonth, 'expense');

    if (!expense) return null;
    if (!prev) {
      return { none: true, diffText: '', text: copy.pick('cmpNone') };
    }

    const diff = expense - prev;
    const pct = diff / prev;
    const abs = money(Math.abs(diff));

    let level = 'cmpFlat';
    if (pct >= 0.3) level = 'cmpUpBig';
    else if (pct > 0.05) level = 'cmpUp';
    else if (pct <= -0.3) level = 'cmpDownBig';
    else if (pct < -0.05) level = 'cmpDown';

    return {
      none: false,
      up: diff > 0,
      diffText: (diff > 0 ? '+¥' : '−¥') + abs,
      text: copy.pick(level).replace('{x}', abs)
    };
  },

  dayLabel(day) {
    if (!day) return '';
    const today = dateUtil.dayKey();
    if (day === today) return '今天 · ' + day.slice(5).replace('-', ' / ');
    return day.slice(5).replace('-', ' / ');
  },

  switchMonth(e) {
    const delta = Number(e.currentTarget.dataset.delta);
    const parts = this.data.month.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1 + delta, 1);
    this.setData({ month: dateUtil.dayKey(d).slice(0, 7) }, () => this.load());
  },

  /* ---------- 输入区 ---------- */

  onAmount(e) {
    this.setData({ 'form.amount': cleanAmount(e.detail.value) });
  },

  onRemark(e) {
    this.setData({ 'form.remark': e.detail.value });
  },

  onType(e) {
    this.setData({ 'form.type': e.currentTarget.dataset.type });
  },

  onTag(e) {
    this.setData({ 'form.tagId': e.currentTarget.dataset.id });
  },

  openTimeSheet(e) {
    const target = (e && e.currentTarget.dataset.target) || 'form';
    const base = target === 'edit' ? this.data.editing : this.data.form;
    this.setData({
      timeTarget: target,
      timeSheet: { visible: true, date: base.date, time: base.time }
    });
  },

  closeTimeSheet() {
    this.setData({ 'timeSheet.visible': false });
  },

  onPickDate(e) {
    this.setData({ 'timeSheet.date': e.detail.value });
  },

  onPickTime(e) {
    this.setData({ 'timeSheet.time': e.detail.value });
  },

  quickDay(e) {
    const offset = Number(e.currentTarget.dataset.offset);
    const d = new Date();
    d.setDate(d.getDate() - offset);
    this.setData({ 'timeSheet.date': dateUtil.dayKey(d) });
  },

  confirmTime() {
    const s = this.data.timeSheet;
    if (this.data.timeTarget === 'edit') {
      this.setData({
        'editing.date': s.date,
        'editing.time': s.time,
        'timeSheet.visible': false
      });
      return;
    }
    this.setData({
      'form.date': s.date,
      'form.time': s.time,
      'timeSheet.visible': false
    });
  },

  /* ---------- 自定义标签 ---------- */

  openTagSheet() {
    this.setData({ tagSheet: { visible: true, name: '', color: COLORS[0] } });
  },

  closeTagSheet() {
    this.setData({ 'tagSheet.visible': false });
  },

  onTagName(e) {
    this.setData({ 'tagSheet.name': e.detail.value });
  },

  onTagColor(e) {
    this.setData({ 'tagSheet.color': e.currentTarget.dataset.color });
  },

  saveTag() {
    const name = (this.data.tagSheet.name || '').trim();
    if (!name) {
      feedback.show('新标签还没起名字');
      return;
    }
    const tag = tagLib.add(name, this.data.tagSheet.color, 'ledger');
    this.setData({ 'tagSheet.visible': false, 'form.tagId': tag.id });
    this.load();
    feedback.show('新标签收进盒子了');
  },

  /* ---------- 记账 ---------- */

  addItem() {
    const form = this.data.form;
    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      feedback.show('金额还没填');
      return;
    }

    const list = store.getList(store.KEYS.LEDGER);
    const occurTime = form.date + ' ' + form.time;

    list.push({
      id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      amount: amount,
      type: form.type,
      tagId: form.tagId,
      remark: (form.remark || '').trim(),
      occurTime: occurTime
    });
    store.set(store.KEYS.LEDGER, list);

    const now = new Date();
    this.setData({
      // 补记到别的月份时，把看板切过去，否则刚记的这条看不到
      month: occurTime.slice(0, 7),
      'form.amount': '',
      'form.remark': '',
      'form.date': dateUtil.dayKey(now),
      'form.time': dateUtil.clock(now)
    });
    this.load();
    feedback.show(copy.pick(form.type === 'income' ? 'income' : 'spend'));
  },

  /* ---------- 明细的修改 ---------- */

  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    const item = store.getList(store.KEYS.LEDGER).filter(function (x) {
      return x.id === id;
    })[0];
    if (!item) return;

    const time = String(item.occurTime || '');
    this.setData({
      editing: {
        visible: true,
        id: item.id,
        amount: String(item.amount),
        type: item.type || 'expense',
        tagId: item.tagId || '',
        remark: item.remark || '',
        date: time.slice(0, 10),
        time: time.slice(11, 16) || '00:00',
        confirmDelete: false
      }
    });
  },

  closeEdit() {
    this.setData({ 'editing.visible': false, 'editing.confirmDelete': false });
  },

  onEditAmount(e) {
    this.setData({ 'editing.amount': cleanAmount(e.detail.value) });
  },

  onEditRemark(e) {
    this.setData({ 'editing.remark': e.detail.value });
  },

  onEditType(e) {
    this.setData({ 'editing.type': e.currentTarget.dataset.type });
  },

  onEditTag(e) {
    this.setData({ 'editing.tagId': e.currentTarget.dataset.id });
  },

  saveEdit() {
    const ed = this.data.editing;
    const amount = Number(ed.amount);
    if (!amount || amount <= 0) {
      feedback.show('金额还得是一个正数');
      return;
    }

    const list = store.getList(store.KEYS.LEDGER);
    const index = list.findIndex(function (x) {
      return x.id === ed.id;
    });
    if (index < 0) {
      this.closeEdit();
      return;
    }

    list[index] = Object.assign({}, list[index], {
      amount: amount,
      type: ed.type,
      tagId: ed.tagId,
      remark: (ed.remark || '').trim(),
      occurTime: ed.date + ' ' + ed.time
    });
    store.set(store.KEYS.LEDGER, list);

    this.closeEdit();
    this.load();
    feedback.show('改好了');
  },

  deleteItem() {
    const ed = this.data.editing;
    if (!ed.confirmDelete) {
      this.setData({ 'editing.confirmDelete': true });
      return;
    }

    const list = store.getList(store.KEYS.LEDGER).filter(function (x) {
      return x.id !== ed.id;
    });
    store.set(store.KEYS.LEDGER, list);
    this.closeEdit();
    this.load();
    feedback.show('这条账划掉了');
  },

  /* ---------- 搜索 ---------- */

  // 每敲一个字都重建整张列表，数据多了会卡，压到 200ms 再算
  onSearch(e) {
    const value = e.detail.value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({ keyword: value }, () => this.load());
    }, 200);
  },

  clearSearch() {
    clearTimeout(this.searchTimer);
    this.setData({ keyword: '' }, () => this.load());
  },

  /* ---------- 月报 ---------- */

  reportData() {
    const items = store.getList(store.KEYS.LEDGER);
    const month = this.data.month;
    const tags = tagLib.list('ledger');
    const tagMap = {};
    tags.forEach(function (t) {
      tagMap[t.id] = t;
    });

    const byTag = {};
    let expense = 0;
    let income = 0;

    items.forEach(function (item) {
      if (String(item.occurTime || '').slice(0, 7) !== month) return;
      const amount = Number(item.amount) || 0;
      if (item.type === 'income') {
        income += amount;
        return;
      }
      expense += amount;
      const key = item.tagId || 'none';
      byTag[key] = (byTag[key] || 0) + amount;
    });

    const rows = Object.keys(byTag)
      .map(function (key) {
        const tag = tagMap[key];
        return {
          name: tag ? tag.name : '未分类',
          color: tag ? tag.colorHex : '#8C8C8C',
          amount: byTag[key]
        };
      })
      .sort(function (a, b) {
        return b.amount - a.amount;
      })
      .slice(0, 6);

    return { expense: expense, income: income, rows: rows };
  },

  makeReport() {
    const data = this.reportData();
    if (!data.rows.length) {
      feedback.show('这个月还没记账，报表也没东西可画');
      return;
    }

    const height = 800 + data.rows.length * 104 + 170;
    this.setData({ reportH: height }, () => {
      this.drawReport(data, height);
    });
  },

  drawReport(data, height) {
    wx.createSelectorQuery()
      .in(this)
      .select('#report-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          feedback.show('画布没准备好，再点一次');
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        let dpr = 2;
        try {
          const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
          dpr = info.pixelRatio || 2;
        } catch (e) {
          dpr = 2;
        }

        const W = 750;
        canvas.width = W * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#F9F6F0';
        ctx.fillRect(0, 0, W, height);

        ctx.fillStyle = '#A2947E';
        ctx.font = '22px sans-serif';
        ctx.fillText('云里备忘录 · 月度小报', 48, 76);

        ctx.fillStyle = '#3B342A';
        ctx.font = 'bold 46px sans-serif';
        ctx.fillText(this.data.monthLabel, 48, 148);

        ctx.fillStyle = '#A2947E';
        ctx.font = '22px sans-serif';
        ctx.fillText('这个月的账，一笔一笔都在这里', 48, 192);

        ctx.strokeStyle = '#DDD0B2';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(48, 226);
        ctx.lineTo(702, 226);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#A2947E';
        ctx.font = '24px sans-serif';
        ctx.fillText('总支出', 48, 292);

        ctx.fillStyle = '#C0553F';
        ctx.font = 'bold 76px sans-serif';
        ctx.fillText('¥ ' + money(data.expense), 48, 372);

        ctx.fillStyle = '#6F6558';
        ctx.font = '24px sans-serif';
        ctx.fillText('总收入  ¥ ' + money(data.income), 48, 414);

        const top = data.rows[0];
        roundRect(ctx, 40, 452, 670, 132, 24);
        ctx.fillStyle = '#FFFDF8';
        ctx.fill();
        ctx.strokeStyle = '#E6DDCB';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = top.color;
        ctx.beginPath();
        ctx.arc(78, 518, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#A2947E';
        ctx.font = '22px sans-serif';
        ctx.fillText('花得最多', 104, 500);

        ctx.fillStyle = '#3B342A';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(top.name, 104, 548);

        ctx.fillStyle = '#3B342A';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('¥ ' + money(top.amount), 674, 538);
        ctx.textAlign = 'left';

        roundRect(ctx, 40, 612, 670, 132, 24);
        ctx.fillStyle = '#FDF7EC';
        ctx.fill();

        ctx.fillStyle = '#8C7A5E';
        ctx.font = '20px sans-serif';
        ctx.fillText('本 月 一 句', 68, 652);

        ctx.fillStyle = '#6F5140';
        ctx.font = '26px sans-serif';
        wrapText(ctx, copy.monthly(top.name), 68, 694, 610, 38);

        ctx.fillStyle = '#3B342A';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('分类排行', 48, 800);

        const max = data.rows[0].amount || 1;
        const rows = data.rows;

        for (let i = 0; i < rows.length; i += 1) {
          const row = rows[i];
          const y = 848 + i * 104;

          ctx.fillStyle = row.color;
          ctx.beginPath();
          ctx.arc(60, y + 8, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#3B342A';
          ctx.font = '26px sans-serif';
          ctx.fillText(row.name, 84, y + 17);

          ctx.fillStyle = '#6F6558';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('¥ ' + money(row.amount), 702, y + 17);
          ctx.textAlign = 'left';

          roundRect(ctx, 48, y + 34, 654, 12, 6);
          ctx.fillStyle = '#EDE4D2';
          ctx.fill();

          const w = Math.max(12, Math.round((row.amount / max) * 654));
          roundRect(ctx, 48, y + 34, w, 12, 6);
          ctx.fillStyle = row.color;
          ctx.fill();
        }

        ctx.strokeStyle = '#DDD0B2';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(48, height - 104);
        ctx.lineTo(702, height - 104);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#A2947E';
        ctx.font = '22px sans-serif';
        ctx.fillText('记于 ' + dateUtil.dayKey().replace(/-/g, '.') + '　云里备忘录', 48, height - 58);

        wx.canvasToTempFilePath(
          {
            canvas: canvas,
            x: 0,
            y: 0,
            width: W,
            height: height,
            destWidth: W * 2,
            destHeight: height * 2,
            success: (r) => {
              this.setData({ reportPath: r.tempFilePath, reportVisible: true });
            },
            fail: () => {
              feedback.show('长图没画出来，再点一次');
            }
          },
          this
        );
      });
  },

  closeReport() {
    this.setData({ reportVisible: false });
  },

  noop() {}
});
