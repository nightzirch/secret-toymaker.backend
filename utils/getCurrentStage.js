const { StageTypes } = require("../config/constants");
const Stage = require("../models/Stage");
const { getCurrentEvent } = require("../utils/utils");

const getCurrentStage = async () => {
  let currentStage = null;
  const currentEvent = await getCurrentEvent();

  if (!currentEvent) {
    return currentStage;
  }

  return currentEvent.stage;
};

module.exports = { getCurrentStage };
