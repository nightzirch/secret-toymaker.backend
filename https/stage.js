const functions = require("firebase-functions");
const { getCurrentStage } = require("../utils/getCurrentStage");

// this gets the current stage info
const stage = functions.https.onCall(async () => {
  const currentStage = await getCurrentStage();
  console.log("Current stage:", currentStage);
  return currentStage;
});

module.exports = { stage };
