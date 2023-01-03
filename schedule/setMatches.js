const functions = require("firebase-functions");
const { matchAllParticipants } = require("../utils/matchAllParticipants");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { getCurrentStage } = require("../utils/getCurrentStage");
const { StageTypes } = require("../config/constants");
const { db } = require("../config/firebase");
const { setMatchingBegun, setMatchingDone } = require("../utils/matching");

/**
 * @namespace setMatches
 * @return {setMatches~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const setMatches = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Runs the script that matches all participant in the active event.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.MATCHING) {
      console.log(
        `Not in matching stage. Skipping setting matches. Current stage is ${currentStage.type}`
      );
      return;
    }

    const { year } = currentStage;

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);
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

    await setMatchingBegun(true, year);

    const matchingResults = await matchAllParticipants(year);

    if (matchingResults.success) {
      await setMatchingDone(true, year);

      console.log("Matching for the event successful.");
      return;
    }

    console.log("Matching for the event failed.", matchingResults);
    await setMatchingBegun(false, year);
    await setMatchingDone(false, year);
    return;
  }
);

module.exports = { setMatches };
