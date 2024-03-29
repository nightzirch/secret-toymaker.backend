require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");
const { DB_MAX_WRITE } = require("../config/constants");
const sleep = require("util").promisify(setTimeout);

const { updateBatchWithInitialGift } = require("./initializeGift");
const { setMatchingBegun, setMatchingDone } = require("./matching");

/**
 * This is the functions that matches everyone together for the initial round
 * @returns {Result}
 */
const matchAllParticipants = async (year) => {
  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  // this will run once manually
  let allParticipants = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .where("isFreeToPlay", "==", false)
    .get();

  if (allParticipants.empty) {
    await setMatchingBegun(false, year);
    await setMatchingDone(false, year);
    return { error: "No valid users" };
  }

  let gifteeToymakerRelation = {};
  let allParticipantsData = [];

  allParticipants.forEach((doc) => {
    let data = doc.data();
    allParticipantsData.push(data);
  });

  if (allParticipantsData.length === 0) {
    await setMatchingBegun(false, year);
    await setMatchingDone(false, year);
    return { error: "No valid users" };
  }

  // Working our way chronnologically through all participants.
  // The first in the array will be the toymaker.
  allParticipantsData.forEach((participantData) => {
    let toymakerGameAccountUUID = participantData.gameAccountUUID;

    let possibleGiftees = allParticipantsData.filter(
      (user) =>
        user.gameAccountUUID !== toymakerGameAccountUUID &&
        !gifteeToymakerRelation[user.gameAccountUUID]
    );

    let randomInt = Math.floor(Math.random() * possibleGiftees.length);
    let gifteeGameAccountUUID = possibleGiftees[randomInt].gameAccountUUID;
    gifteeToymakerRelation[gifteeGameAccountUUID] = toymakerGameAccountUUID;
  });

  let batches = [];
  let gifteeToymakerRelationBatches = [];
  let amountOfParticipants = Object.keys(gifteeToymakerRelation).length;
  let amountOfBatches = Math.ceil((amountOfParticipants * 3) / DB_MAX_WRITE); // We multiply by 3 since we update 3 documents per participant.
  let amountOfParticipantsPerBatch = Math.ceil(
    amountOfParticipants / amountOfBatches
  );

  console.log(
    `Amount of participants: ${amountOfParticipants}`,
    `Amount of batches: ${amountOfBatches}`,
    `Amount of participants per batch: ${amountOfParticipantsPerBatch}`
  );

  for (var i = 0; i < amountOfBatches; i++) {
    batches.push(db.batch());
    gifteeToymakerRelationBatches[i] = {};
  }

  Object.keys(gifteeToymakerRelation).forEach((gifteeGameAccountUUID, i) => {
    const toymakerGameAccountUUID =
      gifteeToymakerRelation[gifteeGameAccountUUID];
    const batchNo = Math.ceil((i + 1) / amountOfParticipantsPerBatch) - 1;

    gifteeToymakerRelationBatches[batchNo][gifteeGameAccountUUID] =
      toymakerGameAccountUUID;
  });

  const results = [];

  await Promise.all(
    gifteeToymakerRelationBatches.map(async (gtr, i) => {
      console.log(
        `Looping through batch number ${i + 1} with ${
          Object.keys(gtr).length
        } participants.`
      );

      await Promise.all(
        Object.keys(gtr).map(async (gifteeGameAccountUUID) => {
          const toymakerGameAccountUUID = gtr[gifteeGameAccountUUID];

          await updateBatchWithInitialGift(
            batches[i],
            toymakerGameAccountUUID,
            gifteeGameAccountUUID,
            true,
            year
          );
        })
      );

      results[i] = await batches[i]
        .commit()
        .then(() => {
          console.log(`All users in batch ${i + 1} matched successfully.`);
          return {
            success: `All users in batch ${i + 1} matched successfully.`,
          };
        })
        .catch((e) => {
          console.log(e);
          return { error: "Error while matching batch.", trace: e };
        });

      // Sleeping for 1 second due to Firebase restrictions of writes per second
      await sleep(1000);
    })
  );

  let result = { success: "All users matched successfully." };

  results.forEach((r) => {
    if (r.error) {
      result = { error: "Error while matching.", trace: r.error };
    }
  });

  return result;
};

module.exports = {
  matchAllParticipants,
};
