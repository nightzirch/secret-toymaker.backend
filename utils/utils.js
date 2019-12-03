require('firebase/firestore');
const admin = require('firebase-admin');

const db = require('../config/db');
const { EVENT } = require("../config/constants");

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

const getGw2Account = async (uuid) =>{
  let userAccount = await db.collection('userAccounts').doc(uuid).get()
  if (!userAccount.exists) {return {error: "No such giftee"}}
  // get the user to get teh uuid
  return {success: userAccount.data()}
}

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

async function getGeneralQueries(field, operation, value, skip, limit){
  if(typeof skip === "undefined"){skip = 0}
  if(typeof limit === "undefined"){limit = 100}

  let result = []
  let results = await db.collection('events').doc(EVENT).collection('participants').where(field, operation, value).startAt(skip).limit(limit).get()

  if (results.empty) {return result}

  let resultsArray = []
  results.forEach( (doc) => {resultsArray.push(doc.data())});

  // todo: turn this isnto an array of promices, then Promise.All()
  for (let i=0;i<resultsArray.length;i++) {
    let user = resultsArray[i]

    // eslint-disable-next-line no-await-in-loop
    let userAccount = await getGw2Account(user.participant)
    user.name = userAccount.success.id

    result.push(user)
  }
  return result
}

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

  // this array gets returned to teh frontend
  let result = []
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
 * @param {object} giftee - details about the giftee
 * @param {string} [giftee.uuid] - UUID of the giftee, if you do not know it
 * @param {string} [giftee.user] - If the UUID is unknown this is the giftee's uid or user object
 * @param {string} field - What part to mark: sent, received, reported
 * @param {string} [message] - If reporting allow a message
 * @returns
 */
async function markGifteeAccount({uuid, user}, field, message){
  // if someone is marking the gift sent they know the uuid of the giftee
  if(!uuid){
    if(!user){return {error: "no uuid or user requested"}}

    // if the uuid is undefined then take the user, search for teh account related and return that uuid
    uuid = await getUUID(user)
    if(uuid.error){return {error: "no API key set"}}
    uuid = uuid.success
  }

  // checking teh field
  if(!field){return {error: "no field defined"}}
  if(field !== "sent" && field !== "received" && field !== "reported"){return {error: "field is not one of the defined types"}}

  let tmp = {}
  tmp[field] = true
  if(!message){tmp.report = message}

  let entryResult = await db.collection('events').doc(EVENT).collection('participants').doc(uuid).set(tmp, {merge: true}).then(()=> {return true}).catch(() => {return false});

  // check result and return to frontend
  if(entryResult){
    return {success: "Successfully marked " + field}
  }else{
    return {error: "Error in marking " + field}
  }
}

module.exports = { getCurrentEvent, getUUID, setAllRandomParticipant, getGw2Account, getGeneralQueries, volunteerForNewGiftees, markGifteeAccount};