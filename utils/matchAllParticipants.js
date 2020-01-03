require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");
const { EVENT } = require("../config/constants");

const {
  initializeGift,
  updateBatchWithInitialGift
} = require("./initializeGift");
const { setMatchingBegun, setMatchingDone } = require("./matching");

/**
 * This is the functions that matches everyone together for the initial round
 * @returns {Result}
 */
const matchAllParticipants = async () => {
  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

  // this will run once manually
  let allParticipants = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .where("isFreeToPlay", "==", false)
    .get();

  if (allParticipants.empty) {
    await setMatchingBegun(false);
    await setMatchingDone(false);
    return { error: "No valid users" };
  }

  let gifteeToymakerRelation = {};
  let allParticipantsData = [];

  allParticipants.forEach(doc => {
    let data = doc.data();
    allParticipantsData.push(data);
  });

  if (allParticipantsData.length === 0) {
    await setMatchingBegun(false);
    await setMatchingDone(false);
    return { error: "No valid users" };
  }

  // Working our way chronnologically through all participants.
  // The first in the array will be the toymaker.
  allParticipantsData.forEach(participantData => {
    let toymakerGameAccountUUID = participantData.gameAccountUUID;

    let possibleGiftees = allParticipantsData.filter(
      user =>
        user.gameAccountUUID !== toymakerGameAccountUUID &&
        !gifteeToymakerRelation[user.gameAccountUUID]
    );

    let randomInt = Math.floor(Math.random() * possibleGiftees.length);
    let gifteeGameAccountUUID = possibleGiftees[randomInt].gameAccountUUID;
    gifteeToymakerRelation[gifteeGameAccountUUID] = toymakerGameAccountUUID;
  });

  let batch = db.batch();

  await Promise.all(
    Object.keys(gifteeToymakerRelation).map(async gifteeGameAccountUUID => {
      const toymakerGameAccountUUID =
        gifteeToymakerRelation[gifteeGameAccountUUID];

      await updateBatchWithInitialGift(
        batch,
        toymakerGameAccountUUID,
        gifteeGameAccountUUID,
        true
      );
    })
  );

  const result = await batch
    .commit()
    .then(() => {
      return { success: "All users matched successfully." };
    })
    .catch(e => {
      return { error: "Error while matching.", trace: e };
    });

  return result;
};

module.exports = {
  matchAllParticipants
};
