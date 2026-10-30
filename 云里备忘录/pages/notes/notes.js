// 记事本 · 列表
// 按创建时间倒序，标签一键筛选，右上角新建。

const store = require('../../utils/store.js');
const tagLib = require('../../utils/tags.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');

Page({
  data: {
    theme: 'paper',
    tags: [],
    activeTag: 'all',
    keyword: '',
    list: [],
    total: 0,
    emptyText: ''
  },

  onShow() {
    this.setData({ theme: getApp().globalData.theme });
    this.load();
  },

  load() {
    const notes = store
      .getList(store.KEYS.NOTES)
      .slice()
      .sort(function (a, b) {
        return String(b.createTime || '').localeCompare(String(a.createTime || ''));
      });

    this.setData({ tags: tagLib.list('note'), total: notes.length, notes: notes });
    this.filter();
  },

  filter() {
    const active = this.data.activeTag;
    const kw = (this.data.keyword || '').trim().toLowerCase();
    const notes = this.data.notes || [];

    const list = notes
      .filter(function (n) {
        if (active !== 'all' && n.tagId !== active) return false;
        if (!kw) return true;
        const haystack = String(n.title || '') + ' ' + String(n.content || '');
        return haystack.toLowerCase().indexOf(kw) >= 0;
      })
      .map(function (n) {
        const text = String(n.content || '').replace(/\s+/g, ' ').trim();
        return {
          id: n.id,
          title: n.title || '无标题',
          excerpt: text ? text.slice(0, 56) : '这一页只有标题',
          dateText: String(n.createTime || '').slice(5, 10).replace('-', ' / '),
          tagName: tagLib.nameOf(n.tagId, '未分类'),
          color: tagLib.color(n.tagId, '#B5793F'),
          hasAudio: !!n.audioLocalPath
        };
      });

    let emptyText = copy.pick('empty');
    if (kw) emptyText = '没搜到「' + this.data.keyword + '」';
    else if (active !== 'all') emptyText = '这个标签下还没有东西';

    this.setData({ list: list, emptyText: emptyText });
  },

  onSearch(e) {
    const value = e.detail.value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({ keyword: value }, () => this.filter());
    }, 200);
  },

  clearSearch() {
    clearTimeout(this.searchTimer);
    this.setData({ keyword: '' }, () => this.filter());
  },

  onTagTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeTag) return;
    this.setData({ activeTag: id }, () => this.filter());
  },

  newNote() {
    wx.navigateTo({ url: '/pages/note-edit/note-edit' });
  },

  openNote(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/note-edit/note-edit?id=' + id });
  }
});
