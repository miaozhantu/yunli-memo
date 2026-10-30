// 翻译（模拟）
// 不接任何翻译 API：按标签挑一段固定英文，再根据正文长度决定给几句，
// 让气泡看起来像是真的跟着内容走。接真实接口时只改这个文件。

const POOLS = {
  n_work: [
    'Sorted out what still needs to be done this week, and moved the rest to next Monday.',
    'The meeting ran long again. Most of it could have been an email.',
    'Wrote down the three things that actually matter, and stopped pretending the rest is urgent.'
  ],
  n_idea: [
    'An idea showed up while I was doing something else, so I wrote it here before it left.',
    'Not sure if this is good yet. Keeping it anyway — bad ideas are cheaper than lost ones.',
    'This might turn into something. Or it might just be a Tuesday thought.'
  ],
  n_study: [
    'Took notes on the part that confused me, then read it again and it made sense.',
    'Halfway through the chapter. The second half can wait until tomorrow.',
    'Learned one thing properly instead of skimming ten things badly.'
  ],
  n_life: [
    'Nothing special happened today, which is its own kind of good day.',
    'Cooked something edible on the first try. Low bar, high happiness.',
    'The light in the afternoon was nice, so I sat there for a while and did nothing.'
  ]
};

const CLOSERS = [
  'Reading this back later will probably make me laugh.',
  'Saving it here so future me remembers.',
  'That is all for today.'
];

function translate(text, tagId) {
  const pool = POOLS[tagId] || POOLS.n_life;
  const body = text || '';
  const lines = pool.slice();

  // 正文越长，给的句子越多，看起来像是真的在翻
  const count = body.length > 120 ? 3 : body.length > 40 ? 2 : 1;
  const picked = lines.slice(0, count);

  if (body.length > 200) picked.push(CLOSERS[0]);
  else if (body.length > 60) picked.push(CLOSERS[1]);

  return picked.join(' ');
}

module.exports = { translate };
