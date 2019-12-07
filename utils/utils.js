require('firebase/firestore');
const admin = require('firebase-admin');

const db = require('../config/db');
const { EVENT } = require("../config/constants");

/**
 * This is the result object I use that standardises it and allows me to check if it is a success
 * @typedef {Object} Result
 * @property {string} [success] - Returned if the function is successful
 * @property {string} [error] - Returned if the function fails, contains teh reason for failure
 */


const getCurrentEvent = async () => {
  const events = await db.collection('events').get();
  if (events.empty) {return {error: "No events currently active"}}
  let currentEvent;

  events.forEach(doc => {
    if(!currentEvent) {
      const event = doc.data();
      const signupStart = event.signupStart.toDate();
      const eventEnd = event.eventEnd.toDate();
      const now = new Date();
  
      if(signupStart < now && now < eventEnd) {
        currentEvent = event;
      }
    }
  });

  return currentEvent;
}

/**
 * This takes a user object or uid and returns teh uuid
 * @param {string} user - user object or uid
 * @returns {Result}
 */
const getUUID = async(user) =>{
  // this is the uid, but cna accept the user object as well
  if(user.uid){user = user.uid}

  let userAccount = await db.collection('participants').doc(user).get()
  if (!userAccount.exists) {return {error: "No such user"}}

  // get the user to get teh uuid
  let userDetails = userAccount.data()
  if(!userDetails.uuid){return {error: "No API Key set"}}

  let uuid = userDetails.uuid
  return {success: uuid}
}

/**
 * This takes a UUID and returns the Gw2 account details
 * @param {string} uuid - Takes uuid and returns the gw2 account
 * @returns {Result}
 */
const getGw2Account = async (uuid) =>{
  let userAccount = await db.collection('userAccounts').doc(uuid).get()
  if (!userAccount.exists) {return {error: "No such giftee"}}
  // get the user to get teh uuid
  return {success: userAccount.data()}
}

/**
 * This is the functions that matches everyone together for the initial round
 * @returns {Result}
 */
const setAllRandomParticipant = async () => {
  // this will run once manually
  let allUsers = await db.collection('events').doc(EVENT).collection('participants').where('freeToPlay', '==', false).get()
  if (allUsers.empty) {return {error: "No valid users"}}

  let tmp = {}
  let allUsersArray = []

  allUsers.forEach(doc => {
    let data = doc.data()
    tmp[data.participant] = data
    allUsersArray.push(data)
  })
  if(allUsersArray.length === 0){return {error: "No valid users"}}

  for(let i=0;i<allUsersArray.length;i++){
    let gifter_uuid = allUsersArray[i].participant

    let tempArray = allUsersArray.filter(user => user.gifter === null && user.participant !== gifter_uuid)
    let randomInt = Math.floor(Math.random() * tempArray.length)

    let giftee_uuid = tempArray[randomInt].participant

    tmp[gifter_uuid].giftee = giftee_uuid
    tmp[giftee_uuid].gifter = gifter_uuid

    // updates allUsersArray to exclude this item
    let foundIndex = allUsersArray.findIndex(x => x.participant === giftee_uuid);
    allUsersArray[foundIndex].gifter = gifter_uuid;
  }

  // Batch it together
  let batch = db.batch();
  Object.keys(tmp).forEach(key => {
      let reference = db.collection('events').doc(EVENT).collection('participants').doc(key)
      batch.update(reference, {gifter: tmp[key].gifter, giftee: tmp[key].giftee});
    })
  await batch.commit()

  return {success: "all users assigned"}
}

/**
 * This queries teh database for folks who's participation matches the parameters specified
 * @param {string} field - Field to search on: sent_own, received, reported
 * @param comparison - The comparison can be <, <=, ==, >, >=, array-contains, in, or array-contains-any
 * @param value - This is the value to search for, in most cases it will be boolean
 * @param {number} [skip=0] - For pagination
 * @param {number} [limit=100] - For Pagination
 * @returns {array} - An array of participation entries
 */
async function getGeneralQueries(field, comparison, value, skip, limit){
  //if(typeof skip === "undefined"){skip = 0}
  //if(typeof limit === "undefined"){limit = 100}

  let result = []
  let results = await db.collection('events').doc(EVENT).collection('participants').where(field, comparison, value)
  //.startAt(skip).limit(limit)
  .get()

  if (results.empty) {return result}

  results.forEach( (doc) => {
    result.push(doc.data())
  })

  return result
}

/**
 * This is used to allow a person to volunteer for n new giftees where n is 1-10
 * @param {string} user - This is the giftee's uid or user object
 * @param {object} count - Number of (new) Giftees teh Gifter is volunteering for
 * @returns {Result}
 */
const volunteerForNewGiftees = async (user, count) => {
  let uuid = await getUUID(user)
  if(uuid.error){return {error: uuid.error}}
  uuid = uuid.success

  // check to see if said user has sent their initial gift
  let sent = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).get()
  if (sent.empty) {return {error: "has not sent initial gift"}}

  // normalise the quantities, just in case its spoofed
  if(!count){count = 1}
  if(count > 10){count = 1}
  if(count < 1){count = 1}

  // now get list of peoople who havent gotten a goft
  let noGift = await db.collection('events').doc(EVENT).collection('participants').where("received", "==", false).get()
  if (noGift.empty) {return {error: "has not sent initial gift"}}

  // now loop through
  // anyone who didnt (mark) send themselves is disqualified

  let resultsArray = []
  noGift.forEach( (doc) => {
    let data = doc.data()
    if(
      // check to see if they themselves have sent their gift
      data.sent_own &&
      // these are to check if if the user is already on a send list
      !data.second && !data.third
    ){
      resultsArray.push(data)
    }
  });

  // batch the updates together
  let batch = db.batch();
  for(let i=0;i<resultsArray.length;i++){
    // only need to do up to the specified quantity
    if (i >= count) break
    // update said user accounts with new gifter
    let reference = db.collection('events').doc(EVENT).collection('participants').doc(resultsArray[i].participant)

    // this onlky needs a monor change to setup teh third round of gifting
    let changes = {gifter: uuid, second: true}
    batch.update(reference, changes);
  }

  // commit the batch update
  await batch.commit()

  // return the result after the database stuff is complete
  return { success: "Please refresh the giftee list" }
}

/**
 * This marks the giftee's account with the appropriate flags, only if its not already set.
 * @param {object} giftee - details about the giftee
 * @param {string} [giftee.uuid] - UUID of the giftee, if you do not know it
 * @param {string} [giftee.user] - If the UUID is unknown this is the giftee's uid or user object
 * @param {object} update - details about the giftee
 * @param {string} update.field - What part to mark: sent, received, reported
 * @param {string} [update.message] - If reporting allow a message
 * @param {boolean} [update.value] - If reporting allow a message
 * @returns {Result}
 */
async function markGifteeAccount({uuid, user}, {field, message, value}){
  // if someone is marking the gift sent they know the uuid of the giftee
  if(!uuid){
    if(!user){return {error: "no uuid or user requested"}}

    // if the uuid is undefined then take the user, search for teh account related and return that uuid
    let tmp_uuid = await getUUID(user)
    if(tmp_uuid.error){return {error: "no API key set"}}
    uuid = tmp_uuid.success
  }

  // checking teh field
  if(!field){return {error: "no field defined"}}
  if(field !== "sent" && field !== "received" && field !== "reported"){return {error: "field is not one of the defined types"}}

  if(typeof value === "undefined"){value=true}
  let currentValueRaw = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).get()
  if (!currentValueRaw.exists) {return {error: "no such user"}}
  let currentValue = currentValueRaw.data()
  if(value === currentValue[field]){return {success: "Value already set"}}

  let tmp = {}
  tmp[field] = value
  if(message){tmp.report = message}

  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).set(tmp, {merge: true}).then(()=> {return true}).catch(() => {return false});

  let tmp2 = {}
  tmp2[field] = admin.firestore.FieldValue.increment(value?1:-1)
  let entryResult2 = await db.collection('events').doc(EVENT).set(tmp2, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult && entryResult2){
    return {success: "Successfully marked " + field}
  }else{
    return {error: "Error in marking " + field, entryResult:entryResult, entryResult2:entryResult2}
  }
}

module.exports = { getCurrentEvent, getUUID, setAllRandomParticipant, getGw2Account, getGeneralQueries, volunteerForNewGiftees, markGifteeAccount};