const functions = require('firebase-functions');
const rp = require('request-promise-native');
const db = require('../config/db');
const { getUUID, getGw2Account } = require('../utils/utils');
const { YEAR } = require("../config/constants");

const updateApiKey = functions.https.onCall(async({user,apiKey}, context) => {
  // may tern the request into a genralised function if we get the mail endpoint, but for now it is sufficent

  // first check key
  let url = "https://api.guildwars2.com/v2/account?v=2019-11-18T00:00:00Z&access_token="+apiKey
  let accountData = await rp({url:url,resolveWithFullResponse:true}).then((response) => {return { headers: response.headers, body: response.body }}).catch((error) => {return { error: error }})

  if(accountData.error){
    // Somethign went wrong went wrong

    if(accountData.error.statusCode === 401){
      return {error: "API key does not have access"}
    }
    if(accountData.error.statusCode === 404){
      return {error: "Link not found"}
    }
    return {error: "Unable to get data"}
  }

  // result is json so format it
  let result = JSON.parse(accountData.body)

  // figure pout if the person is F2P
  let freeToPlay = result.access.indexOf("PlayForFree ") !== -1

  // get uuid
  let uuid = result.id

  // add the data to userAccounts collection
  await db.collection('userAccounts').doc(uuid).set({ uuid: uuid, apiKey:apiKey, lastValid: new Date().toISOString(), freeToPlay:freeToPlay, id: result.name, volunteer: false }).catch(err => console.log(err))

  // for local testing
  if(user.uid){user = user.uid}

  await db.collection('participants').doc(user).set({ uuid: uuid }, {merge: true}).catch(err => console.log(err))

  // return that is is a success
  return {success: "API key added"}
})

const updateApiKeyNote = functions.https.onCall(async({user,note}, context) => {
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  // add the data to userAccounts collection
  await db.collection('userAccounts').doc(uuid).set({ note: note }, {merge: true}).catch(err => console.log(err))

  // return that is is a success
  return {success: "Note added"}
})

const assignedGiftees = functions.https.onCall(async ({user}, context) => {
  let gifter_uuid = await getUUID(user)
  if(gifter_uuid.error){return {error: "no API key set"}}
  gifter_uuid = gifter_uuid.success

  let giftee = await db.collection('events').doc(YEAR).collection('participants').where('gifter', '==', gifter_uuid).get()
  if (giftee.empty) {return {error: "No valid users"}}

  let gifteeArrayRaw = []
  giftee.forEach(doc => {gifteeArrayRaw.push(doc.data())});

  // array in case the user is sending gifts to f2p folks
  let gifteeArray = []
  for (const gifteeData of gifteeArrayRaw) {
    // eslint-disable-next-line no-await-in-loop
    let userAccount = await getGw2Account(gifteeData.participant)
    let userDetails = userAccount.success
    gifteeArray.push({
      name:userDetails.id,
      note:userDetails.note,
    })
  }
  return { success:gifteeArray }
})

const updateVolunteer = functions.https.onCall(async({user,volunteer,count}, context) =>{
  if(!user){return {error: "no user set"}}
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "no API key set"}}
  uuid = uuid.success

  // set defaults if they arent passed
  if(!volunteer){volunteer = true}
  if(!count){count = 1}

  // add the data to userAccounts collection
  await db.collection('events').doc(YEAR).collection('participants').doc(uuid).set({ volunteer: volunteer, count:count }, {merge: true}).catch(err => console.log(err))

  // return that is is a success
  if(volunteer){
    return {success: "Now Volunteering"}
  }else{
    return {success: "Stopped Volunteering"}
  }
})

module.exports = { updateApiKey, updateApiKeyNote, assignedGiftees, updateVolunteer }