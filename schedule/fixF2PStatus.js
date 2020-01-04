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
    // get all users that have the f2p flag
    let allGameAccounts = await db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .where("isFreeToPlay", "==", true)
      .get();

    // grab their api key and run it through again
    let allGameAccountsData = [];

    allGameAccounts.forEach(doc => {
      allGameAccountsData.push(doc.data());
    });

    console.log(`Updating ${allGameAccountsData.length} game accounts.`);

    for (let i = 0; i < allGameAccountsData.length; i++) {
      // eslint-disable-next-line
      await updateF2P(allGameAccountsData[i].apiToken);
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

  // update the data to participant collection, if it exists
  let participationDoc = await db
    .collection(CollectionTypes.EVENTS)
    .doc(EVENT)
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gameAccountUUID)
    .get();

  if (participationDoc.exists) {
    participationDoc
      .set(
        {
          isFreeToPlay
        },
        { merge: true }
      )
      .catch(err => {
        console.log(err);
        return {
          error: "Failed to update participation document.",
          trace: err
        };
      });
  }

  // return that is is a success
  return { success: "Successfully updated game account." };
}

module.exports = {
  fixF2PStatus
};
