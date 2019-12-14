const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require("firebase-functions");
require("firebase/firestore");
const {
  getGameAccountUUID,
  markGifteeAccount,
  markGw2Account
} = require("../utils/utils");
const { EVENT } = require("../config/constants");
const db = require("../config/db");

/**
 * @namespace sendGift
 * @return {sendGift~inner} - the returned function
 */
const sendGift = functions.https.onCall(
  /**
   * marks the gift sent on boith the gifter and giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {boolean} data.value - marks it either true or false
   * @param {string} data.gifteeGameAccountUUID - UUID of the giftee, if you do not know it
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, value, gifteeGameAccountUUID }, context) => {
    // this has to mark both the giftee and gifter

    if (!gifteeGameAccountUUID) {
      return { error: "no gifteeGameAccountUUID set" };
    }

    if (typeof value === "undefined") {
      value = true;
    }
    // gifter first
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }
    let entryResult = await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID.success)
      .set({ sent_own: value }, { merge: true })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    // giftee now, the giftee's gameAccountUUID is known
    let gifteeStatus = await markGifteeAccount(
      { gameAccountUUID: gifteeGameAccountUUID },
      { field: "sent", value: value }
    );

    let gw2Account = await markGw2Account({
      gifterGameAccountUUID: gameAccountUUID.success,
      field: "sent",
      value: value
    });

    // check result and return to frontend
    if (entryResult && gifteeStatus.success && gw2Account.success) {
      return { success: "Successfully marked sent" };
    } else {
      return { error: "Error in marking sent" + gifteeStatus };
    }
  }
);

/**
 * @namespace receiveGift
 * @return {receiveGift~inner} - the returned function
 */
const receiveGift = functions.https.onCall(
  /**
   * marks the gift recieved on the giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {boolean} data.value - marks it either true or false
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, value }, context) => {
    // on the giftee (current user)
    let gifteeStatus = await markGifteeAccount(
      { user: user },
      { field: "received", value: value }
    );

    let gw2Account = await markGw2Account({
      user: user,
      field: "received",
      value: value
    });

    // check result and return to frontend
    if (gifteeStatus.success && gw2Account.success) {
      return { success: gifteeStatus.success };
    } else {
      return { error: gifteeStatus.error };
    }
  }
);

/**
 * @namespace reportGift
 * @return {reportGift~inner} - the returned function
 */
const reportGift = functions.https.onCall(
  /**
   * marks the gift reported on the giftees account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {boolean} data.value - marks it either true or false
   * @param {string} [data.message] - message for reporting
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, value, message }, context) => {
    // on the giftee (current user)
    let gifteeStatus = await markGifteeAccount(
      { user: user },
      { field: "reported", value: value, message: message }
    );

    let gw2Account = await markGw2Account({
      user: user,
      field: "reported",
      value: value
    });

    // check result and return to frontend
    if (gifteeStatus.success && gw2Account.success) {
      return { success: gifteeStatus.success };
    } else {
      return { error: gifteeStatus.error };
    }
  }
);

module.exports = { sendGift, receiveGift, reportGift };
