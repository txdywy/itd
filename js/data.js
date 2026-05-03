// ==================== 天地劫·像素传 - 数据层 ====================

// 16色调色板
const PALETTE = {
  '.': null,        // 透明
  '0': '#000000',   // 黑
  '1': '#ffffff',   // 白
  '2': '#cccccc',   // 浅灰/银
  '3': '#888888',   // 中灰
  '4': '#444444',   // 深灰/铁
  '5': '#ffcc66',   // 肤色/金黄
  '6': '#ff6666',   // 红
  '7': '#cc3333',   // 深红
  '8': '#6699ff',   // 蓝
  '9': '#3366cc',   // 深蓝
  'a': '#66cc66',   // 绿
  'b': '#339933',   // 深绿
  'c': '#ffcc00',   // 金黄/金发
  'd': '#cc99ff',   // 紫
  'e': '#ff99cc',   // 粉
  'f': '#663300',   // 棕
  'g': '#996633',   // 土黄
  'h': '#cc9966',   // 浅棕
  'i': '#ff9933',   // 橙
  'j': '#66ffff',   // 青/冰蓝
  'k': '#333333',   // 暗灰
};

// 角色精灵 16x16
const SPRITES = {
  // 夏侯仪 - 金发少年，黄白袍，铁爪
  xiahouyi: [
    "................",
    "......cccc......",
    ".....ccccc......",
    "....cc55cc......",
    "...cc5555cc.....",
    "...c555555c.....",
    "...c555555c.....",
    "....556655......",
    "....111111......",
    "...11111111.....",
    "...11555111.....",
    "...11555111.....",
    "...11555111.....",
    "...11g11g11.....",
    "...gg1gg1gg.....",
    "...gggggggg....."
  ],
  // 冰璃 - 银发剑使，白衣
  bingli: [
    "................",
    "......2222......",
    ".....222222.....",
    "....2255222.....",
    "...22555522.....",
    "...25555552.....",
    "...25555552.....",
    "....556655......",
    "....111111......",
    "...11111111.....",
    "...11111111.....",
    "...11111111.....",
    "...11111111.....",
    "...11222111.....",
    "...22222222.....",
    "...22222222....."
  ],
  // 封铃笙 - 绿衣女子
  fenglingsheng: [
    "................",
    "......ffff......",
    ".....ffffff.....",
    "....ff555ff.....",
    "...ff5555ff.....",
    "...f555555f.....",
    "...f555555f.....",
    "....556655......",
    "....aaaaaa......",
    "...aaaaaaaa.....",
    "...aa5555aa.....",
    "...aa5555aa.....",
    "...aa5555aa.....",
    "...aa1aa1aa.....",
    "...a11aa11a.....",
    "...aaaaaaaa....."
  ],
  // 慕容璇玑 - 紫衣雷法
  murongxuanji: [
    "................",
    "......0000......",
    ".....000000.....",
    "....0055500.....",
    "...00555500.....",
    "...05555550.....",
    "...05555550.....",
    "....556655......",
    "....dddddd......",
    "...dddddddd.....",
    "...dd5555dd.....",
    "...dd5555dd.....",
    "...dd5555dd.....",
    "...dd1dd1dd.....",
    "...d11dd11d.....",
    "...dddddddd....."
  ],
  // 古伦德 - 金发战士，盔甲
  gulunde: [
    "................",
    "......cccc......",
    ".....cccccc.....",
    "....cc555cc.....",
    "...cc5555cc.....",
    "...c555555c.....",
    "...c555555c.....",
    "....556655......",
    "....444444......",
    "...44444444.....",
    "...44555444.....",
    "...44555444.....",
    "...44555444.....",
    "...44333444.....",
    "...43333434.....",
    "...44444444....."
  ],
  // 西夏兵 - 灰甲红巾
  xixia: [
    "................",
    "......7777......",
    ".....777777.....",
    "....7755577.....",
    "...77555577.....",
    "...75555557.....",
    "...75555557.....",
    "....556655......",
    "....333333......",
    "...33333333.....",
    "...33777333.....",
    "...33333333.....",
    "...33333333.....",
    "...33333333.....",
    "...33333333.....",
    "...33333333....."
  ],
  // 妖魔 - 紫黑
  yaomo: [
    "................",
    "......dddd......",
    ".....dddddd.....",
    "....dd555dd.....",
    "...dd5665dd.....",
    "...d566665d.....",
    "...d566665d.....",
    "....566665......",
    "....000000......",
    "...00000000.....",
    "...00666600.....",
    "...00666600.....",
    "...00066000.....",
    "...00000000.....",
    "...00000000.....",
    "...00000000....."
  ],
  // 皇甫申 - 黑袍紫边
  huangfushen: [
    "................",
    "......cccc......",
    ".....cccccc.....",
    "....cc555cc.....",
    "...cc5555cc.....",
    "...c555555c.....",
    "...c555555c.....",
    "....556655......",
    "....000000......",
    "...00000000.....",
    "...00dddd00.....",
    "...00dddd00.....",
    "...00dddd00.....",
    "...00d00d00.....",
    "...0d00d00d.....",
    "...00000000....."
  ],
  // 罗睺使者 - 暗红恐怖
  luohou: [
    "................",
    "......6666......",
    ".....666666.....",
    "....6677766.....",
    "...66777766.....",
    "...67777776.....",
    "...67777776.....",
    "....777777......",
    "....000000......",
    "...00000000.....",
    "...00777700.....",
    "...00777700.....",
    "...00700700.....",
    "...00000000.....",
    "...00000000.....",
    "...00000000....."
  ],
  // 宝箱
  chest: [
    "................",
    ".....gggggg.....",
    "....gggggggg....",
    "...gg111111gg...",
    "...g11111111g...",
    "...g11cccc11g...",
    "...g11cccc11g...",
    "...g11111111g...",
    "...g11111111g...",
    "...g11111111g...",
    "...g11111111g...",
    "...g11111111g...",
    "...g11111111g...",
    "...gggggggggg...",
    "....gggggggg....",
    ".....gggggg....."
  ],
  // 光标
  cursor: [
    "1...............",
    "11..............",
    "1.1.............",
    "1..1............",
    "1...1...........",
    "1....1..........",
    "1.....1.........",
    "1......1........",
    "1.......1.......",
    "1......1........",
    "1.....1.........",
    "1....1..........",
    "1...1...........",
    "1..1............",
    "1.1.............",
    "1...............,"
  ]
};

// 地形数据
const tileColors = {
  0: '#6b5b45', // 平地
  1: '#888888', // 墙壁
  2: '#336699', // 水域
  3: '#447733', // 树林
  4: '#8b6914', // 山地
  5: '#554433', // 道路
  9: '#442222', // 暗地（幽城）
};

const tileInfo = {
  0: { name: '平地', move: 1, def: 0, avoid: 0 },
  1: { name: '墙壁', move: 99, def: 0, avoid: 0 },
  2: { name: '水域', move: 99, def: 0, avoid: 0 },
  3: { name: '树林', move: 2, def: 1, avoid: 20 },
  4: { name: '山地', move: 3, def: 2, avoid: 10 },
  5: { name: '道路', move: 1, def: 0, avoid: 0 },
  9: { name: '幽垠', move: 2, def: 1, avoid: 0 },
};

// 角色职业模板
const CLASS_TEMPLATES = {
  mage: { hp: 80, mp: 60, atk: 8, def: 4, mag: 18, spd: 10, move: 3, growth: {hp:8, mp:6, atk:2, def:2, mag:4, spd:2} },
  swordsman: { hp: 110, mp: 20, atk: 16, def: 10, mag: 4, spd: 12, move: 4, growth: {hp:12, mp:2, atk:4, def:3, mag:1, spd:3} },
  warrior: { hp: 140, mp: 10, atk: 14, def: 14, mag: 2, spd: 6, move: 3, growth: {hp:15, mp:1, atk:3, def:4, mag:0, spd:1} },
  healer: { hp: 90, mp: 50, atk: 6, def: 5, mag: 14, spd: 10, move: 3, growth: {hp:9, mp:5, atk:1, def:2, mag:3, spd:2} },
  ranger: { hp: 100, mp: 30, atk: 14, def: 7, mag: 8, spd: 14, move: 4, growth: {hp:10, mp:3, atk:3, def:2, mag:2, spd:4} },
};

// 技能/法术
const SKILLS = {
  // 夏侯仪 - 火/冰/暗
  lihuo: { name: '离火神诀', type: 'magic', element: 'fire', power: 25, mp: 8, range: 3, area: 1, desc: '火系单体法术' },
  tianshuang: { name: '天霜雪舞', type: 'magic', element: 'ice', power: 25, mp: 8, range: 3, area: 1, desc: '冰系单体法术' },
  duohun: { name: '夺魄鬼咒', type: 'magic', element: 'dark', power: 35, mp: 15, range: 3, area: 1, desc: '暗系强力法术' },
  mojin: { name: '魔天降临', type: 'magic', element: 'dark', power: 50, mp: 25, range: 2, area: 2, desc: '暗系范围法术' },
  // 冰璃 - 冰/物理
  youjian: { name: '幽剑冥引', type: 'phys', power: 28, mp: 6, range: 1, area: 1, desc: '冰属性剑技' },
  miejian: { name: '灭剑血胧', type: 'phys', power: 40, mp: 12, range: 1, area: 1, desc: '强力剑技' },
  // 封铃笙 - 风/辅助
  lvfeng: { name: '揽风神行', type: 'magic', element: 'wind', power: 15, mp: 6, range: 3, area: 1, desc: '风系法术' },
  heal: { name: '神气流转', type: 'heal', power: 40, mp: 10, range: 2, area: 1, desc: '恢复生命' },
  // 慕容璇玑 - 雷
  wulei: { name: '五雷正法', type: 'magic', element: 'thunder', power: 25, mp: 8, range: 3, area: 1, desc: '雷系法术' },
  leilie: { name: '狂雷电刃', type: 'magic', element: 'thunder', power: 45, mp: 18, range: 3, area: 2, desc: '雷系范围法术' },
  // 古伦德 - 物理
  zhanji: { name: '重斩', type: 'phys', power: 30, mp: 5, range: 1, area: 1, desc: '强力斩击' },
  tuji: { name: '突击', type: 'phys', power: 20, mp: 4, range: 1, area: 1, desc: '普通攻击' },
  // 通用
  attack: { name: '攻击', type: 'phys', power: 10, mp: 0, range: 1, area: 1, desc: '普通攻击' },
  ranged: { name: '射击', type: 'phys', power: 12, mp: 0, range: 2, area: 1, desc: '远程攻击' },
};

// 元素相克: 火→冰→雷→火, 暗↔圣
const ELEMENT_ADV = {
  fire: { weak: 'ice', strong: 'ice' },
  ice: { weak: 'thunder', strong: 'fire' },
  thunder: { weak: 'fire', strong: 'ice' },
  dark: { weak: 'holy', strong: 'holy' },
  holy: { weak: 'dark', strong: 'dark' },
  wind: { weak: 'thunder', strong: 'none' },
};

// 我方角色定义
const PLAYER_CHARS = {
  xiahouyi: {
    name: '夏侯仪', sprite: 'xiahouyi', class: 'mage',
    level: 1, exp: 0,
    base: { hp: 80, mp: 60, atk: 8, def: 4, mag: 18, spd: 10 },
    skills: ['lihuo', 'tianshuang', 'duohun'],
    desc: '西域河州镇少年，霍雍转世，精通火冰暗三系咒术'
  },
  bingli: {
    name: '冰璃', sprite: 'bingli', class: 'swordsman',
    level: 3, exp: 0,
    base: { hp: 120, mp: 25, atk: 18, def: 12, mag: 5, spd: 14 },
    skills: ['youjian', 'miejian'],
    desc: '千年剑使，守护霍雍的银发少女，手持幻剑煌熇'
  },
  fenglingsheng: {
    name: '封铃笙', sprite: 'fenglingsheng', class: 'healer',
    level: 2, exp: 0,
    base: { hp: 95, mp: 55, atk: 7, def: 6, mag: 15, spd: 11 },
    skills: ['lvfeng', 'heal'],
    desc: '机灵聪慧的女贼，封寒月之母，擅长风系与治愈法术'
  },
  murongxuanji: {
    name: '慕容璇玑', sprite: 'murongxuanji', class: 'mage',
    level: 2, exp: 0,
    base: { hp: 85, mp: 55, atk: 7, def: 5, mag: 17, spd: 10 },
    skills: ['wulei', 'leilie'],
    desc: '天玄门弟子，精通雷系法术，性格直爽'
  },
  gulunde: {
    name: '古伦德', sprite: 'gulunde', class: 'warrior',
    level: 3, exp: 0,
    base: { hp: 150, mp: 12, atk: 16, def: 16, mag: 2, spd: 7 },
    skills: ['zhanji', 'tuji'],
    desc: '西域战士，力大无穷，是可靠的盾墙'
  }
};

// 敌人模板
const ENEMY_TEMPLATES = {
  xixia_soldier: { name: '西夏兵', sprite: 'xixia', class: 'warrior', hp: 60, mp: 0, atk: 12, def: 6, mag: 0, spd: 6, move: 3, skills: ['attack'], exp: 15, ai: 'aggressive' },
  xixia_mage: { name: '西夏法师', sprite: 'xixia', class: 'mage', hp: 45, mp: 30, atk: 5, def: 3, mag: 12, spd: 7, move: 3, skills: ['lihuo'], exp: 20, ai: 'magic' },
  yaomo_wolf: { name: '蚀狼', sprite: 'yaomo', class: 'warrior', hp: 80, mp: 0, atk: 14, def: 5, mag: 0, spd: 10, move: 4, skills: ['attack'], exp: 25, ai: 'aggressive' },
  yaomo_demon: { name: '幽魔', sprite: 'yaomo', class: 'mage', hp: 70, mp: 40, atk: 6, def: 6, mag: 14, spd: 8, move: 3, skills: ['duohun'], exp: 35, ai: 'magic' },
  boss_huangfu: { name: '皇甫申', sprite: 'huangfushen', class: 'mage', hp: 200, mp: 80, atk: 15, def: 10, mag: 20, spd: 12, move: 3, skills: ['duohun', 'mojin'], exp: 100, ai: 'boss', boss: true },
  boss_luohou: { name: '罗睺使者', sprite: 'luohou', class: 'mage', hp: 350, mp: 120, atk: 20, def: 15, mag: 25, spd: 10, move: 3, skills: ['mojin', 'duohun', 'lihuo'], exp: 200, ai: 'boss', boss: true },
};

// 地图定义 20x15
const MAPS = [
  // 第一章：河州镇之劫
  {
    name: '河州镇',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "10000000000000000001",
      "10000000000000000001",
      "10033300000003330001",
      "10033300000003330001",
      "10000005555000000001",
      "10000005555000000001",
      "10000000000000000001",
      "10000000000000000001",
      "10004400000000440001",
      "10004400000000440001",
      "10000000000000000001",
      "10000000000000000001",
      "10000000000000000001",
      "11111111111111111111"
    ],
    playerStart: [{x:3,y:6},{x:4,y:7},{x:3,y:8}],
    enemies: [
      {type:'xixia_soldier',x:15,y:4},{type:'xixia_soldier',x:16,y:5},
      {type:'xixia_soldier',x:15,y:6},{type:'xixia_mage',x:17,y:5}
    ],
    win: 'kill_all',
    music: 'village'
  },
  // 第二章：迦夏之窟
  {
    name: '迦夏之窟',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "19999900000009999991",
      "19999900000009999991",
      "10000000000000000001",
      "10000000000000000001",
      "10000001111000000001",
      "10000001111000000001",
      "10000000000000000001",
      "10000000000000000001",
      "10004400000000440001",
      "10004400000000440001",
      "10000000000000000001",
      "10000000000000000001",
      "19999900000009999991",
      "11111111111111111111"
    ],
    playerStart: [{x:3,y:7},{x:4,y:8},{x:3,y:9},{x:2,y:8}],
    enemies: [
      {type:'yaomo_wolf',x:15,y:5},{type:'yaomo_wolf',x:16,y:6},
      {type:'yaomo_demon',x:15,y:7},{type:'yaomo_wolf',x:16,y:8}
    ],
    win: 'kill_all',
    storyStart: 'ch2_start',
    storyEnd: 'ch2_end'
  },
  // 第三章：兰州风波
  {
    name: '兰州古道',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "10000005555000000001",
      "10000005555000000001",
      "10033300000003330001",
      "10033300000003330001",
      "10000000000000000001",
      "10000000000000000001",
      "10000001111000000001",
      "10000001111000000001",
      "10004400000000440001",
      "10004400000000440001",
      "10000005555000000001",
      "10000005555000000001",
      "10000000000000000001",
      "11111111111111111111"
    ],
    playerStart: [{x:2,y:6},{x:3,y:7},{x:2,y:8},{x:3,y:6},{x:4,y:7}],
    enemies: [
      {type:'xixia_soldier',x:16,y:4},{type:'xixia_soldier',x:17,y:5},
      {type:'yaomo_demon',x:16,y:7},{type:'xixia_mage',x:17,y:6},
      {type:'xixia_soldier',x:16,y:8}
    ],
    win: 'kill_all',
    storyStart: 'ch3_start'
  },
  // 第四章：高昌迷阵
  {
    name: '高昌迷阵',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "10000000000000000001",
      "10000001111000000001",
      "10000001111000000001",
      "10000000000000000001",
      "10001100000001100001",
      "10001100000001100001",
      "10000000000000000001",
      "10000001111000000001",
      "10000001111000000001",
      "10004400000000440001",
      "10004400000000440001",
      "10000000000000000001",
      "10000000000000000001",
      "11111111111111111111"
    ],
    playerStart: [{x:3,y:5},{x:4,y:6},{x:3,y:7},{x:4,y:5},{x:2,y:6}],
    enemies: [
      {type:'yaomo_wolf',x:15,y:4},{type:'yaomo_demon',x:16,y:5},
      {type:'yaomo_wolf',x:15,y:7},{type:'yaomo_demon',x:16,y:6},
      {type:'yaomo_wolf',x:15,y:8}
    ],
    win: 'kill_all',
    storyStart: 'ch4_start'
  },
  // 第五章：楼兰遗梦
  {
    name: '楼兰古城',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "10000000000000000001",
      "10000000000000000001",
      "10000001111000000001",
      "10000001111000000001",
      "10000000000000000001",
      "10000000000000000001",
      "10001100000001100001",
      "10001100000001100001",
      "10000000000000000001",
      "10000000000000000001",
      "10000009999000000001",
      "10000009999000000001",
      "10000000000000000001",
      "11111111111111111111"
    ],
    playerStart: [{x:3,y:6},{x:4,y:7},{x:3,y:8},{x:4,y:6},{x:2,y:7}],
    enemies: [
      {type:'yaomo_demon',x:15,y:5},{type:'yaomo_wolf',x:16,y:6},
      {type:'boss_huangfu',x:15,y:7},{type:'yaomo_demon',x:16,y:7},
      {type:'yaomo_wolf',x:15,y:8}
    ],
    win: 'kill_all',
    storyStart: 'ch5_start',
    storyEnd: 'ch5_end'
  },
  // 第六章：幽城决战
  {
    name: '幽城深处',
    width: 20, height: 15,
    tiles: [
      "11111111111111111111",
      "19999999999999999991",
      "19900000000000000991",
      "19900001111000000991",
      "19900001111000000991",
      "10000000000000000001",
      "10000000000000000001",
      "10001100000001100001",
      "10001100000001100001",
      "10000000000000000001",
      "10000000000000000001",
      "19900000000000000991",
      "19900000000000000991",
      "19999999999999999991",
      "11111111111111111111"
    ],
    playerStart: [{x:3,y:6},{x:4,y:7},{x:3,y:8},{x:4,y:6},{x:2,y:7}],
    enemies: [
      {type:'yaomo_demon',x:15,y:5},{type:'yaomo_demon',x:16,y:6},
      {type:'boss_luohou',x:15,y:7},{type:'yaomo_demon',x:16,y:7},
      {type:'yaomo_demon',x:15,y:8},{type:'yaomo_wolf',x:14,y:6},
      {type:'yaomo_wolf',x:14,y:7}
    ],
    win: 'kill_all',
    storyStart: 'ch6_start',
    storyEnd: 'ch6_end'
  }
];

// 剧情对话
const STORIES = {
  intro: [
    { speaker: 'narrator', text: '西域，河州镇。一个平凡的边陲小镇，却在今日迎来了不速之客。' },
    { speaker: 'xiahouyi', text: '高老丈的病不能再拖了，我必须去兰州城买药！' },
    { speaker: 'narrator', text: '少年夏侯仪正要出镇，却见远处尘土飞扬……' },
    { speaker: 'xiahouyi', text: '那是……西夏兵？他们来河州镇做什么？' },
    { speaker: 'fenglingsheng', text: '小兄弟，不想死的话就快躲起来！那些家伙在抓人！' },
    { speaker: 'xiahouyi', text: '姑娘你是……？' },
    { speaker: 'fenglingsheng', text: '我叫封铃笙，现在不是解释的时候——他们追来了！' }
  ],
  ch2_start: [
    { speaker: 'narrator', text: '摆脱追兵后，夏侯仪与封铃笙逃入了一处神秘的洞窟。' },
    { speaker: 'fenglingsheng', text: '这里是……迦夏之窟？传说中有千年古沉睡之地。' },
    { speaker: 'xiahouyi', text: '快看！那冰棺中似乎有人！' },
    { speaker: 'narrator', text: '冰棺中，一位银发少女静静沉睡着，手中握着一柄银色长剑。' },
    { speaker: 'xiahouyi', text: '她……她在发光！' },
    { speaker: 'bingli', text: '……霍雍……大人？不……你是……？' },
    { speaker: 'fenglingsheng', text: '她醒了！小兄弟，小心！' },
    { speaker: 'bingli', text: '你不是霍雍大人……但你的气息……为何如此相似？' },
    { speaker: 'xiahouyi', text: '我叫夏侯仪，姑娘你没事吧？这里危险，先离开再说！' },
    { speaker: 'bingli', text: '……夏侯仪。我名冰璃，是你的……剑使。' },
    { speaker: 'xiahouyi', text: '剑使？' },
    { speaker: 'narrator', text: '话音未落，洞窟深处传来阵阵低吼……' }
  ],
  ch2_end: [
    { speaker: 'bingli', text: '这些魔物……是守护此地的蚀怪。' },
    { speaker: 'fenglingsheng', text: '小兄弟，你这剑使可了不得，一剑便斩了那魔物！' },
    { speaker: 'xiahouyi', text: '冰璃姑娘，你说你是我的剑使，这到底是怎么回事？' },
    { speaker: 'bingli', text: '千年之约……我守候千年，只为再次与霍雍大人重逢。而你……或许是他的转世。' },
    { speaker: 'xiahouyi', text: '转世？霍雍？我怎么越听越糊涂了……' },
    { speaker: 'fenglingsheng', text: '不管怎样，先离开这里。去兰州城，我需要打探一些消息。' }
  ],
  ch3_start: [
    { speaker: 'narrator', text: '兰州城外，古道西风。' },
    { speaker: 'xiahouyi', text: '兰州就在前面了，高老丈的药……' },
    { speaker: 'fenglingsheng', text: '等等！前面有埋伏！' },
    { speaker: 'xiahouyi', text: '又是西夏兵？他们怎么会知道我们的路线？' },
    { speaker: 'bingli', text: '……不只是普通的士兵。我感受到了幽界的气息。' }
  ],
  ch4_start: [
    { speaker: 'narrator', text: '高昌古城，风沙漫天。' },
    { speaker: 'gulunde', text: '站住！你们是什么人？' },
    { speaker: 'xiahouyi', text: '我们是路过的旅人，不想与阁下为敌！' },
    { speaker: 'gulunde', text: '哼，这高昌古城是我古伦德的地盘，你们擅闯此地……' },
    { speaker: 'fenglingsheng', text: '且慢！我们是为了寻找幽垠之戒而来。' },
    { speaker: 'gulunde', text: '幽垠之戒？你们怎么知道……' },
    { speaker: 'narrator', text: '突然，四周魔物涌现！' },
    { speaker: 'gulunde', text: '该死，又是这些蚀怪！罢了，先联手击退它们！' }
  ],
  ch5_start: [
    { speaker: 'narrator', text: '楼兰古城，千年遗址。' },
    { speaker: 'murongxuanji', text: '夏侯公子！你们果然在这里！' },
    { speaker: 'xiahouyi', text: '慕容姑娘？你怎么也来了？' },
    { speaker: 'murongxuanji', text: '时轮宫的人正在追踪你们，他们说你们企图开启九浑天动仪，让幽界降临！' },
    { speaker: 'fenglingsheng', text: '荒谬！明明是那些所谓的正道在觊觎天动仪的力量！' },
    { speaker: 'narrator', text: '一阵阴冷的笑声从废墟中传来……' },
    { speaker: 'huangfushen', text: '呵呵呵……夏侯仪，我的另一半……你终于来了。' },
    { speaker: 'xiahouyi', text: '你是……皇甫申？！' },
    { speaker: 'huangfushen', text: '霍雍的魂魄分而为二，你继承了那份善良，而我……继承了那份憎恨。来吧，让我看看你有何资格成为祭使！' }
  ],
  ch5_end: [
    { speaker: 'huangfushen', text: '不可能……我怎么会败给你……' },
    { speaker: 'xiahouyi', text: '皇甫申，住手吧！我们没必要互相残杀！' },
    { speaker: 'huangfushen', text: '太迟了……九浑天动仪已经开始运转……幽城即将现世……' },
    { speaker: 'bingli', text: '……幽城。那是霍雍大人与我千年前的约定之地。' },
    { speaker: 'xiahouyi', text: '冰璃……不管发生什么，我都会保护你。' },
    { speaker: 'bingli', text: '……夏侯仪。谢谢你。' }
  ],
  ch6_start: [
    { speaker: 'narrator', text: '幽城深处，罗睺之力涌动。' },
    { speaker: 'narrator', text: '千年前的宿命，终将在今日迎来终结。' },
    { speaker: 'luohou', text: '凡人……竟敢踏入神的领域？' },
    { speaker: 'xiahouyi', text: '罗睺！你就是这一切的幕后黑手！' },
    { speaker: 'luohou', text: '霍雍……你背叛了千年的契约。现在，我要亲手收回赐予你的一切！' },
    { speaker: 'bingli', text: '罗睺神……我不会让你伤害他的。' },
    { speaker: 'luohou', text: '剑使冰璃……你以为凭你一己之力，能对抗神明？' },
    { speaker: 'xiahouyi', text: '她不是一个人！我们所有人，都会并肩作战！' }
  ],
  ch6_end: [
    { speaker: 'luohou', text: '不可能……凡人竟然……' },
    { speaker: 'narrator', text: '罗睺的身影逐渐消散，幽城开始崩塌。' },
    { speaker: 'xiahouyi', text: '成功了……我们赢了！' },
    { speaker: 'bingli', text: '……千年的宿命，终于……结束了。' },
    { speaker: 'fenglingsheng', text: '小兄弟，接下来有什么打算？' },
    { speaker: 'xiahouyi', text: '我……想回河州镇。那里才是我的家。' },
    { speaker: 'bingli', text: '……无论你去哪里，我都会在你身边。这是我的宿命，也是我的选择。' },
    { speaker: 'xiahouyi', text: '冰璃……' },
    { speaker: 'narrator', text: '西域的风沙依旧，但少年与剑使的故事，才刚刚开始。' },
    { speaker: 'narrator', text: '—— 天地劫·像素传 · 完 ——' }
  ]
};

// 工具函数
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function calcStats(char) {
  const tmpl = CLASS_TEMPLATES[char.class];
  const lv = char.level;
  const s = {};
  for (const k of ['hp','mp','atk','def','mag','spd']) {
    s[k] = char.base[k] + Math.floor((tmpl.growth[k] || 0) * (lv - 1) * 0.8);
  }
  s.move = tmpl.move;
  s.maxHp = s.hp;
  s.maxMp = s.mp;
  return s;
}
function createEnemy(type, x, y) {
  const t = ENEMY_TEMPLATES[type];
  return {
    id: Math.random().toString(36).slice(2),
    name: t.name, sprite: t.sprite, class: t.class,
    level: 1, hp: t.hp, maxHp: t.hp, mp: t.mp, maxMp: t.mp,
    atk: t.atk, def: t.def, mag: t.mag, spd: t.spd, move: t.move,
    skills: t.skills, ai: t.ai, boss: t.boss || false,
    exp: t.exp, x, y, team: 'enemy', acted: false
  };
}
