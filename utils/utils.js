require("firebase/firestore");
const admin = require("firebase-admin");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");

/**
 * This is the result object I use that standardises it and allows me to check if it is a success
 * @typedef {Object} Result
 * @property {string} [success] - Returned if the function is successful
 * @property {string} [error] - Returned if the function fails, contains teh reason for failure
 */
const getCurrentEvent = async () => {
  const events = await db.collection(CollectionTypes.EVENTS).get();
  if (events.empty) {
    return { error: "No events currently active" };
  }
  let currentEvent;

  events.forEach(doc => {
    if (!currentEvent) {
      const event = doc.data();
      const signupStart = event.signupStart.toDate();
      const eventEnd = event.eventEnd.toDate();
      const now = new Date();

      if (signupStart < now && now < eventEnd) {
        currentEvent = event;
      }
    }
  });

  return currentEvent;
};

/**
 * This is the result object I use that standardises it and allows me to check if it is a success
 * @typedef {Object} Result
 * @param {string} year - Year of the event
 * @property {string} [success] - Returned if the function is successful
 * @property {string} [error] - Returned if the function fails, contains teh reason for failure
 */
const getEvent = async (year) => {
  const ref = db.collection(CollectionTypes.EVENTS).doc(year);
  const doc = await ref.get();
  
  if (!doc.exists) {
    return { error: `Cannot find event for year ${year}` };
  }

  const data = doc.data();
  const event = Event.fromData(data);

  return { success: event };
};

/**
 * This takes a user object or uid and returns the gameAccountUUID
 * @param {string} user - user object or uid
 * @returns {Result}
 */
const getGameAccountUUID = async user => {
  // this is the uid, but cna accept the user object as well
  if (user.uid) {
    user = user.uid;
  }

  let userAccount = await db
    .collection(CollectionTypes.TOYMAKERS)
    .doc(user)
    .get();
  if (!userAccount.exists) {
    return { error: "No such user" };
  }

  // get the user to get teh gameAccountUUID
  let userDetails = userAccount.data();
  if (!userDetails.gameAccountUUID) {
    return { error: "No API Key set" };
  }

  let gameAccountUUID = userDetails.gameAccountUUID;
  return { success: gameAccountUUID };
};

/**
 * This takes a UUID and returns the Gw2 account details
 * @param {string} gameAccountUUID - Takes gameAccountUUID and returns the gw2 account
 * @returns {Result}
 */
const getGw2Account = async gameAccountUUID => {
  let userAccount = await db
    .collection(CollectionTypes.GAME_ACCOUNTS)
    .doc(gameAccountUUID)
    .get();
  if (!userAccount.exists) {
    return { error: "No such giftee" };
  }
  // get the user to get teh gameAccountUUID
  return { success: userAccount.data() };
};

/**
 * This queries teh database for folks who's participation matches the parameters specified
 * @param {string} field - Field to search on: sent_own, received, reported
 * @param comparison - The comparison can be <, <=, ==, >, >=, array-contains, in, or array-contains-any
 * @param value - This is the value to search for, in most cases it will be boolean
 * @param {number} [skip=0] - For pagination
 * @param {number} [limit=100] - For Pagination
 * @param {string} year - Year of the event
 * @returns {array} - An array of participation entries
 */
async function getGeneralQueries(field, comparison, value, skip, limit, year) {
  //if(typeof skip === "undefined"){skip = 0}
  //if(typeof limit === "undefined"){limit = 100}
  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  let result = [];
  let results = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .where(field, comparison, value)
    //.startAt(skip).limit(limit)
    .get();

  if (results.empty) {
    return result;
  }

  results.forEach(doc => {
    result.push(doc.data());
  });

  return result;
}

/**
 * This is used to allow a person to volunteer for n new giftees where n is 1-10
 * @param {string} user - This is the giftee's uid or user object
 * @param {object} count - Number of (new) Giftees teh Gifter is volunteering for
 * @param {string} year - Year of the event
 * @returns {Result}
 */
const volunteerForNewGiftees = async (user, count, year) => {
  let gameAccountUUID = await getGameAccountUUID(user);
  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  if (gameAccountUUID.error) {
    return { error: gameAccountUUID.error };
  }
  gameAccountUUID = gameAccountUUID.success;

  // check to see if said user has sent their initial gift
  let sent = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gameAccountUUID)
    .get();

  if (sent.empty) {
    return { error: "has not sent initial gift" };
  }

  // normalise the quantities, just in case its spoofed
  if (!count) {
    count = 1;
  } else if (count > 10) {
    count = 1;
  } else if (count < 1) {
    count = 1;
  }

  // now get list of peoople who havent gotten a goft
  let noGift = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .where("received", "==", false)
    .get();

  if (noGift.empty) {
    return { error: "has not sent initial gift" };
  }

  // now loop through
  // anyone who didnt (mark) send themselves is disqualified

  let resultsArray = [];

  noGift.forEach(doc => {
    let data = doc.data();
    if (
      // check to see if they themselves have sent their gift
      data.sent_own &&
      // these are to check if if the user is already on a send list
      !data.second &&
      !data.third
    ) {
      resultsArray.push(data);
    }
  });

  // batch the updates together
  let batch = db.batch();
  for (let i = 0; i < resultsArray.length; i++) {
    // only need to do up to the specified quantity
    if (i >= count) break;
    // update said user accounts with new gifter
    let reference = eventDoc
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(resultsArray[i].participant);

    // this onlky needs a monor change to setup teh third round of gifting
    let changes = { gifter: gameAccountUUID, second: true };
    batch.update(reference, changes);
  }

  // commit the batch update
  await batch.commit();

  // return the result after the database stuff is complete
  return { success: "Please refresh the giftee list" };
};

/**
 * This marks the giftee's account with the appropriate flags, only if its not already set.
 * @param {object} giftee - details about the giftee
 * @param {string} [giftee.gameAccountUUID] - UUID of the giftee, if you do not know it
 * @param {string} [giftee.user] - If the UUID is unknown this is the giftee's uid or user object
 * @param {object} update - details about the giftee
 * @param {string} update.field - What part to mark: sent, received, reported
 * @param {string} [update.message] - If reporting allow a message
 * @param {boolean} [update.value] - If reporting allow a message
 * @param {string} year - Year of the event
 * @returns {Result}
 */
async function markGifteeAccount(
  { gameAccountUUID, user },
  { field, message, value },
  year
) {
  // if someone is marking the gift sent they know the gameAccountUUID of the giftee
  if (!gameAccountUUID) {
    if (!user) {
      return { error: "no uuid or user requested" };
    }

    // if the gameAccountUUID is undefined then take the user, search for teh account related and return that gameAccountUUID
    let tmp_uuid = await getGameAccountUUID(user);
    if (tmp_uuid.error) {
      return { error: "no API key set" };
    }
    gameAccountUUID = tmp_uuid.success;
  }

  // checking teh field
  if (!field) {
    return { error: "no field defined" };
  }
  if (field !== "sent" && field !== "received" && field !== "reported") {
    return { error: "field is not one of the defined types" };
  }

  if (typeof value === "undefined") {
    value = true;
  }

  const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);

  let currentValueRaw = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gameAccountUUID)
    .get();
    
  if (!currentValueRaw.exists) {
    return { error: "no such user" };
  }
  let currentValue = currentValueRaw.data();
  if (value === currentValue[field]) {
    return { success: "Value already set" };
  }

  let tmp = {};
  tmp[field] = value;
  if (message) {
    tmp.report = message;
  }

  let entryResult = await eventDoc
    .collection(CollectionTypes.EVENTS__PARTICIPANTS)
    .doc(gameAccountUUID)
    .set(tmp, { merge: true })
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });

  let tmp2 = {};
  tmp2[field] = admin.firestore.FieldValue.increment(value ? 1 : -1);
  let entryResult2 = await eventDoc
    .set(tmp2, { merge: true })
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });

  // check result and return to frontend
  if (entryResult && entryResult2) {
    return { success: "Successfully marked " + field };
  } else {
    return {
      error: "Error in marking " + field,
      entryResult: entryResult,
      entryResult2: entryResult2
    };
  }
}

/**
 * Records stats on a per user basis
 * @param {object} details - details about the giftee
 * @param {string} [details.gifterGameAccountUUID] - UUID of the giftee, if you do not know it
 * @param {string} [details.user] - If the UUID is unknown this is the giftee's uid or user object
 * @param {string} details.field - What part to mark: sent, received, reported
 * @param {boolean} details.value - If reporting allow a message
 * @param {string} year - Year of the event
 * @returns {Result}
 */
async function markGw2Account({ gifterGameAccountUUID, user, field, value }, year) {
  // gifter owns teh record

  if (!gifterGameAccountUUID) {
    if (!user) {
      return { error: "no gifterGameAccountUUID or user requested" };
    }

    let gameAccountUUID = getGameAccountUUID(user);
    let entryResult = await db
      .collection(CollectionTypes.EVENTS)
      .doc(year)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .doc(gameAccountUUID.success)
      .get()
      .data();
    gifterGameAccountUUID = entryResult.gifter;

    if (field === "received") {
      let tmp0 = {};
      tmp0[field] = admin.firestore.FieldValue.increment(value ? 1 : -1);
      await db
        .collection(CollectionTypes.GAME_ACCOUNTS)
        .doc(gameAccountUUID.success)
        .collection(CollectionTypes.EVENTS)
        .doc(year)
        .set(tmp0, { merge: true })
        .then(() => {
          return true;
        })
        .catch(() => {
          return false;
        });

      // set teh field for teh gifter account
      field = "marked_received";
    }
  }

  let tmp = {};
  tmp[field] = admin.firestore.FieldValue.increment(value ? 1 : -1);

  let eventEntry = await db
    .collection(CollectionTypes.GAME_ACCOUNTS)
    .doc(gifterGameAccountUUID)
    .collection(CollectionTypes.EVENTS)
    .doc(year)
    .set(tmp, { merge: true })
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
  // check result and return

  if (eventEntry) {
    return { success: "Successfully marked " + field };
  } else {
    return { error: "Error in marking " + field };
  }
}

module.exports = {
  getCurrentEvent,
  getEvent,
  getGameAccountUUID,
  getGw2Account,
  getGeneralQueries,
  volunteerForNewGiftees,
  markGifteeAccount,
  markGw2Account
};
