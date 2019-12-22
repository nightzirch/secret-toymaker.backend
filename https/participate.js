const CollectionTypes = require("../utils/types/CollectionTypes");

/*
This is for when folks decide to participate, sets up the required values
*/
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { EVENT } = require("../config/constants");
const db = require("../config/db");
const { getGw2Account, getGameAccountUUID } = require("../utils/utils");

/**
 * @namespace participate
 * @return {participate~inner} - the returned function
 */
const participate = functions.https.onCall(
  /**
   * This sets a users participation status
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {boolean} [data.participate] - true or undefined if user is entering, false if theya re withdrawing
   * @param {string} [data.notes] - Note for teh gifter
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, participate, notes }, context) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }
    gameAccountUUID = gameAccountUUID.success;

    if (!participate) {
      // user wishes to undo their participation

      let deleteDoc = await db
        .collection(CollectionTypes.EVENTS)
        .doc(EVENT)
        .collection(CollectionTypes.EVENTS__PARTICIPANTS)
        .doc(gameAccountUUID)
        .delete()
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });

      let counter = await db
        .collection(CollectionTypes.EVENTS)
        .doc(EVENT)
        .set(
          { participants: admin.firestore.FieldValue.increment(-1) },
          { merge: true }
        )
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });

      // its now an entry in a collection, so remove that
      let eventEntry = await db
        .collection(CollectionTypes.GAME_ACCOUNTS)
        .doc(gameAccountUUID)
        .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
        .doc(EVENT)
        .delete()
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });

      if (deleteDoc && counter && eventEntry) {
        return { success: "Successfully removed" };
      } else {
        return { error: "Error removing participant" };
      }
    }

    // check if already exists
    let participationDoc = db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID);

    let participationSnap = await participantDoc.get();
    if (participationSnap.exists) {
      // Already added. Let's update
      const participationUpdateResult = await participationDoc
        .update({ notes })
        .then(() => ({ success: "Successfully updated participant." }))
        .catch(error => ({ error: "Failed to update.", trace: error }));
      return participationUpdateResult;
    }

    let gameAccount = await getGw2Account(gameAccountUUID);

    let entryDate = new Date().toISOString();
    // use gameAccountUUID to set the game account for entry

    const participation = {
      gameAccountUUID,
      entryDate,
      notes,
      id: gameAccount.success.id,
      isFreeToPlay: gameAccount.success.isFreeToPlay,
      year: EVENT
    };

    // adding the user to participants so they can get a match
    let participantDoc = db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID);

    let participantSnap = await participantDoc.get();
    let entryResult;

    if (participantSnap.exists) {
      entryResult = await participantDoc
        .update(participation)
        .then(() => {
          return true;
        })
        .catch(e => {
          console.log("Error when updating participant.", e);
          return false;
        });
    } else {
      entryResult = await participantDoc
        .set(participation)
        .then(() => {
          return true;
        })
        .catch(e => {
          console.log("Error when setting participant.", e);
          return false;
        });
    }

    // inrecing teh counter for global stats
    let counter = await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .set(
        { participants: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      )
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    // adding to the gameAccount record
    let eventEntry = await db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .doc(gameAccountUUID)
      .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
      .doc(EVENT)
      .set({
        event: db.collection(CollectionTypes.EVENTS).doc(EVENT),
        participation: db
          .collection(CollectionTypes.EVENTS)
          .doc(EVENT)
          .collection(CollectionTypes.EVENTS__PARTICIPANTS)
          .doc(gameAccountUUID)
      })
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

    // check result and return to frontend
    if (entryResult && counter && eventEntry) {
      return { success: "Successfully added" };
    } else {
      return { error: "Error entering participant" };
    }
  }
);

/**
 * @namespace participateStatus
 * @return {participateStatus~inner} - the returned function
 */
const participateStatus = functions.https.onCall(
  /**
   * This get a users participation status/history
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user }, context) => {
    let gameAccountUUID = await getGameAccountUUID(user);
    if (gameAccountUUID.error) {
      return { error: "no API key set" };
    }

    let events = await db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .doc(gameAccountUUID.success)
      .collection(CollectionTypes.GAME_ACCOUNTS__EVENTS)
      .get();
    if (events.empty) {
      return { success: [] };
    }

    let participationRefs = [];

    events.forEach(doc => {
      let participationData = doc.data();
      participationRefs.push(participationData.participation);
    });

    let results = await Promise.all(
      participationRefs.map(async docPromise => {
        const doc = await docPromise.get();
        if (!doc.exists) return null;

        let participation = doc.data();
        const { entryDate, gameAccountUUID, notes, year } = participation;

        return {
          year,
          gameAccountUUID,
          entryDate,
          notes
        };
      })
    );

    results = results.filter(e => e);

    return { success: results };
  }
);
module.exports = { participate, participateStatus };
