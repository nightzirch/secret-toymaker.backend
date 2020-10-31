const CollectionTypes = require("../utils/types/CollectionTypes");

/**
 * This manages everything account related such as:
 * - adding api keys
 * - notes
 * - getting the assigned giftees
 * - volunteering for more gifts
 */
const functions = require("firebase-functions");
const rp = require("request-promise-native");
const { db } = require("../config/firebase");
const {
  getGameAccountUUID,
  volunteerForNewGiftees
} = require("../utils/utils");
const { EVENT } = require("../config/constants");

/**
 * @namespace updateApiKey
 * @return {updateApiKey~inner} - the returned function
 */
const updateApiKey = functions.https.onCall(
  /**
   * Adds an api Key to teh account
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {string} data.apiToken - api key
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, apiToken }, context) => {
    // may tern the request into a genralised function if we get the mail endpoint, but for now it is sufficent

    // first check key
    let url =
      "https://api.guildwars2.com/v2/account?v=2019-11-18T00:00:00Z&access_token=" +
      apiToken;
    let accountData = await rp({ url: url, resolveWithFullResponse: true })
      .then(response => {
        return { headers: response.headers, body: response.body };
      })
      .catch(error => {
        return { error: error };
      });

    if (accountData.error) {
      // Somethign went wrong went wrong

      if (accountData.error.statusCode === 401) {
        return { error: "API key does not have access" };
      }
      if (accountData.error.statusCode === 404) {
        return { error: "Link not found" };
      }
      return { error: "Unable to get data" };
    }

    // result is json so format it
    let result = JSON.parse(accountData.body);

    // figure pout if the person is F2P
    let isFreeToPlay = result.access.indexOf("PlayForFree") !== -1 && result.access.length === 1;

    // get gameAccountUUID
    let gameAccountUUID = result.id;

    // add the data to gw2Accounts collection
    await db
      .collection(CollectionTypes.GAME_ACCOUNTS)
      .doc(gameAccountUUID)
      .set({
        gameAccountUUID,
        apiToken,
        lastValid: new Date().toISOString(),
        isFreeToPlay,
        id: result.name
      })
      .catch(err => console.log(err));

    await db
      .collection(CollectionTypes.TOYMAKERS)
      .doc(user)
      .set(
        {
          apiToken: apiToken,
          gameAccountUUID: gameAccountUUID,
          gameAccount: db
            .collection(CollectionTypes.GAME_ACCOUNTS)
            .doc(gameAccountUUID)
        },
        { merge: true }
      )
      .catch(err => console.log(err));

    // return that is is a success
    return { success: "API key added" };
  }
);

/**
 * @namespace assignedGiftees
 * @return {assignedGiftees~inner} - the returned function
 */
const assignedGiftees = functions.https.onCall(
  /**
   * This gets teh giftees that are assigned to a gifter
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user }, context) => {
    let gifterGameAccountUUID = await getGameAccountUUID(user);
    if (gifterGameAccountUUID.error) {
      return { error: "no API key set" };
    }
    gifterGameAccountUUID = gifterGameAccountUUID.success;

    let giftee = await db
      .collection(CollectionTypes.EVENTS)
      .doc(EVENT)
      .collection(CollectionTypes.EVENTS__PARTICIPANTS)
      .where("gifter", "==", gifterGameAccountUUID)
      .get();
    if (giftee.empty) {
      return { error: "No valid users" };
    }

    // array in case the user is sending gifts to multiple folks
    let gifteeArray = [];
    giftee.forEach(doc => {
      let gifteeData = doc.data();

      gifteeArray.push({
        name: gifteeData.name,
        notes: gifteeData.notes,
        // used to identify the user
        gameAccountUUID: gifteeData.participant,
        // these notes the state
        sent: gifteeData.sent,
        received: gifteeData.received,
        reported: gifteeData.reported
      });
    });

    return { success: gifteeArray };
  }
);

/**
 * @namespace volunteer
 * @return {volunteer~inner} - the returned function
 */
const volunteer = functions.https.onCall(
  /**
   * This lets someone volunteer for more giftees
   * @inner
   * @param {object} data - details about the giftee
   * @param {string} data.user - user object or uid
   * @param {number} data.count - Number of new giftees they want
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({ user, count }, context) => {
    return await volunteerForNewGiftees(user, count);
  }
);

module.exports = { updateApiKey, assignedGiftees, volunteer };
