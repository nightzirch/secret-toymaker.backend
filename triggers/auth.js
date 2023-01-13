const admin = require("firebase-admin");
const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { db } = require("../config/firebase");
const Toymaker = require("../models/Toymaker");
const { classToPlain } = require("class-transformer");

/**
 * @namespace onUserCreated
 * @return {onUserCreated~inner} - the returned function
 */
const onUserCreated = functions.auth.user().onCreate(
  /**
   * Creates a Toymaker entry in the database for the created user
   * @inner
   * @param {object} user - User data
   */
  async (user) => {
    const { uid } = user;
    const toymakerDoc = db.collection(CollectionTypes.TOYMAKERS).doc(uid);
    const toymakerSnap = await toymakerDoc.get();

    // Making sure there is no entry already
    if (!toymakerSnap.exists) {
      // Creating a Toymaker model from the user data.
      // Since Firestore don't accept class instances, we need to convert to plain object.
      const userObj = classToPlain(Toymaker.fromData(user));

      // Storing the Toymaker model in the database
      toymakerDoc.set(userObj);
    }
  }
);

/**
 * @namespace onUserDeleted
 * @return {onUserDeleted~inner} - the returned function
 */
const onUserDeleted = functions.auth.user().onDelete(
  /**
   * Deletes the following fields of personal data about a user:
   *
   * toymaker
   *  - apiToken
   *  - consents
   *  - email
   *  - name
   *  - providers
   *
   * gameAccount
   *  - apiToken
   *  - id
   *
   * participation
   *  - id
   *  - notes
   *
   * gift
   *  - notes
   *
   * @inner
   * @param {object} user - User data
   */
  async (user) => {
    const { uid } = user;
    const toymakerDoc = db.collection(CollectionTypes.TOYMAKERS).doc(uid);
    const toymakerSnap = await toymakerDoc.get();
    const batch = db.batch();

    // Making sure we have a toymaker
    if (!toymakerSnap.exists) {
      // No toymaker document found. This should never happen, but looks like we're done
      console.log(`No toymaker document found with ID ${uid}`);
      return;
    }

    const toymakerData = toymakerSnap.data();

    // Queue deletion of data from Toymaker document
    batch.update(toymakerDoc, {
      apiToken: admin.firestore.FieldValue.delete(),
      consents: admin.firestore.FieldValue.delete(),
      email: admin.firestore.FieldValue.delete(),
      name: admin.firestore.FieldValue.delete(),
      providers: admin.firestore.FieldValue.delete(),
    });

    const gameAccountDoc = db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .doc(toymakerData.gameAccountUUID);
    const gameAccountSnap = await gameAccountDoc.get();

    // Making sure we have a toymaker
    if (!gameAccountSnap.exists) {
      // No gameAccount document found. This should only happen if they never applied their API token.
      console.log(
        `GameAccount document not found for UUID ${toymakerData.gameAccountUUID}`
      );
      return;
    }

    // Queue deletion of data from GameAccount document
    batch.update(gameAccountDoc, {
      apiToken: admin.firestore.FieldValue.delete(),
      id: admin.firestore.FieldValue.delete(),
    });

    // Delete data from participation and gift documents
    const gameAccountEventsSnap = await gameAccountDoc
      .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
      .get();

    if (!gameAccountEventsSnap.empty) {
      await gameAccountEventsSnap.forEach(async (gameAccountEventDoc) => {
        const { participation: participationDoc } = gameAccountEventDoc.data();
        const participationSnap = await participationDoc.get();

        // Stop if Participation document doesn't exist
        if (!participationSnap.exists) {
          console.log(
            `Participation document not found for id ${gameAccountEventDoc.id}`
          );
          return;
        }

        const participationData = participationSnap.data();

        // Queue deletion of data from participation document
        batch.update(participationDoc, {
          id: admin.firestore.FieldValue.delete(),
          notes: admin.firestore.FieldValue.delete(),
        });

        await participationData.incomingGifts.forEach(
          async (incomingGiftDoc) => {
            const incomingGiftSnap = await incomingGiftDoc.get();

            if (!incomingGiftSnap.exists) {
              console.log(
                `Incoming gift not found for id ${incomingGiftDoc.id}`
              );
              return;
            }

            // Queue deletion of data from gift document
            batch.update(incomingGiftDoc, {
              notes: admin.firestore.FieldValue.delete(),
            });
          }
        );
      });
    }

    await batch
      .commit()
      .then(() => {
        console.log(`All user data deleted for ${uid}.`);
        return {
          success: `All user data deleted for ${uid}.`,
        };
      })
      .catch((e) => {
        console.log(`Error while deleting user data for ${uid}.`, e);
        return {
          error: `Error while deleting user data for ${uid}.`,
          trace: e,
        };
      });

    // TODO: Add fallback values in places the now-deleted values are used.
    // E.g. "Deleted user" instead of account name in the gift card.
  }
);

module.exports = { onUserCreated, onUserDeleted };
