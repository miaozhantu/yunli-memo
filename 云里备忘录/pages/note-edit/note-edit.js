// 记事本 · 编辑页
// 横线稿纸 + 本地录音（不上传）+ 模拟翻译气泡。
// 录音只拿到临时路径，存进本地存储；清缓存或换机就没了，设置页里已经写明。

const store = require('../../utils/store.js');
const tagLib = require('../../utils/tags.js');
const feedback = require('../../utils/feedback.js');
const copy = require('../../utils/copywriting.js');
const dateUtil = require('../../utils/date.js');
const translator = require('../../utils/translate.js');

Page({
  data: {
    theme: 'paper',
    id: '',
    title: '',
    content: '',
    tagId: '',
    tags: [],
    audioPath: '',
    audioDuration: 0,
    recording: false,
    elapsed: 0,
    playing: false,
    translateOn: false,
    translated: '',
    confirmingDelete: false,
    isNew: true
  },

  onLoad(options) {
    this.setData({ theme: getApp().globalData.theme });
    const tags = tagLib.list('note');
    const id = options && options.id;

    if (id) {
      const note = store.getList(store.KEYS.NOTES).filter(function (n) {
        return n.id === id;
      })[0];

      if (note) {
        this.setData({
          id: note.id,
          title: note.title || '',
          content: note.content || '',
          tagId: note.tagId || (tags[0] && tags[0].id) || '',
          audioPath: note.audioLocalPath || '',
          audioDuration: note.audioDuration || 0,
          tags: tags,
          isNew: false
        });
        this.refreshTranslation();
      }
    } else {
      this.setData({
        tags: tags,
        tagId: (tags[0] && tags[0].id) || '',
        isNew: true
      });
    }

    this.initRecorder();
  },

  onUnload() {
    this.stopTimer();
    if (this.audio) {
      this.audio.destroy();
      this.audio = null;
    }
    if (this.recorder) {
      if (this.data.recording) this.recorder.stop();
      // 录音管理器是全局单例，不解绑会把旧页面的回调留着
      if (this.onRecStop) this.recorder.offStop(this.onRecStop);
      if (this.onRecError) this.recorder.offError(this.onRecError);
    }
  },

  /* ---------- 录音 ---------- */

  initRecorder() {
    const rm = wx.getRecorderManager();
    this.recorder = rm;

    this.onRecStop = (res) => {
      this.stopTimer();
      const seconds = Math.round((res.duration || 0) / 1000);
      this.setData({
        recording: false,
        audioPath: res.tempFilePath,
        audioDuration: seconds,
        elapsed: 0
      });
      feedback.show(copy.pick('record'));
    };

    this.onRecError = () => {
      this.stopTimer();
      this.setData({ recording: false, elapsed: 0 });
      feedback.show('没录上，检查一下麦克风权限');
    };

    rm.onStop(this.onRecStop);
    rm.onError(this.onRecError);
  },

  toggleRecord() {
    if (this.data.recording) {
      this.recorder.stop();
      return;
    }

    this.recorder.start({
      duration: 600000,
      format: 'mp3',
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000
    });

    this.setData({ recording: true, elapsed: 0, playing: false });
    this.stopTimer();
    this.timer = setInterval(() => {
      this.setData({ elapsed: this.data.elapsed + 1 });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  playAudio() {
    if (!this.data.audioPath) {
      feedback.show('这条录音已经不在手机里了');
      return;
    }

    if (this.data.playing && this.audio) {
      this.audio.stop();
      this.setData({ playing: false });
      return;
    }

    if (!this.audio) {
      this.audio = wx.createInnerAudioContext();
      this.audio.onEnded(() => this.setData({ playing: false }));
      this.audio.onError(() => {
        this.setData({ playing: false });
        feedback.show('放不出来，临时文件可能被系统清了');
      });
    }

    this.audio.src = this.data.audioPath;
    this.audio.play();
    this.setData({ playing: true });
  },

  removeAudio() {
    if (this.audio) {
      this.audio.stop();
    }
    this.setData({ audioPath: '', audioDuration: 0, playing: false });
    feedback.show('录音删掉了，正文还在');
  },

  /* ---------- 文本与翻译 ---------- */

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
    if (this.data.translateOn) {
      clearTimeout(this.timer2);
      this.timer2 = setTimeout(() => this.refreshTranslation(), 400);
    }
  },

  onTagTap(e) {
    this.setData({ tagId: e.currentTarget.dataset.id });
    if (this.data.translateOn) this.refreshTranslation();
  },

  onTranslateChange(e) {
    this.setData({ translateOn: e.detail.value });
    this.refreshTranslation();
  },

  refreshTranslation() {
    if (!this.data.translateOn) {
      this.setData({ translated: '' });
      return;
    }
    this.setData({
      translated: translator.translate(this.data.content, this.data.tagId)
    });
  },

  /* ---------- 保存与删除 ---------- */

  onSave() {
    if (this.saving) return;

    const title = (this.data.title || '').trim();
    const content = (this.data.content || '').trim();

    if (!title && !content) {
      feedback.show('还没写字呢');
      return;
    }

    this.saving = true;

    const now = dateUtil.dayKey() + ' ' + dateUtil.clock();
    const list = store.getList(store.KEYS.NOTES);
    const record = {
      title: title || content.slice(0, 12),
      content: content,
      tagId: this.data.tagId,
      audioLocalPath: this.data.audioPath,
      audioDuration: this.data.audioDuration,
      updateTime: now
    };

    if (this.data.id) {
      const index = list.findIndex((n) => n.id === this.data.id);
      if (index >= 0) list[index] = Object.assign({}, list[index], record);
    } else {
      record.id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      record.createTime = now;
      list.unshift(record);
    }

    store.set(store.KEYS.NOTES, list);
    feedback.show(copy.pick('saveNote'));

    // 让提示写完再退，否则一返回这句话就没了
    setTimeout(() => {
      this.saving = false;
      wx.navigateBack();
    }, 1400);
  },

  onDelete() {
    if (!this.data.id) return;
    if (!this.data.confirmingDelete) {
      this.setData({ confirmingDelete: true });
      return;
    }

    const list = store.getList(store.KEYS.NOTES).filter((n) => n.id !== this.data.id);
    store.set(store.KEYS.NOTES, list);
    feedback.show('撕掉这一页了');
    setTimeout(() => wx.navigateBack(), 600);
  }
});
