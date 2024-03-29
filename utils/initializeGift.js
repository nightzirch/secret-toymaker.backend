const admin = require("firebase-admin");
require("firebase/firestore");
const { db } = require("../config/firebase");
const CollectionTypes = require("../utils/types/CollectionTypes");

/**
 * sets up a gift with gameAccountUUID for both toymaker and giftee
 * @inner
 * @param {string} toymakerGameAccountUUID - UUID of the toymaker
 * @param {string} gifteeGameAccountUUID - UUID of the giftee
 * @param {bool} isPrimary - Is this the primary/required gift?
 * @param {string} year - Year of the event
 * @returns {Result}
 */
const initializeGift = async (
  toymakerGameAccountUUID,
  gifteeGameAccountUUID,
  isPrimary = false,
  year
) => {
  if (!toymakerGameAccountUUID) {
    return { error: "no toymakerGameAccountUUID set" };
  }

  if (!gifteeGameAccountUUID) {
    return { error: "no gifteeGameAccountUUID set" };
  }

  let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  let gifteeDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gifteeGameAccountUUID);

  let giftee = await gifteeDoc.get();

  if (!giftee.exists) {
    return { error: "Giftee does not exist." };
  }

  giftee = giftee.data();

  let toymakerDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(toymakerGameAccountUUID);

  let giftDoc = eventDoc.collection(CollectionTypes.EVENTS__GIFTS).doc();

  let isGiftInitialized = await giftDoc
    .set({
      event: eventDoc,
      initialized: new Date().toISOString(),
      isPrimary,
      received: null,
      sent: null,
      reported: false,
      toymaker: toymakerDoc,
      toymakerGameAccountUUID,
      giftee: gifteeDoc,
      gifteeGameAccountUUID,
      notes: giftee.notes,
    })
    .then(() => true)
    .catch(() => false);

  let isToymakerGiftInitialized = await toymakerDoc
    .update({
      outgoingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc),
    })
    .then(() => true)
    .catch(() => false);

  let isGifteeGiftInitialized = await gifteeDoc
    .update({
      incomingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc),
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

/**
 * Updates a batch with data about initial gifts
 * @inner
 * @param {object} batch - The batch which we'll commit later
 * @param {string} toymakerGameAccountUUID - UUID of the toymaker
 * @param {string} gifteeGameAccountUUID - UUID of the giftee
 * @param {bool} isPrimary - Is this the primary/required gift?
 * @param {string} year - Year of the event
 * @returns {object}
 */
const updateBatchWithInitialGift = async (
  batch,
  toymakerGameAccountUUID,
  gifteeGameAccountUUID,
  isPrimary = false,
  year
) => {
  if (!toymakerGameAccountUUID) {
    console.log("No toymakerGameAccountUUID set.");
    return { error: "No toymakerGameAccountUUID set." };
  }

  if (!gifteeGameAccountUUID) {
    console.log("No gifteeGameAccountUUID set.");
    return { error: "No gifteeGameAccountUUID set." };
  }

  let eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  let gifteeDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gifteeGameAccountUUID);

  let giftee = await gifteeDoc.get();
  giftee = giftee.data();

  let toymakerDoc = eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(toymakerGameAccountUUID);

  let giftDoc = eventDoc.collection(CollectionTypes.EVENTS__GIFTS).doc();

  let giftData = {
    event: eventDoc,
    initialized: new Date().toISOString(),
    isPrimary,
    received: null,
    sent: null,
    reported: false,
    toymaker: toymakerDoc,
    toymakerGameAccountUUID,
    giftee: gifteeDoc,
    gifteeGameAccountUUID,
    notes: giftee.notes,
  };

  let gifteeData = {
    incomingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc),
  };

  let toymakerData = {
    outgoingGifts: admin.firestore.FieldValue.arrayUnion(giftDoc),
  };

  batch.set(giftDoc, giftData);
  batch.update(gifteeDoc, gifteeData);
  batch.update(toymakerDoc, toymakerData);

  return { sucess: "Successfully updated batch." };
};

module.exports = { initializeGift, updateBatchWithInitialGift };
