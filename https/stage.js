const functions = require("firebase-functions");
require("firebase/firestore");

const db = require("../config/db");
const { StageTypes } = require("../config/constants");
const Stage = require("../models/Stage");
const { getCurrentEvent } = require("../utils/utils");

// this gets the current stage info
const stage = functions.https.onCall(async (data, context) => {
  let currentStage = new Stage(StageTypes.INACTIVE);
  const event = await getCurrentEvent();

  if (!event) {
    return currentStage;
  }

  const { isMatchingDone, year } = event;
  const signupStart = event.signupStart.toDate();
  const matchingStart = event.matchingStart.toDate();
  const eventEnd = event.eventEnd.toDate();
  const now = new Date();

  if (signupStart < now && now < matchingStart) {
    currentStage = new Stage(StageTypes.SIGNUP, year, signupStart, matchingStart);
  } else if (matchingStart < now && now < eventEnd && !isMatchingDone) {
    currentStage = new Stage(StageTypes.MATCHING, year);
  } else if (matchingStart < now && now < eventEnd && isMatchingDone) {
    currentStage = new Stage(StageTypes.GIFTING, year, matchingStart, eventEnd);
  }
  return currentStage;
});

module.exports = { stage };
