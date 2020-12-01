const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This manages initializing, sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require("firebase-functions");
const admin = require("firebase-admin");
require("firebase/firestore");
const { getGameAccountUUID } = require("../utils/utils");
const { db } = require("../config/firebase");
const { initializeGift } = require("../utils/initializeGift");
const { getRandomFromArray } = require("../utils/random");

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
   * @param {string} data.year - Year of the event
   * @returns {Result}
   */
  async ({ user, giftId, isSent, year }) => {
    if(!year) {
      return { error: "Missing year parameter." };
    }

    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);

    let gift = await giftDoc.get();

    if (!gift.exists) {
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

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's sent status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsSent: admin.firestore.FieldValue.increment(isSent ? 1 : -1)
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isStatsUpdated
      ? { success: "Successfully updated gift's sent status." }
      : {
          error: "Failed updating statistics."
        };
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
   * @param {string} data.year - Year of the event
   * @returns {Result}
   */
  async ({ user, giftId, isReceived, year }) => {
    if(!year) {
      return { error: "Missing year parameter." };
    }

    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);
    let gift = await giftDoc.get();

    if (!gift.exists) {
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

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's received status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsReceived: admin.firestore.FieldValue.increment(
            isReceived ? 1 : -1
          )
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully && isStatsUpdated
      ? { success: "Successfully updated gift's received status." }
      : { error: "Failed updating statistics." };
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
   * @param {string} data.reportMessage - reason for reporting
   * @param {string} data.year - Year of the event
   * @returns {Result}
   */
  async ({ user, giftId, isReporting, reportMessage, year }) => {
    if(!year) {
      return { error: "Missing year parameter." };
    }

    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

    let giftDoc = eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .doc(giftId);
    let gift = await giftDoc.get();

    if (!gift.exists) {
      return { error: `Found no gifts with id: ${giftId}` };
    }

    let isGiftUpdatedSuccessfully = giftDoc
      .set(
        {
          reported: isReporting ? new Date().toISOString() : null,
          reportMessage: isReporting ? reportMessage : null
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    if (!isGiftUpdatedSuccessfully)
      return { error: "Failed updating gift's reported status." };

    let isStatsUpdated = eventDoc
      .set(
        {
          giftsReported: admin.firestore.FieldValue.increment(
            isReporting ? 1 : -1
          )
        },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    return isGiftUpdatedSuccessfully && isStatsUpdated
      ? { success: "Successfully updated gift's reported status." }
      : { error: "Failed updating statistics." };
  }
);

/**
 * @namespace donateGift
 * @return {donateGift~inner} - the returned function
 */
const donateGift = functions.https.onCall(
  /**
   * Initializes a new donation gift
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.year - Year of the event
   * @returns {Result}
   */
  async ({ user, year }) => {
    if(!year) {
      return { error: "Missing year parameter." };
    }

    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    gameAccountUUID = gameAccountUUID.success;

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

    let participationDoc = eventDoc
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID);

    let participation = await participationDoc.get();

    if (!participation.exists) {
      return { error: "User is not participating" };
    }

    let { outgoingGifts } = participation.data();

    if (outgoingGifts && outgoingGifts.length === 0) {
      return { error: "No outgoing gifts registered." };
    }

    let allGiftsAreSentOrReceived = true;
    let allParticipantGiftees = [];
    let giftee;

    await Promise.all(
      outgoingGifts.map(async giftDoc => {
        let gift = await giftDoc.get();

        if (gift.exists) {
          gift = gift.data();
          allParticipantGiftees.push(gift.gifteeGameAccountUUID);

          /**
           * If the gift is not sent, nor received.
           * There are cases where gifts are only received, but not sent.
           * This happens when sender forgets to mark gift as sent, but receiver marks it as received.
           */
          if (!gift.sent && !gift.received) {
            allGiftsAreSentOrReceived = false;
          }
        }
      })
    );

    if (!allGiftsAreSentOrReceived) {
      return { error: "Not all outgoing gifts are sent." };
    }

    let notSentGifts = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("isPrimary", "==", true)
      .where("sent", "==", null)
      .get();

    if (notSentGifts.empty) {
      // If all primary gifts are sent, let's go for not received donations
      notSentGifts = await eventDoc
        .collection(CollectionTypes.EVENTS__GIFTS)
        .where("isPrimary", "==", false)
        .where("sent", "==", null)
        .get();
    }

    if (notSentGifts.empty) {
      // If all donation gifts are sent, let's go for a random participant
      let allParticipants = await eventDoc
        .collection(CollectionTypes.EVENTS__PARTICIPANTS)
        .where("isFreeToPlay", "==", false)
        .get();

      if (allParticipants.empty) {
        return { error: "Could not find any participants" };
      }

      let allParticipantsData = [];

      allParticipants.forEach(doc => {
        let participantData = doc.data();
        if (
          participantData.gameAccountUUID !== gameAccountUUID &&
          !allParticipantGiftees.includes(participantData.gameAccountUUID)
        ) {
          allParticipantsData.push(participantData);
        }
      });

      giftee = getRandomFromArray(allParticipantsData);
    }

    if (giftee) {
      const initializeGiftResponse = await initializeGift(
        gameAccountUUID,
        giftee.gameAccountUUID,
        false,
        year
      );

      if (initializeGiftResponse.success) {
        return { success: "Successfully updated gift's reported status." };
      } else {
        return {
          error: "Could not initialize donation gift.",
          trace: initializeGiftResponse.error
        };
      }
    }

    let allGiftsData = [];

    notSentGifts.forEach(doc => {
      let giftData = doc.data();
      let { gifteeGameAccountUUID } = giftData;
      if (
        gifteeGameAccountUUID !== gameAccountUUID &&
        !allParticipantGiftees.includes(gifteeGameAccountUUID)
      ) {
        allGiftsData.push(giftData);
      }
    });

    let randomGift = getRandomFromArray(allGiftsData);

    if (randomGift) {
      const initializeGiftResponse = await initializeGift(
        gameAccountUUID,
        randomGift.gifteeGameAccountUUID,
        false,
        year
      );

      if (initializeGiftResponse.success) {
        return { success: "Successfully updated gift's reported status." };
      } else {
        return {
          error: "Could not initialize donation gift.",
          trace: initializeGiftResponse.error
        };
      }
    }

    return { error: "Could not initialize donation gift." };
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
   * @param {string} data.year - Year of the event
   * @returns {Result}
   */
  async ({ user, year }) => {
    if(!year) {
      return { error: "Missing year parameter." };
    }
    
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }
    gameAccountUUID = gameAccountUUID.success;

    let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

    let participantDoc = eventDoc
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID);

    let incomingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("giftee", "==", participantDoc)
      .get();

    let outgoingGiftsSnapshot = await eventDoc
      .collection(CollectionTypes.EVENTS__GIFTS)
      .where("toymaker", "==", participantDoc)
      .get();

    let incomingPrimaryGift;
    let incomingGifts = [];
    let outgoingPrimaryGift;
    let outgoingGifts = [];
    let outgoingGifteesData = [];

    if (!incomingGiftsSnapshot.empty) {
      incomingGiftsSnapshot.forEach(doc => {
        let data = doc.data();

        const giftData = {
          id: doc.id,
          match: "Secret Toymaker",
          notes: data.notes,
          isPrimary: data.isPrimary,
          reported: data.reported,
          received: data.received,
          initialized: data.initialized,
          sent: data.sent,
          year
        };

        if (data.isPrimary) {
          incomingPrimaryGift = giftData;
        } else {
          incomingGifts.push(giftData);
        }
      });
    }

    if (!outgoingGiftsSnapshot.empty) {
      outgoingGiftsSnapshot.forEach(doc => {
        outgoingGifteesData.push(Object.assign({}, doc.data(), { id: doc.id }));
      });

      await Promise.all(
        outgoingGifteesData.map(async data => {
          let gifteeDoc = await data.giftee.get();

          if (gifteeDoc.exists) {
            let giftee = gifteeDoc.data();

            const giftData = {
              id: data.id,
              match: giftee.id,
              notes: data.notes,
              isPrimary: data.isPrimary,
              reported: data.reported,
              received: data.received,
              initialized: data.initialized,
              sent: data.sent,
              year
            };

            if (data.isPrimary) {
              outgoingPrimaryGift = giftData;
            } else {
              outgoingGifts.push(giftData);
            }
          }
        })
      );
    }

    return {
      success: {
        outgoingPrimary: outgoingPrimaryGift,
        outgoing: outgoingGifts,
        incomingPrimary: incomingPrimaryGift,
        incoming: incomingGifts
      }
    };
  }
);

module.exports = {
  getGifts,
  donateGift,
  updateGiftSentStatus,
  updateGiftReceivedStatus,
  updateGiftReportedStatus
};
