const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");

/**
 * @namespace updateAllGameAccounts
 * @return {updateAllGameAccounts~inner} - returns a scheduled function that runs midnight first day of the year
 */
const updateMismatchedAccountIds = functions
  .runWith({ timeoutSeconds: 540 }) // Timeout: 9 minutes
  .pubsub.schedule("0 0 1 1 *")
  .onRun(
    /**
     * Finds and updates all participations where the id from gameAccount is mismatching
     * @inner
     * @returns {undefined}
     */
    async () => {
      const allGameAccountsSnapshot = await db
        .collection(CollectionTypes.GAME_ACCOUNTS)
        .get();

      if (allGameAccountsSnapshot.empty) {
        console.log("There are no gameAccounts that needs to be updated.");
        return {
          success: "There are no gameAccounts that needs to be updated.",
        };
      }

      let errors = 0;
      let successes = 0;

      for (let gameAccountDoc of allGameAccountsSnapshot.docs) {
        const gameAccount = gameAccountDoc.data();

        for (let eventDoc of gameAccount.collection(
          CollectionTypes.GAME_ACCOUNTS__EVENTS
        ).docs) {
          const event = await eventDoc.get();
          const participationDoc = await event.participation.get();
          const participation = participationDoc.data();

          if (participation.id !== gameAccount.id) {
            console.log(
              `Mismatch between gameAccount (${gameAccount.id}) and participation (${participation.id}).`
            );
            await participationDoc
              .set({ id: gameAccount.id }, { merge: true })
              .catch((err) => {
                console.log(
                  `Error while updating ${event.name} participation for ${gameAccount.id}`,
                  err
                );
                errors += 1;
              });
          }
        }

        successes += 1;
      }

      console.log(
        `Update all game accounts finished. ${successes} successes, ${errors} errors.`
      );
      return {
        success: `Update all game accounts finished. ${successes} successes, ${errors} errors.`,
      };
    }
  );

module.exports = { updateMismatchedAccountIds };
