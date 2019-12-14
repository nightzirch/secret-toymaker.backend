const CollectionTypes = require("../utils/types/CollectionTypes")

/*
This is for when folks decide to participate, sets up the required values
*/
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { EVENT } = require("../config/constants");
const db = require('../config/db');
const { getGw2Account, getUUID } = require('../utils/utils');

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
   * @param {string} [data.note] - Note for teh gifter
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async ({user, participate, note}, context) => {
    let uuid = await getUUID(user)
    if (uuid.error) {return { error: "no API key set" }}
    uuid = uuid.success

    if (!participate) {
      // user wishes to undo their participation

      let deleteDoc = await db.collection(CollectionTypes.EVENTS).doc(EVENT).collection(CollectionTypes.EVENTS__PARTICIPANTS).doc(uuid).delete().then(() => {return true}).catch(() => {return false})
      let counter = await db.collection(CollectionTypes.EVENTS).doc(EVENT).set({ participants: admin.firestore.FieldValue.increment(-1) }, { merge: true }).then(() => {return true}).catch(() => {return false});

      // its now an entry in a collection, so remove that
      let eventEntry = await db.collection(CollectionTypes.GW2_ACCOUNTS).doc(uuid).collection(CollectionTypes.GW2_ACCOUNTS__EVENTS).doc(EVENT).delete().then(() => {return true}).catch(() => {return false})

      if (deleteDoc && counter && eventEntry) {
        return { success: "Successfully removed" }
      } else {
        return { error: "Error removing participant" }
      }
    }

    // check if already exists
    let currentValueRaw = await db.collection(CollectionTypes.EVENTS).doc(EVENT).collection(CollectionTypes.EVENTS__PARTICIPANTS).doc(uuid).get()
    if (currentValueRaw.exists) {return { success: "Already added" }}

    let gameAccount = await getGw2Account(uuid)

    let entryDate = new Date().toISOString()
    // use uuid to set teh game accoutn for entry
    let entry = {
      participant: uuid,
      entered: entryDate,
      note: note,

      // this marks if they have sent their own gift
      sent_own: false,

      // these manage the status of this persons gift
      sent: false,
      received: false,
      reported: false,

      // these manage who is gifting to them and who they are gifting to
      giftee: null,
      gifter: null,

      // add this here, will save a call later
      name: gameAccount.success.id,
      // mark if the account is F2P
      freeToPlay: gameAccount.success.freeToPlay
    }

    // adding the user to participants so tehy can get a match
    let entryResult = await db.collection(CollectionTypes.EVENTS).doc(EVENT).collection(CollectionTypes.EVENTS__PARTICIPANTS).doc(uuid).set(entry).then(() => {return true}).catch(() => {return false})
    // inrecing teh counter for global stats
    let counter = await db.collection(CollectionTypes.EVENTS).doc(EVENT).set({ participants: admin.firestore.FieldValue.increment(1) }, { merge: true }).then(() => {return true}).catch(() => {return false})
    // adding to teh gw2 account record
    let eventEntry = await db.collection(CollectionTypes.GW2_ACCOUNTS).doc(uuid).collection(CollectionTypes.GW2_ACCOUNTS__EVENTS).doc(EVENT).set({ entered: entryDate, uuid: uuid }, { merge: true }).then(() => {return true}).catch(() => {return false})

    // check result and return to frontend
    if (entryResult && counter && eventEntry) {
      return { success: "Successfully added" }
    } else {
      return { error: "Error entering participant" }
    }
  })

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
  async ({user}, context) => {
    let uuid = await getUUID(user)
    if (uuid.error) {return { error: "no API key set" }}

    let events = await db.collection(CollectionTypes.GW2_ACCOUNTS).doc(uuid.success).collection(CollectionTypes.GW2_ACCOUNTS__EVENTS).get()
    if (events.empty) {return {success: [] }}

    let result = []

    events.forEach(doc => {
      let event = doc.data()
      result.push({
        year: doc.id,
        entered: event.entered,
        uuid: event.uuid,
        sent: event.sent || 0,
        marked_received: event.marked_received || 0,
        received: event.received || 0,
        reported: event.reported || 0,
      })
    })

    return { success: result }
  })
module.exports = { participate, participateStatus }