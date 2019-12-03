/*
This manages sending, recieving and reporting gifts.

also has functions to return admin stuff as well
*/
const functions = require('firebase-functions');
require('firebase/firestore');
const { getUUID, getGeneralQueries, markGifteeAccount } = require('../utils/utils');
const { EVENT } = require("../config/constants");
const db = require('../config/db');

// marks gift as went
const sendGift = functions.https.onCall(async({user, giftee_uuid}, context) => {
  // this has to mark both the giftee and gifter

  // gifter first
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid.success).set({ sent_own: true }, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // giftee now, the giftee's uuid is known
  let gifteeStatus = await markGifteeAccount({uuid:giftee_uuid}, "sent")

  // check result and return to frontend
  if(entryResult && gifteeStatus.success){
    return {success: "Successfully marked sent"}
  }else{
    return {error: "Error in marking sent" + gifteeStatus}
  }

})

// marks gift as recieved
const receiveGift = functions.https.onCall(async ({user}, context) => {
  // on the giftee (current user)
  let gifteeStatus = await markGifteeAccount({user:user}, "received")

  // check result and return to frontend
  if(gifteeStatus.success){
    return {success: gifteeStatus.success}
  }else{
    return {error: gifteeStatus.error}
  }
})

// reports gift with an option for a message
const reportGift = functions.https.onCall(async({user, message}, context) => {
  // on the giftee (current user)
  let gifteeStatus = await markGifteeAccount({user:user}, "reported", message)

  // check result and return to frontend
  if(gifteeStatus.success){
    return {success: gifteeStatus.success}
  }else{
    return {error: gifteeStatus.error}
  }
})


/*******************************************************************/
// for admin use only - these return a list of details
/*******************************************************************/

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

// returns list of users that have sent and marked recieved
// not sure if this is required


module.exports = {
  sendGift, receiveGift, reportGift,
  // the admin stuff
  getNotSent, getNotReceived, getReported,
}