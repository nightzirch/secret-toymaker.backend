const functions = require('firebase-functions');
require('firebase/firestore');
const { getUUID, getGeneralQueries } = require('../utils/utils');
const { YEAR } = require("../config/constants");
const db = require('../config/db');

// marks gift as went
const sendGift = functions.https.onCall(async({user}, context) => {
  // marks their own account

  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success


  let entryResult = await db.collection('events').doc(YEAR).collection('participants').doc(uuid).set({ sent: true }, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult){
    return {success: "Successfully marked sent"}
  }else{
    return {error: "Error in marking sent"}
  }

})

// marks gift as recieved
const receiveGift = functions.https.onCall(async ({user}, context) => {
  // marks teh senders account
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  //gets teh gifter for teh above uuid
  let gifter = await db.collection('events').doc(YEAR).collection('participants').where('giftee', '==', uuid).get()
  if (gifter.empty) {return {error: "No valid users"}}

  // problem with .where() is that it returns an array thingie
  let gifterDetails = {}
  gifter.forEach(doc => {gifterDetails=doc.data()});
  if(!gifterDetails.participant){return {error: "No valid users"}}

  let gifter_uuid = gifterDetails.participant

  let entryResult = await db.collection('events').doc(YEAR).collection('participants').doc(gifter_uuid).set({ received: true }, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult){
    return {success: "Successfully marked received"}
  }else{
    return {error: "Error in marking received"}
  }
})

// reports gift
const reportGift = functions.https.onCall(async({user, message}, context) => {
  // marks teh senders account
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  //gets teh gifter for teh above uuid
  let gifter = await db.collection('events').doc(YEAR).collection('participants').where('giftee', '==', uuid).get()
  if (gifter.empty) {return {error: "No valid users"}}

  // problem with .where() is that it returns an array thingie
  let gifterDetails = {}
  gifter.forEach(doc => {gifterDetails=doc.data()});
  if(!gifterDetails.participant){return {error: "No valid users"}}

  let gifter_uuid = gifterDetails.participant

  let entryResult = await db.collection('events').doc(YEAR).collection('participants').doc(gifter_uuid).set({ reported: true, report: message }, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult){
    return {success: "Successfully reported"}
  }else{
    return {error: "Error in reporting"}
  }

})


/*******************************************************************/
// for admin use only - these return a list of details
/*******************************************************************/

// returns list of folks who have not sent
const getNotSent = functions.https.onCall(async({skip, limit}, context) => {
  return {success: await getGeneralQueries('sent', '==', false, skip, limit)}
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