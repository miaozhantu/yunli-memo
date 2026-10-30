// 首页剪报内容库
// 全部本地写死，不接任何外部内容源。按「工作日 / 周末 × 四个时段」分八组，
// 每组 12–13 条，合计 101 条。
// 取用走「洗牌袋」：整组打乱后一张张抽，抽空才重洗；重洗时把上一批出现过的排掉，
// 所以「换一批」不会连着蹦同一条。

const store = require('./store.js');

const BAG_KEY = 'slideBag';

const GROUPS = {
  /* ---------- 工作日 ---------- */
  workMorning: [
    { tag: '早八', title: '闹钟响了七次，你终于战胜了床', desc: '能坐起来，今天就已经赢了一半', keyword: '早起 早八人 起床困难' },
    { tag: '身体', title: '起床先喝一杯水', desc: '不是为了养生，是为了真的醒过来', keyword: '起床 喝水 清醒' },
    { tag: '出门', title: '出门前看一眼天气', desc: '淋一次雨，抵得上十次预报', keyword: '天气预报 带伞' },
    { tag: '吃饭', title: '食堂的豆浆两块五', desc: '比咖啡管用，还便宜', keyword: '食堂 豆浆 早餐' },
    { tag: '十分钟', title: '地铁上闭眼十分钟', desc: '比刷短视频解乏，还不费流量', keyword: '通勤 地铁 闭目养神' },
    { tag: '效率', title: '最难的那件事放在十点前', desc: '上午的脑子最好用，别拿去回消息', keyword: '深度工作 上午 效率' },
    { tag: '邮箱', title: '三十封里真要回的，不超过五封', desc: '剩下的看一眼就能删', keyword: '邮件 批量处理 效率' },
    { tag: '专注', title: '25 分钟不看手机', desc: '做得到，今天就算赢了', keyword: '番茄工作法 专注 手机' },
    { tag: '收拾', title: '包里那张昨天的纸，今天该扔了', desc: '包轻一点，人会轻一点', keyword: '收纳 断舍离 背包' },
    { tag: '校园', title: '电梯里全是同款表情', desc: '大家都很默契，谁也不说话', keyword: '早高峰 电梯 大学' },
    { tag: '出门', title: '晚出门五分钟就该跑了', desc: '跑起来那一段，比闹钟提神', keyword: '迟到 跑步 通勤' },
    { tag: '十分钟', title: '课间去窗边站两分钟', desc: '不用做什么，看远处就行', keyword: '课间 休息 眼睛' }
  ],

  workNoon: [
    { tag: '吃饭', title: '十一点半去食堂，不用排队', desc: '错峰二十分钟，省下站着等的时间', keyword: '食堂 错峰 排队' },
    { tag: '身体', title: '饭后走十分钟', desc: '比趴着睡更解困', keyword: '饭后散步 午休 犯困' },
    { tag: '睡觉', title: '午睡二十分钟是甜点', desc: '超过半小时会更困', keyword: '午睡 20分钟 睡眠' },
    { tag: '专注', title: '把手机反扣在桌上', desc: '看不见通知，能少摸十次', keyword: '手机 专注 效率' },
    { tag: '一句话', title: '下午的会像连续剧', desc: '一集接一集，没有结局', keyword: '开会 下午 效率' },
    { tag: '十分钟', title: '卡住的时候去接杯水', desc: '灵感常在走廊拐角冒出来', keyword: '卡住 散步 灵感' },
    { tag: '校园', title: '打印店下午三点人最少', desc: '论文前一天别去，队伍能排到门口', keyword: '打印店 论文 排队' },
    { tag: '免费', title: '空教室是最好用的自习室', desc: '没人管，插座多，还能大声背书', keyword: '空教室 自习 插座' },
    { tag: '省钱', title: '这周点了几次外卖', desc: '记账里翻一眼就知道，别靠感觉', keyword: '外卖 记账 省钱' },
    { tag: '校园', title: '坐前三排真的听得进去', desc: '不是自律，是物理距离', keyword: '上课 前排 专注' },
    { tag: '身体', title: '二十分钟看一次远处', desc: '不是为了护眼，是为了不头疼', keyword: '眼睛 疲劳 远眺' },
    { tag: '效率', title: '待办只留三件', desc: '剩下的写进「以后再说」，不用今天扛', keyword: '待办 优先级 效率' },
    { tag: '吃饭', title: '一块饼干配白开水', desc: '也算歇过了，不用非得是下午茶', keyword: '下午茶 休息 简单' }
  ],

  workEvening: [
    { tag: '一句话', title: '今天没做完的事，明天还在原地', desc: '它不会跑，所以可以先吃饭', keyword: '下班 拖延 明天' },
    { tag: '十分钟', title: '到家先坐五分钟', desc: '什么都不干，就坐着', keyword: '回家 放松 缓冲' },
    { tag: '通勤', title: '地铁像罐头，每个人都在刷手机', desc: '你也刷，这不丢人', keyword: '晚高峰 地铁 通勤' },
    { tag: '十分钟', title: '洗完澡把明天的衣服拿出来', desc: '明早会感谢今晚的你', keyword: '睡前准备 第二天 效率' },
    { tag: '校园', title: '操场晚上九点人最少', desc: '想跑又不想被看着，挑这个点', keyword: '夜跑 操场 大学' },
    { tag: '睡眠', title: '睡前刷的一小时最容易忘', desc: '刷完什么都想不起来，这是真的', keyword: '睡前 手机 睡眠' },
    { tag: '身体', title: '热水冲十分钟，一天的账就清了', desc: '洗澡是最便宜的重启', keyword: '洗澡 放松 解压' },
    { tag: '效率', title: '看一眼明天的课表', desc: '知道几点起，今晚才睡得踏实', keyword: '课表 明天 计划' },
    { tag: '收拾', title: '快递顺手取了', desc: '别攒到周末，越攒越不想动', keyword: '快递 顺手 拖延' },
    { tag: '吃饭', title: '打开冰箱看一眼', desc: '明天不用临时想吃什么', keyword: '冰箱 备餐 明天' },
    { tag: '家务', title: '衣服攒三天洗一次', desc: '比天天洗省事，也没人管你', keyword: '洗衣 家务 省事' },
    { tag: '一句话', title: '给家里打个电话', desc: '十分钟，他们能高兴一整天', keyword: '家人 电话 关心' },
    { tag: '睡眠', title: '关灯前把手机放远一点', desc: '伸手够不到的位置，刚刚好', keyword: '睡前 手机 戒手机' }
  ],

  workNight: [
    { tag: '冷知识', title: '凌晨的想法很真诚，也很不靠谱', desc: '记下来，但别立刻发出去', keyword: '深夜 情绪 冲动' },
    { tag: '身体', title: '这个点喝水比喝咖啡强', desc: '咖啡因半衰期五小时，你会后悔', keyword: '熬夜 咖啡因 睡眠' },
    { tag: '十分钟', title: '把明天三件事写下来就睡', desc: '写下来就不用躺在床上想', keyword: '待办 睡前 焦虑' },
    { tag: '一句话', title: '熬夜省下的时间，第二天要还', desc: '而且还带利息', keyword: '熬夜 睡眠债' },
    { tag: '免费', title: '开窗站两分钟', desc: '比刷手机解压，还不用充电', keyword: '深夜 通风 解压' },
    { tag: '吃饭', title: '泡面加个蛋', desc: '成本最低的安慰，别问营养', keyword: '泡面 夜宵 宿舍' },
    { tag: '冷知识', title: '累的时候更容易做错决定', desc: '想不清楚的事，放到早上再想', keyword: '疲惫 决策 睡眠' },
    { tag: '一句话', title: '今天到这儿了', desc: '剩下的明天再说，这句话本身也算完成', keyword: '结束 一天 放松' },
    { tag: '身体', title: '亮度调到最暗', desc: '眼睛会谢谢你，睡意也来得快些', keyword: '手机 亮度 护眼' },
    { tag: '睡眠', title: '睡不着别数羊', desc: '把明天要做的事写下来，比数羊管用', keyword: '失眠 数羊 睡前' },
    { tag: '社交', title: '深夜的群没人真的在等你回', desc: '明早再回，没人会怪你', keyword: '群消息 深夜 社交' },
    { tag: '一句话', title: '关掉屏幕的那一下', desc: '房间安静下来，才算真的下班', keyword: '关机 结束 安静' }
  ],

  /* ---------- 周末 ---------- */
  restMorning: [
    { tag: '睡觉', title: '睡到自然醒', desc: '这是周末唯一不能让步的事', keyword: '周末 睡懒觉 补觉' },
    { tag: '吃饭', title: '十点半吃第一顿，合理', desc: '早餐和午餐合并，省一顿还省事', keyword: '早午餐 周末 brunch' },
    { tag: '家务', title: '洗床单', desc: '晒过太阳的被子，晚上会好睡', keyword: '床单 晒被子 睡眠' },
    { tag: '十分钟', title: '只扫看得见的地方', desc: '别开始大扫除，一开就停不下来', keyword: '打扫 十五分钟 家务' },
    { tag: '免费', title: '城市书房不要钱，还能充电', desc: '比咖啡店安静，也不用先消费', keyword: '城市书房 免费 自习' },
    { tag: '省钱', title: '八点的菜市场比超市新鲜', desc: '也便宜，还能讲价', keyword: '菜市场 早市 省钱' },
    { tag: '省钱', title: '早场电影票便宜一半', desc: '一个人去看也不奇怪', keyword: '电影 早场 省钱' },
    { tag: '身体', title: '在阳台站十分钟', desc: '晒晒太阳，比补维生素 D 便宜', keyword: '晒太阳 阳台 维生素D' },
    { tag: '一句话', title: '周末的消息周一再回也不迟', desc: '手机调静音，天不会塌', keyword: '消息 静音 周末' },
    { tag: '运动', title: '不用配速，跑二十分钟就行', desc: '出门这一步比跑多远重要', keyword: '慢跑 运动 二十分钟' },
    { tag: '吃饭', title: '一周做一次饭', desc: '比点十次外卖有成就感，也便宜', keyword: '做饭 下厨 省钱' },
    { tag: '收拾', title: '翻出一件没穿过的衣服', desc: '就当新买的，省一笔', keyword: '衣柜 断舍离 旧衣' },
    { tag: '一句话', title: '只定一件想做的事', desc: '其余随便，周末不该有 KPI', keyword: '周末计划 放松 安排' }
  ],

  restNoon: [
    { tag: '免费', title: '不用去哪，坐两站再回来', desc: '换个地方待着，也算出门了', keyword: '城市 闲逛 地铁' },
    { tag: '免费', title: '公园长椅带本书', desc: '看不看都行，主要是坐着', keyword: '公园 看书 发呆' },
    { tag: '省钱', title: '二手书店十块钱能淘到一本', desc: '比新书有意思，还有前一个人的批注', keyword: '二手书店 淘书 省钱' },
    { tag: '免费', title: '大部分城市的博物馆免费', desc: '身份证带上，进去吹空调也值', keyword: '博物馆 免费 展览' },
    { tag: '吃饭', title: '一个人吃饭不用迁就谁', desc: '想吃什么点什么，这叫自由', keyword: '一人食 独立 吃饭' },
    { tag: '省钱', title: '点最便宜的一杯，坐两小时', desc: '咖啡馆的位子本来就是用来坐的', keyword: '咖啡馆 自习 省钱' },
    { tag: '收拾', title: '周末下午去剪头发', desc: '人少不用等，剪完心情也换一次', keyword: '理发 周末 换发型' },
    { tag: '一句话', title: '拍一张不发朋友圈的照片', desc: '就为留个档，给以后的自己看', keyword: '拍照 记录 生活' },
    { tag: '睡觉', title: '周末的午睡不算浪费', desc: '补的是这一周欠下的', keyword: '午睡 补觉 周末' },
    { tag: '省钱', title: '逛超市比刷购物软件省钱', desc: '看得见摸得着，不容易冲动', keyword: '超市 购物 冲动消费' },
    { tag: '社交', title: '约一次，别总说下次', desc: '下次这两个字，一年能说八十回', keyword: '朋友 约饭 社交' },
    { tag: '吃饭', title: '照着视频学一道菜', desc: '做砸了也算学会了，反正自己吃', keyword: '学做菜 视频 下厨' },
    { tag: '运动', title: '游泳一次二十块', desc: '比健身房月卡划算，还凉快', keyword: '游泳 运动 便宜' }
  ],

  restEvening: [
    { tag: '免费', title: '末班地铁前的城市比白天好看', desc: '不用去哪，坐两站再回来就够', keyword: '城市 夜景 散步' },
    { tag: '放松', title: '关灯看电影，别看手机', desc: '在家看也算，只要屏幕只有一个', keyword: '电影 家庭影院 专注' },
    { tag: '身体', title: '走四十分钟，回来睡得香', desc: '不用快走，溜达就行', keyword: '散步 睡眠 四十分钟' },
    { tag: '家务', title: '周日晚上洗衣服', desc: '周一早上不慌，还能穿干净的', keyword: '洗衣 周日 周一' },
    { tag: '吃饭', title: '十点以后的店哪家都好进', desc: '深夜食堂的快乐，一半来自不用排队', keyword: '夜宵 聚餐 深夜' },
    { tag: '收拾', title: '周一要带的东西今晚放好', desc: '早上少找十分钟，能多睡十分钟', keyword: '背包 准备 周一' },
    { tag: '一句话', title: '关掉工作群两小时', desc: '天不会塌，消息也不会长腿跑掉', keyword: '工作群 边界 周末' },
    { tag: '十分钟', title: '写两句这周发生了什么', desc: '不写的话，下周就忘了', keyword: '周记 记录 复盘' },
    { tag: '身体', title: '早点洗澡', desc: '洗完就不想动了，正好早睡', keyword: '洗澡 早睡 作息' },
    { tag: '效率', title: '想好明天穿什么', desc: '周一早上能多睡十分钟', keyword: '穿搭 周一 准备' },
    { tag: '收拾', title: '手机、耳机、充电宝一起插上', desc: '周一出门前就不用找线了', keyword: '充电 收拾 周一' },
    { tag: '一句话', title: '一个人待着也算安排', desc: '什么都不做，不代表浪费', keyword: '独处 发呆 休息' },
    { tag: '吃饭', title: '这周撑下来了，值得一顿好的', desc: '不用等到有理由才对自己好', keyword: '犒劳 奖励 吃饭' }
  ],

  restNight: [
    { tag: '睡眠', title: '明天要上班，现在就睡', desc: '别拖到一点，周一会报复你', keyword: '周日 早睡 周一' },
    { tag: '一句话', title: '周末的夜比工作日的夜长', desc: '也过得更快，这是未解之谜', keyword: '周末 夜晚 时间' },
    { tag: '放松', title: '一集就好', desc: '第二集永远是陷阱', keyword: '追剧 自制力 熬夜' },
    { tag: '吃饭', title: '泡面加个蛋，周末版', desc: '加根肠也行，反正是周末', keyword: '泡面 夜宵 周末' },
    { tag: '睡眠', title: '把手机放到伸手够不到的地方', desc: '这一步比任何助眠方法都管用', keyword: '睡前 手机 睡眠' },
    { tag: '省钱', title: '深夜的购物车，明天再看', desc: '八成就不想买了', keyword: '购物车 冲动消费 省钱' },
    { tag: '睡眠', title: '睡不着就起来喝口水', desc: '别硬躺，越躺越清醒', keyword: '失眠 起床 喝水' },
    { tag: '一句话', title: '一周结束了', desc: '好的坏的都过去了', keyword: '一周 结束 复盘' },
    { tag: '一句话', title: '明天的事明天再说', desc: '今晚只负责睡', keyword: '明天 焦虑 睡觉' },
    { tag: '收拾', title: '关灯前看一眼房间', desc: '乱就乱着吧，明天再说', keyword: '房间 收拾 随它' },
    { tag: '睡眠', title: '周末别定闹钟', desc: '除非真要早起，否则让它响一次就是亏', keyword: '闹钟 周末 睡懒觉' },
    { tag: '一句话', title: '这一刻很安静', desc: '值得多待一会儿', keyword: '安静 深夜 独处' }
  ]
};

function groupOf(hour, date) {
  const h = typeof hour === 'number' ? hour : new Date().getHours();
  const d = date || new Date();
  const day = d.getDay();
  const prefix = day === 0 || day === 6 ? 'rest' : 'work';

  if (h >= 5 && h < 11) return prefix + 'Morning';
  if (h >= 11 && h < 17) return prefix + 'Noon';
  if (h >= 17 && h < 23) return prefix + 'Evening';
  return prefix + 'Night';
}

function readState() {
  const raw = store.get(BAG_KEY, {});
  return raw && typeof raw === 'object' ? raw : {};
}

// 重洗时排掉上一批的，免得刚看过又蹦出来
function refill(total, exclude) {
  const bag = [];
  for (let i = 0; i < total; i += 1) {
    if (exclude.indexOf(i) < 0) bag.push(i);
  }
  if (bag.length < 3) {
    bag.length = 0;
    for (let i = 0; i < total; i += 1) bag.push(i);
  }
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  return bag;
}

function list(hour, date) {
  return GROUPS[groupOf(hour, date)] || GROUPS.workMorning;
}

// 洗牌袋取三条：抽空才重洗，重洗时避开上一批
function batch(hour, offset, count, date) {
  const key = groupOf(hour, date);
  const pool = GROUPS[key];
  const size = Math.min(count || 3, pool.length);
  const state = readState();

  let slot = state[key] || { bag: [], last: [] };
  slot.bag = Array.isArray(slot.bag) ? slot.bag.filter(function (i) {
    return i >= 0 && i < pool.length;
  }) : [];
  slot.last = Array.isArray(slot.last) ? slot.last : [];

  if (slot.bag.length < size) {
    slot.bag = slot.bag.concat(refill(pool.length, slot.last));
  }

  const picked = slot.bag.splice(0, size);
  slot.last = picked.slice();
  state[key] = slot;
  store.set(BAG_KEY, state);

  return picked.map(function (i) {
    return pool[i];
  });
}

function total() {
  return Object.keys(GROUPS).reduce(function (sum, key) {
    return sum + GROUPS[key].length;
  }, 0);
}

module.exports = { GROUPS, groupOf, list, batch, total };
