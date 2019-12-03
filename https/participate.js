/*
This is for when folks decide to participate, sets up the required values
*/
const functions = require('firebase-functions');
const { YEAR } = require("../config/constants");
const db = require('../config/db');
const { getGw2Account } = require('../utils/utils');

const participate = functions.https.onCall(async ({user}, context) => {
  // assume that folks calling this already have an account
  let userAccount = await db.collection('participants').doc(user).get()
  if (!userAccount.exists) {return {error: "No such user"}}

  // get the user to get teh uuid
  let userDetails = userAccount.data()
  if(!userDetails.uuid){return {error: "No API Key set"}}

  let uuid = userDetails.uuid

  let gameAccount = await getGw2Account(uuid)

  // use uuid to set teh game accoutn for entry
  let entry = {
    participant: uuid,
    entered: new Date().toISOString(),

    // this marks if they have sent their own gift
    sent_own: false,

    // these manage the status of this persons gift
    sent:false,
    received: false,
    reported: false,

    // these manage who is gifting to them and who they are gifting to
    giftee: null,
    gifter: null,

    // mark if the account is F2P
    freeToPlay:gameAccount.success.freeToPlay
  }
  let entryResult = await db.collection('events').doc(YEAR).collection('participants').doc(uuid).set(entry).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult){
    return {success: "Successfully added"}
  }else{
    return {error: "Error entering participant"}
  }
})

module.exports = { participate }