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
    let currentValueRaw = await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID)
      .get();
    if (currentValueRaw.exists) {
      return { success: "Already added" };
    }

    let gameAccount = await getGw2Account(gameAccountUUID);

    let entryDate = new Date().toISOString();
    // use gameAccountUUID to set the game account for entry

    const participation = {
      gameAccountUUID,
      entryDate,
      notes,
      id: gameAccount.success.id,
      isFreeToPlay: gameAccount.success.freeToPlay,
      year: EVENT
    };

    // adding the user to participants so tehy can get a match
    let entryResult = await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID)
      .set(participation)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });

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
      participationRefs.push(participationData.participation.get());
    });

    let result = await Promise.all(
      participationRefs.map(async docPromise => {
        const doc = await docPromise;
        let participation = doc.data();
        const { entryDate, gameAccountUUID, notes, year} = participation;

        return {
          year,
          gameAccountUUID,
          entryDate,
          notes
        };
      })
    );

    result = result.filter(e => e);

    return { success: result };
  }
);
module.exports = { participate, participateStatus };
