const { StageTypes } = require("../config/constants");
const Stage = require("../models/Stage");
const { getCurrentEvent } = require("../utils/utils");

const getCurrentStage = async () => {
  let currentStage = null;
  const event = await getCurrentEvent();

  if (!event) {
    return currentStage;
  }

  return Stage.fromEventData(event);
};

module.exports = { getCurrentStage };
