const { StageTypes } = require("../config/constants");
const Stage = require("../models/Stage");
const { getCurrentEvent } = require("../utils/utils");

const getCurrentStage = async () => {
  let currentStage = null;
  const event = await getCurrentEvent();

  if (!event) {
    return currentStage;
  }

  const { isMatchingDone, year } = event;
  const signupStart = event.signupStart.toDate();
  const eventStart = event.eventStart.toDate();
  const eventEnd = event.eventEnd.toDate();
  const now = new Date();

  if (signupStart < now && now < eventStart) {
    currentStage = new Stage(StageTypes.SIGNUP, year, signupStart, eventStart);
  } else if (eventStart < now && now < eventEnd && !isMatchingDone) {
    currentStage = new Stage(StageTypes.MATCHING, year);
  } else if (eventStart < now && now < eventEnd && isMatchingDone) {
    currentStage = new Stage(StageTypes.GIFTING, year, eventStart, eventEnd);
  }
  return currentStage;
};

module.exports = { getCurrentStage };
