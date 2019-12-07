/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require('firebase-functions');
require('firebase/firestore');
const { getGeneralQueries } = require('../utils/utils');
const { EVENT } = require("../config/constants");
const db = require('../config/db');


// returns list of folks who have not sent
const getNotSent = functions.https.onCall(async({skip, limit}, context) => {
  return {success: await getGeneralQueries('sent_own', '==', false, skip, limit)}
})

// returns list of folks who have not recieved
const getNotReceived = functions.https.onCall(async({skip, limit}, context) => {
  return {success: await getGeneralQueries('received', '==', false, skip, limit)}
})

// returns list of users that have been reported
const getReported = functions.https.onCall(async({skip, limit}, context) => {
  return {success: await getGeneralQueries('reported', '==', true, skip, limit)}
})

// gets the stats for the event
const getStats = functions.https.onCall(async(context) => {
  let statsRaw = await db.collection('events').doc(EVENT).get()
  if (!statsRaw.exists) {return {error: "no statsr"}}
  return {success: statsRaw.data()}
})


module.exports = {
  getStats,
  // the admin stuff
  getNotSent, getNotReceived, getReported,
}