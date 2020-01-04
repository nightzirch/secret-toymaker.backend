const CollectionTypes = require("../utils/types/CollectionTypes");

const functions = require("firebase-functions");
require("firebase/firestore");
const { getGw2Account } = require("../utils/utils");
const { EVENT } = require("../config/constants");
const { db } = require("../config/firebase");
const rp = require("request-promise-native");

const fixF2PStatus = functions.pubsub
  .schedule("0 0 1 1 *")
  .onRun(async context => {
    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);

    // get all users that have the f2p flag
    let allParticipants = await eventDoc
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .where("isFreeToPlay", "==", true)
      .get();

    // grab their api key and run it through again
    let allParticipantsData = [];

    allParticipants.forEach(doc => {
      allParticipantsData.push(doc.data());
    });

    for (let i = 0; i < allParticipantsData.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      let gameAccount = await getGw2Account(
        allParticipantsData[i].gameAccountUUID
      );
      if (gameAccount.success) {
        // pass the key to the function
        // eslint-disable-next-line no-await-in-loop
        await updateF2P(gameAccount.success.apiToken);
      }
    }
  });

async function updateF2P(apiToken) {
  let url =
    "https://api.guildwars2.com/v2/account?v=2019-11-18T00:00:00Z&access_token=" +
    apiToken;
  let accountData = await rp({ url: url, resolveWithFullResponse: true })
    .then(response => {
      return { headers: response.headers, body: response.body };
    })
    .catch(error => {
      return { error: error };
    });

  if (accountData.error) {
    // Somethign went wrong went wrong

    if (accountData.error.statusCode === 401) {
      return { error: "API key does not have access" };
    }
    if (accountData.error.statusCode === 404) {
      return { error: "Link not found" };
    }
    return { error: "Unable to get data" };
  }

  // result is json so format it
  let result = JSON.parse(accountData.body);

  // figure pout if the person is F2P
  let isFreeToPlay =
    result.access.indexOf("PlayForFree") !== -1 && result.access.length === 1;

  // get gameAccountUUID
  let gameAccountUUID = result.id;

  // update the data to gw2Accounts collection
  await db
    .collection(CollectionTypes.GAME_ACCOUNTS)
    .doc(gameAccountUUID)
    .set(
      {
        lastValid: new Date().toISOString(),
        isFreeToPlay,
        id: result.name
      },
      { merge: true }
    )
    .catch(err => {
      console.log(err);
      return { error: "Failed to update gameaccount document.", trace: err };
    });

  // update the data to participant collection
  await db
    .collection(CollectionTypes.EVENTS)
    .doc(EVENT)
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gameAccountUUID)
    .set(
      {
        isFreeToPlay
      },
      { merge: true }
    )
    .catch(err => {
      console.log(err);
      return { error: "Failed to update participation document.", trace: err };
    });

  // return that is is a success
  return { success: "API key added" };
}

module.exports = {
  fixF2PStatus
};
