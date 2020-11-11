const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require("firebase-functions");
require("firebase/firestore");
const { getGeneralQueries } = require("../utils/utils");
const { db } = require("../config/firebase");

/**
 * @namespace getNotSent
 * @return {getNotSent~inner} - the returned function
 */
const getNotSent = functions.https.onCall(
  /**
   * Gets a list of gifts not sent
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ skip, limit, year }, context) => {
    return {
      success: await getGeneralQueries("sent_own", "==", false, skip, limit, year)
    };
  }
);

/**
 * @namespace getNotReceived
 * @return {getNotReceived~inner} - the returned function
 */
const getNotReceived = functions.https.onCall(
  /**
   * Gets a list of gifts not recieved
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {string} data.year - Year of the event
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ skip, limit, year }, context) => {
    return {
      success: await getGeneralQueries("received", "==", false, skip, limit, year)
    };
  }
);

/**
 * @namespace getReported
 * @return {getReported~inner} - the returned function
 */
const getReported = functions.https.onCall(
  /**
   * Gets a list of gifts that are reported
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {string} data.year - Year of the event
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ skip, limit, year }, context) => {
    return {
      success: await getGeneralQueries("reported", "==", true, skip, limit, year)
    };
  }
);

/**
 * @namespace getStats
 * @return {getStats~inner} - the returned function
 */
const getStats = functions.https.onCall(
  /**
   * Gets global stats for teh current event
   * @inner
   * @param {object} data
   * @param {string} data.year - Year of the event
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ year }, context) => {
    let statsDoc = await db
      .collection(CollectionTypes.EVENTS)
      .doc(year)
      .get();
    if (!statsDoc.exists) {
      return { error: "No stats" };
    }

    const statsData = statsDoc.data();
    const stats = {
      participants: statsData.participants,
      giftsSent: statsData.giftsSent,
      donationsSent: statsData.donationsSent,
      signupStart: statsData.signupStart.toDate().toISOString(),
      eventStart: statsData.eventStart.toDate().toISOString(),
      eventEnd: statsData.eventEnd.toDate().toISOString(),
      year: statsData.year
    };

    return { success: stats };
  }
);

module.exports = {
  getStats,
  // the admin stuff
  getNotSent,
  getNotReceived,
  getReported
};
