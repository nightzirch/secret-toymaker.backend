const functions = require("firebase-functions");
const { getCurrentStage } = require("../utils/getCurrentStage");

// this gets the current stage info
const stage = functions.https.onCall(async (data, context) => {
  const currentStage = await getCurrentStage();
  return currentStage;
});

module.exports = { stage };
