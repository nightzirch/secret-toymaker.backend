require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const db = require("../config/db");
const { EVENT } = require("../config/constants");

const { initializeGift } = require("./initializeGift");

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
    return { error: "No valid users" };
  }

  let gifteeToymakerRelation = {};
  let allParticipantsData = [];

  let tmp = {};

  allParticipants.forEach(doc => {
    let data = doc.data();
    allParticipantsData.push(data);
  });

  if (allParticipantsData.length === 0) {
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

    let randomInt = Math.floor(Math.random() * tempArray.length);
    let gifteeGameAccountUUID = possibleGiftees[randomInt].gameAccountUUID;
    gifteeToymakerRelation[gifteeGameAccountUUID] = toymakerGameAccountUUID;
  });

  Promise.all(
    Object.keys(gifteeToymakerRelation).map(gifteeGameAccountUUID => {
      const toymakerGameAccountUUID =
        gifteeToymakerRelation[gifteeGameAccountUUID];
      return initializeGift(
        toymakerGameAccountUUID,
        gifteeGameAccountUUID,
        true
      );
    })
  )
    .then(() => {
      return { success: "All users matched successfully." };
    })
    .catch(() => {
      return { error: "Error while matching." };
    });
};

module.exports = {
  matchAllParticipants
};
