const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");
const { updateAccountData } = require("../utils/api");

/**
 * @namespace updateAllGameAccounts
 * @return {updateAllGameAccounts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const updateAllGameAccounts = functions
  .runWith({ timeoutSeconds: 540 }) // Timeout: 9 minutes
  .pubsub.schedule("0 * * * *")
  .onRun(
    // const updateAllGameAccounts = functions.https.onCall(
    /**
     * Updates all accounts with fresh data from the GW2 API
     * @inner
     * @returns {undefined}
     */
    async () => {
      // We want to update all gameAccounts that haven't been updated in a month
      const cutoffDate = new Date();
      // cutoffDate.setDate(cutoffDate.getDate() - 30);

      const allGameAccountsSnapshot = await db
        .collection(CollectionTypes.GAME_ACCOUNTS)
        .where("lastValid", "<", cutoffDate.toISOString())
        .get();
      if (allGameAccountsSnapshot.empty) {
        console.log("There are no gameAccounts that needs to be updated.");
        return { success: "There are no gameAccounts that needs to be updated." };
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
