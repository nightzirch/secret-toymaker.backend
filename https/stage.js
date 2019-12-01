const functions = require("firebase-functions");
require("firebase/firestore");

const db = require("../config/db");
const { StageTypes } = require("../config/constants");
const Stage = require("../models/Stage");
const { getCurrentEvent } = require("../utils/utils");

// this gets the current stage info
const stage = functions.https.onCall(async(data, context) => {
  let currentStage = new Stage(StageTypes.INACTIVE);
  const event = await getCurrentEvent();
  
  if (!event) {return currentStage}

  const { year } = event;
  const signupStart = event.signupStart.toDate();
  const signupEnd = event.signupEnd.toDate();
  const eventStart = event.eventStart.toDate();
  const eventEnd = event.eventEnd.toDate();
  const now = new Date();

  if(signupStart < now && now < signupEnd) {
      currentStage = new Stage(StageTypes.SIGNUP, year, signupStart, signupEnd);
  } else if(signupEnd < now && now < eventStart) {
      currentStage = new Stage(StageTypes.MATCHING, year, signupEnd, eventStart);
  } else if(eventStart < now && now < eventEnd) {
      currentStage = new Stage(StageTypes.GIFTING, year, eventStart, eventEnd);
  }
  return currentStage
});

module.exports = { stage }