const functions = require("firebase-functions");
const { setAllRandomParticipant } = require("../utils/utils");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");

// TODO: set this up to run on a schedule
/*

// this is to run a script on a schedule
export scheduledFunctionCrontab =
functions.pubsub.schedule('5 * * * *').onRun((context) => {
    console.log('This will be run every day at 00:05 AM UTC!');
});

// get the current stage
// if the current stage is not signup - continue
// check if this has already run// if not it runs the subfunctions below
// setAllRandomParticipant and setAllRandomParticipantF2P

 */

module.exports = functions.https.onCall(async (blank, context) => {
  await setAllRandomParticipant();
  await db
    .collection(CollectionTypes.EVENTS)
    .doc(EVENT)
    .set({ isMatchingDone: true }, { merge: true });
});
