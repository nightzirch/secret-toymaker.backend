const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This manages initializing, sending, recieving and reporting gifts.

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
 * @namespace updateGiftSentStatus
 * @return {updateGiftSentStatus~inner} - the returned function
 */
const updateGiftSentStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isSent - if the gift is sent
   * @returns {Result}
   */
  async ({ user, giftId, isSent }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);

    if (!giftDoc.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          sent: isSent ? new Date().toISOString() : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully
      ? { success: "Successfully updated gift's sent status." }
      : { error: "Failed updating gift's sent status." };
  }
);

/**
 * @namespace updateGiftReceivedStatus
 * @return {updateGiftReceivedStatus~inner} - the returned function
 */
const updateGiftReceivedStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isReceived - if the gift is received
   * @returns {Result}
   */
  async ({ user, giftId, isReceived }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);

    if (!giftDoc.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          received: isReceived ? new Date().toISOString() : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully
      ? { success: "Successfully updated gift's received status." }
      : { error: "Failed updating gift's received status." };
  }
);

/**
 * @namespace updateGiftReportedStatus
 * @return {updateGiftReportedStatus~inner} - the returned function
 */
const updateGiftReportedStatus = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.giftId - the uid for the gift
   * @param {bool} data.isReporting - if the gift is being reported
   * @returns {Result}
   */
  async ({ user, giftId, isReporting }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);

    if (!giftDoc.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          reported: isReporting ? new Date().toISOString() : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully
      ? { success: "Successfully updated gift's reported status." }
      : { error: "Failed updating gift's reported status." };
  }
);

/**
 * @namespace getGifts
 * @return {getGifts~inner} - the returned function
 */
const getGifts = functions.https.onCall(
  /**
   * Updates the sent status of the gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @returns {Result}
   */
  async ({ user }) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    let incomingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("giftee", "==", gameAccountUUID)
      .get();

    let outgoingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("toymaker", "==", gameAccountUUID)
      .get();

    let incomingGifts = [];
    let outgoingGifts = [];

    if(!incomingGiftsSnapshot.empty) {
      incomingGiftsSnapshot.forEach(doc => {
        let data = doc.data();
        incomingGifts.push(data);
      })
    }

    if(!outgoingGiftsSnapshot.empty) {
      outgoingGiftsSnapshot.forEach(doc => {
        let data = doc.data();
        outgoingGifts.push(data);
      })
    }

    return {
      success: {
        outgoing: outgoingGifts,
        incoming: incomingGifts
      }
    }
  }
);


// /**
//  * @namespace sendGift
//  * @return {sendGift~inner} - the returned function
//  */
// const sendGift = functions.https.onCall(
//   /**
//    * marks the gift sent on boith the gifter and giftees account
//    * @inner
//    * @param {object} data - details about the giftee
//    * @param {string} data.user - user object or uid
//    * @param {boolean} data.value - marks it either true or false
//    * @param {string} data.gifteeGameAccountUUID - UUID of the giftee, if you do not know it
//    * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
//    * @returns {Result}
//    */
//   async ({ user, value, gifteeGameAccountUUID }, context) => {
//     // this has to mark both the giftee and gifter

//     if (!gifteeGameAccountUUID) {
//       return { error: "no gifteeGameAccountUUID set" };
//     }

//     if (typeof value === "undefined") {
//       value = true;
//     }

//     // gifter first
//     let gameAccountUUID = await getGameAccountUUID(user);
//     if (gameAccountUUID.error) {
//       return { error: "no API key set" };
//     }

//     let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

//     let gifteeDoc = eventDoc
//       .collection(CollectionTypes.EVENTS__PARTICIPANTS)
//       .doc(gifteeGameAccountUUID);

//     let toymakerDoc = eventDoc
//       .collection(CollectionTypes.EVENTS__PARTICIPANTS)
//       .doc(gameAccountUUID);

//     let giftDoc = eventDoc.collection(CollectionTypes.EVENTS__GIFTS).doc();

//     await giftDoc
//       .set(
//         {
//           event: eventDoc,
//           initialized: new Date.toISOString(),
//           isReceived: false,
//           isSent: false,
//           isReported: false,
//           toymaker: toymakerDoc,
//           giftee: gifteeDoc
//         },
//         { merge: true }
//       )
//       .then(() => {
//         return true;
//       })
//       .catch(() => {
//         return false;
//       });

//     // giftee now, the giftee's gameAccountUUID is known
//     let gifteeStatus = await markGifteeAccount(
//       { gameAccountUUID: gifteeGameAccountUUID },
//       { field: "sent", value: value }
//     );

//     let gw2Account = await markGw2Account({
//       gifterGameAccountUUID: gameAccountUUID.success,
//       field: "sent",
//       value: value
//     });

//     // check result and return to frontend
//     if (entryResult && gifteeStatus.success && gw2Account.success) {
//       return { success: "Successfully marked sent" };
//     } else {
//       return { error: "Error in marking sent" + gifteeStatus };
//     }
//   }
// );

module.exports = {
  getGifts,
  updateGiftSentStatus,
  updateGiftReceivedStatus,
  updateGiftReportedStatus
};
