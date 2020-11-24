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

module.exports = { onUserCreated };
