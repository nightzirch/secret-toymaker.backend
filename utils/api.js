const rp = require("request-promise-native");
const { db } = require("../config/firebase");
const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const {
  getGameAccountUUID,
  volunteerForNewGiftees,
} = require("../utils/utils");

const fetchGameAccountFromAPI = async (apiToken) => {
  let url = "https://api.guildwars2.com/v2/account?access_token=" + apiToken;
  let accountData = await rp({ url: url, resolveWithFullResponse: true })
    .then((response) => {
      return { headers: response.headers, body: response.body };
    })
    .catch((error) => {
      return { error: error };
    });

  if (accountData.error) {
    // Something went wrong

    if (accountData.error.statusCode === 401) {
      return { error: "API key does not have access" };
    }
    if (accountData.error.statusCode === 404) {
      return { error: "Link not found" };
    }
    return { error: "Unable to get data" };
  }

  // result is json so format it
  return JSON.parse({ success: accountData.body });
};

const updateAccountData = async (apiToken) => {
  const gameAccountData = fetchGameAccountFromAPI(apiToken);
  if (gameAccountData.error) {
    return gameAccountData;
  }

  let gameAccountUUID = gameAccountData.id;

  // Reference the specific gameAccount for this UUID
  const gameAccountDoc = db
    .collection(CollectionTypes.GAME_ACCOUNTS)
    .doc(gameAccountUUID);

  // Update gameAccount collection
  await gameAccountDoc
    .set(
      {
        lastValid: new Date().toISOString(),
        id: result.name,
      },
      { merge: true }
    )
    .catch((err) => {
      console.log(err);
      return { error: err };
    });

  // Update all user's participations
  const gameAccountEventsSnapshot = await gameAccountDoc
    .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
    .get();
  if (!gameAccountEventsSnapshot.empty) {
    gameAccountEventsSnapshot.forEach(async (gameAccountEventDoc) => {
      gameAccountEvent = gameAccountEventDoc.data();
      const participationDoc = await gameAccountEvent.participation.get();

      if (participationDoc.exists) {
        await participationDoc
          .set({ id: result.name }, { merge: true })
          .catch((err) => {
            console.log({ error: err });
          });
      }
    });
  }

  // return that is is a success
  console.log(`Successfully updating account info for ${apiToken}`);
  return { success: `Account info updated for ${apiToken}` };
};

module.exports = { updateAccountData };
