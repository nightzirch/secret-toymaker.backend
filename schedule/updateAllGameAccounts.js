const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");
const { updateAccountData } = require("../utils/api");

/**
 * @namespace updateAllGameAccounts
 * @return {updateAllGameAccounts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const updateAllGameAccounts = functions
  .runWith({ timeoutSeconds: 900 }) // Timeout: 15 minutes
  .pubsub.schedule("40 * * * *")
  .onRun(
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
      let errors = 0;
      let successes = 0;

      for (let gameAccountDoc of allGameAccountsSnapshot.docs) {
        const gameAccount = gameAccountDoc.data();
        const result = await updateAccountData(gameAccount);
        if (result.error) errors += 1;
        else if (result.success) successes += 1;
      }

      console.log(
        `Update all game accounts finished. ${successes} successes, ${errors} errors.`
      );
      return {
        success: `Update all game accounts finished. ${successes} successes, ${errors} errors.`,
      };
    }
  );

module.exports = { updateAllGameAccounts };
