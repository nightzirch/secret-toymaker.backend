/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require('firebase-functions');
require('firebase/firestore');
const { getGeneralQueries } = require('../utils/utils');
const { EVENT } = require("../config/constants");
const db = require('../config/db');

/**
 * @namespace getNotSent
 * @return {getNotSent~inner} - the returned function
 */
const getNotSent = functions.https.onCall(
  /**
   * Gets a list of gifts not sent
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async({skip, limit}, context) => {
  return {success: await getGeneralQueries('sent_own', '==', false, skip, limit)}
})

/**
 * @namespace getNotReceived
 * @return {getNotReceived~inner} - the returned function
 */
const getNotReceived = functions.https.onCall(
  /**
   * Gets a list of gifts not recieved
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async({skip, limit}, context) => {
  return {success: await getGeneralQueries('received', '==', false, skip, limit)}
})

/**
 * @namespace getReported
 * @return {getReported~inner} - the returned function
 */
const getReported = functions.https.onCall(
  /**
   * Gets a list of gifts that are reported
   * @inner
   * @param {object} data
   * @param {number} data.skip - number of entries to skip
   * @param {number} data.limit - number of entries to return
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async({skip, limit}, context) => {
  return {success: await getGeneralQueries('reported', '==', true, skip, limit)}
})

/**
 * @namespace getStats
 * @return {getStats~inner} - the returned function
 */
const getStats = functions.https.onCall(
  /**
   * Gets global stats for teh current event
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {Result}
   */
  async(context) => {
  let statsRaw = await db.collection('events').doc(EVENT).get()
  if (!statsRaw.exists) {return {error: "no statsr"}}
  return {success: statsRaw.data()}
})


module.exports = {
  getStats,
  // the admin stuff
  getNotSent, getNotReceived, getReported,
}