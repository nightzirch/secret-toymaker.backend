const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");
const { updateAccountData } = require("../https/gw2Accounts");

/**
 * @namespace updateAllAccountInfo
 * @return {updateAllAccountInfo~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const updateAllAccountInfo = functions.pubsub.schedule("1 * * * *").onRun(
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
      return;
    }

    // TODO: batch requests

    allGameAccountsSnapshot.forEach(async (gameAccountDoc) => {
      const gameAccount = gameAccountDoc.data();
      updateAccountData(gameAccount.apiToken);
    });
  }
);

module.exports = { updateAllAccountInfo };
