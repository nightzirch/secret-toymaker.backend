const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");
const { updateAccountData } = require("../utils/api");

/**
 * @namespace updateAllGameAccounts
 * @return {updateAllGameAccounts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const updateAllGameAccounts = functions.pubsub.schedule("40 * * * *").onRun(
// const updateAllGameAccounts = functions.https.onCall(
  /**
   * Updates all accounts with fresh data from the GW2 API
   * @inner
   * @returns {undefined}
   */
  async () => {
    const allGameAccountsSnapshot = await db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .get();
    if (allGameAccountsSnapshot.empty) {
      console.log("There are no gameAccounts in the database");
      return { success: "There are no gameAccounts in the database" };
    }

    // TODO: batch requests

    for (let gameAccountDoc of allGameAccountsSnapshot.docs) {
      const gameAccount = gameAccountDoc.data();
      await updateAccountData(gameAccount);
    }

    console.log("Update all game accounts finished.");
    return { success: "Update all game accounts finished." };
  }
);

module.exports = { updateAllGameAccounts };
