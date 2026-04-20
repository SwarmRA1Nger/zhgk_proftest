const testData = require("../../../frontend/js/data.js");

function getTestData() {
  const { BLOCKS, DIRECTIONS, W, PROGRAM_DETAILS } = testData || {};

  if (!Array.isArray(BLOCKS) || !DIRECTIONS || !W || !PROGRAM_DETAILS) {
    throw new Error("Invalid test data configuration");
  }

  return { BLOCKS, DIRECTIONS, W, PROGRAM_DETAILS };
}

function getAllQuestionIds() {
  const { BLOCKS } = getTestData();

  return BLOCKS.flatMap((block) =>
    block.groups.flatMap((group) => group.questions.map((question) => Number(question[0])))
  );
}

function getStudyLabels() {
  const { BLOCKS } = getTestData();
  const block = BLOCKS.find((item) => item.id === "study");

  if (!block) return {};

  return block.groups.reduce((acc, group) => {
    acc[group.key] = group.name;
    return acc;
  }, {});
}

module.exports = {
  getTestData,
  getAllQuestionIds,
  getStudyLabels
};
