const rp = require("request-promise-native");
const { db } = require("../config/firebase");
const CollectionTypes = require("../utils/types/CollectionTypes");

const fetchGameAccountFromAPI = async (gameAccount) => {
  let url =
    "https://api.guildwars2.com/v2/account?access_token=" +
    gameAccount.apiToken;
  let accountData = await rp({ url: url, resolveWithFullResponse: true })
    .then((response) => {
      return { headers: response.headers, body: response.body };
    })
    .catch((error) => {
      console.log(`Error while fetching API for for ${gameAccount.id}`, error);
      return { error: error };
    });

  if (accountData.error) {
    // Something went wrong
    if (accountData.error.statusCode === 401) {
      console.log(`API key does not have access for ${gameAccount.id}`);
      return { error: `API key does not have access for ${gameAccount.id}` };
    }
    if (accountData.error.statusCode === 404) {
      console.log(`URL not found for ${gameAccount.id}`);
      return { error: `URL not found for ${gameAccount.id}` };
    }
    console.log(`Unable to get data for ${gameAccount.id}`);
    return { error: `Unable to get data for ${gameAccount.id}` };
  }

  // result is json so format it
  return { success: JSON.parse(accountData.body) };
};

const updateAccountData = async (gameAccount) => {
  const gameAccountFromApiResult = await fetchGameAccountFromAPI(gameAccount);
  if (gameAccountFromApiResult.error) {
    return gameAccountFromApiResult;
  }

  const { success: gameAccountFromApi } = gameAccountFromApiResult;

  let gameAccountUUID = gameAccountFromApi.id;

  // Reference the specific gameAccount for this UUID
  const gameAccountDoc = db
    .collection(CollectionTypes.GAME_ACCOUNTS)
    .doc(gameAccountUUID);

  if (gameAccount.id !== gameAccountFromApi.name) {
    // Mismatch between API and our data. Must update our records.
    console.log(
      `Mismatch! ${gameAccount.id} changed id to ${gameAccountFromApi.name}.`
    );

    // Update gameAccount collection
    await gameAccountDoc
      .set(
        {
          id: gameAccountFromApi.name,
          lastValid: new Date().toISOString(),
        },
        { merge: true }
      )
      .catch((err) => {
        console.log(
          `Error while updating gameAccount for ${gameAccountUUID}`,
          err
        );
        return { error: err };
      });

    // Update all user's participations
    const gameAccountEventsSnapshot = await gameAccountDoc
      .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
      .get();
    if (!gameAccountEventsSnapshot.empty) {
      gameAccountEventsSnapshot.forEach(async (gameAccountEventDoc) => {
        const gameAccountEvent = gameAccountEventDoc.data();
        const participationDoc = gameAccountEvent.participation;
        const participation = await participationDoc.get();

        if (participation.exists) {
          await participationDoc
            .set({ id: gameAccountFromApi.name }, { merge: true })
            .catch((err) => {
              console.log(
                `Error while updating participations for ${gameAccountFromApi.name}`,
                err
              );
            });
        }
      });
    }

    console.log(
      `Successfully updated gameAccount for ${gameAccountFromApi.name}`
    );
    return {
      success: `Successfully updated gameAccount id from ${gameAccount.id} to ${gameAccountFromApi.name}`,
    };
  } else {
    // Update gameAccount collection
    await gameAccountDoc
      .set(
        {
          lastValid: new Date().toISOString(),
        },
        { merge: true }
      )
      .catch((err) => {
        console.log(
          `Error while updating gameAccount for ${gameAccount.id}`,
          err
        );
        return { error: err };
      });
    console.log(`No need to update gameAccount id for ${gameAccount.id}`);
    return {
      success: `No need to update gameAccount id for ${gameAccount.id}`,
    };
  }
};

module.exports = { updateAccountData };
