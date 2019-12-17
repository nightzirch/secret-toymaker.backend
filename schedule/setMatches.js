const functions = require("firebase-functions");
const { matchAllParticipants } = require("../utils/matchAllParticipants");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { getCurrentStage } = require("../utils/getCurrentStage");
const { StageTypes } = require("../config/constants");
const db = require("../config/db");
const { setMatchingBegun, setMatchingDone } = require("../utils/matching");

/**
 * @namespace setMatches
 * @return {setMatches~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const setMatches = functions.pubsub.schedule("20 * * * *").onRun(
  /**
   * Runs the script that matches all participant in the active event.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.MATCHING) {
      console.log(
        `Not in matching stage. Skipping setting matches. Current stage is ${currentStage}`
      );
      return;
    }

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);
    const event = await eventDoc.get();

    if (!event.exists) {
      console.log("Event does not exist.");
      return;
    }

    const { isMatchingBegun, isMatchingDone } = event.data();

    if (isMatchingBegun) {
      console.log("Matching for event has already begun.");
      return;
    }

    if (isMatchingDone) {
      console.log("Matching for event is already done.");
      return;
    }

    await setMatchingBegun(true);

    const matchingResults = await matchAllParticipants();

    if (matchingResults.success) {
      await setMatchingDone(true);

      console.log("Matching for the event successful.");
      return;
    }

    console.log("Matching for the event failed.", matchingResults);
    await setMatchingBegun(false);
    await setMatchingDone(false);
    return;
  }
);

module.exports = { setMatches };
