const functions = require('firebase-functions');
const rp = require('request-promise-native');
const db = require('../config/db');

module.exports = functions.https.onCall(async({user,apiKey}, context) => {
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
  await db.collection('userAccounts').doc(uuid).set({ uuid: uuid, apiKey:apiKey, lastValid: new Date().toISOString(), freeToPlay:freeToPlay }).catch(err => console.log(err))

  // for local testing
  if(user.uid){user = user.uid}

  await db.collection('participants').doc(user).set({ uuid: uuid }, {merge: true}).catch(err => console.log(err))

  // return that is is a success
  return {success: "API key added"}
})