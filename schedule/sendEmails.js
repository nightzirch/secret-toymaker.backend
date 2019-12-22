const functions = require("firebase-functions");
const { matchAllParticipants } = require("../utils/matchAllParticipants");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { getCurrentStage } = require("../utils/getCurrentStage");
const { StageTypes } = require("../config/constants");
const db = require("../config/db");


/**
 * @namespace sendSignupStarts
 * @return {sendSignupStarts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupStarts = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are registered at the site.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

/**
 * @namespace sendSignupReminder
 * @return {sendSignupReminder~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupReminder = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who registered at the site, but who are not participating in the current event.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

/**
 * @namespace sendEventStarts
 * @return {sendEventStarts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendEventStarts = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are participating in the current event, about us entered the gifting stage.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

/**
 * @namespace sendEventEnd
 * @return {sendEventEnd~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendEventEnd = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are participating in the current event and did not yet send their gift.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

module.exports = { sendSignupStarts, sendSignupReminder, sendEventStarts, sendEventEnd };
