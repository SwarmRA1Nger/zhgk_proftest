const { getTestData } = require("./data-service");

function normalize(raw, n) {
  return Math.round((((raw - n) / (4 * n)) * 1000)) / 10;
}

function calcBlock(BLOCKS, blockId, answers) {
  const block = BLOCKS.find((b) => b.id === blockId);
  if (!block) return {};

  const out = {};
  block.groups.forEach((group) => {
    let raw = 0;
    group.questions.forEach((question) => {
      const qnum = question[0];
      const val = Number(answers[qnum] || 1);
      raw += Number.isFinite(val) ? val : 1;
    });
    out[group.key] = normalize(raw, group.questions.length);
  });

  return out;
}

function calcDirections(DIRECTIONS, weights, riasec, klimov, study) {
  const list = Object.keys(DIRECTIONS).map((name) => {
    const direction = DIRECTIONS[name];
    const riasecTraits = direction[0] || [];
    const klimovTrait = direction[1];
    const studyTraits = direction[2] || [];

    let mR = 0;
    riasecTraits.forEach((trait) => {
      mR += Number(riasec[trait] || 0);
    });
    mR = riasecTraits.length ? mR / riasecTraits.length : 0;

    const mK = Number(klimov[klimovTrait] || 0);

    let mS = 0;
    studyTraits.forEach((trait) => {
      mS += Number(study[trait] || 0);
    });
    mS = studyTraits.length ? mS / studyTraits.length : 0;

    const total = Number(weights.riasec || 0) * mR + Number(weights.klimov || 0) * mK + Number(weights.study || 0) * mS;

    return {
      name,
      total: Math.round(total * 10) / 10,
      mR: Math.round(mR * 10) / 10,
      mK: Math.round(mK * 10) / 10,
      mS: Math.round(mS * 10) / 10
    };
  });

  list.sort((a, b) => b.total - a.total);
  return list;
}

function scoreByAnswers(answers) {
  if (!answers || typeof answers !== "object") {
    throw new Error("answers must be an object");
  }

  const { BLOCKS, DIRECTIONS, W, PROGRAM_DETAILS } = getTestData();
  const riasec = calcBlock(BLOCKS, "riasec", answers);
  const klimov = calcBlock(BLOCKS, "klimov", answers);
  const study = calcBlock(BLOCKS, "study", answers);
  const ranked = calcDirections(DIRECTIONS, W, riasec, klimov, study);

  return {
    riasec,
    klimov,
    study,
    ranked,
    top3: ranked.slice(0, 3),
    detailsByName: PROGRAM_DETAILS
  };
}

module.exports = { scoreByAnswers };
