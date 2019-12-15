const admin = require("firebase-admin");
require("firebase/firestore");
const db = require("../config/db");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");

/**
 * sets up a gift with gameAccountUUID for both toymaker and giftee
 * @inner
 * @param {string} toymakerGameAccountUUID - UUID of the toymaker
 * @param {string} gifteeGameAccountUUID - UUID of the giftee
 * @param {bool} isPrimary - Is this the primary/required gift?
 * @returns {Result}
 */
const initializeGift = async (toymakerGameAccountUUID, gifteeGameAccountUUID, isPrimary = false) => {
  if (!toymakerGameAccountUUID) {
    return { error: "no toymakerGameAccountUUID set" };
  }

  if (!gifteeGameAccountUUID) {
    return { error: "no gifteeGameAccountUUID set" };
  }

  let eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

  let gifteeDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gifteeGameAccountUUID);

  let toymakerDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(toymakerGameAccountUUID);

  let giftDoc = eventDoc.collection(CollectionTypes.EVENTS__GIFTS).doc();

  let isGiftInitialized = await giftDoc
    .set({
      event: eventDoc,
      initialized: new Date.toISOString(),
      isPrimary,
      received: null,
      sent: null,
      reported: false,
      toymaker: toymakerDoc,
      giftee: gifteeDoc
    })
    .then(() => true)
    .catch(() => false);

  let isToymakerGiftInitialized = await toymakerDoc
    .update({
      outgoingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc)
    })
    .then(() => true)
    .catch(() => false);

  let isGifteeGiftInitialized = await gifteeDoc
    .update({
      incomingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc)
    })
    .then(() => true)
    .catch(() => false);

  // check result and return to frontend
  if (
    isGiftInitialized &&
    isToymakerGiftInitialized &&
    isGifteeGiftInitialized
  ) {
    return { success: "Successfully initialized" };
  } else {
    return { error: "Error initializing" };
  }
};

module.exports = { initializeGift };
