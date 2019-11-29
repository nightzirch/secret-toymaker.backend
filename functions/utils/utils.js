require('firebase/firestore');
const admin = require('firebase-admin');

const db = require('../config/db');
const { YEAR } = require("../config/constants");

const getParticipant = user => {
  return db.collection('participants').doc(user.uid).get()
    .then(doc => doc)
    .catch(err => err);
};

const getUUID = async(user) =>{
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

/*
const getParticipation = user => {
  return db.collection('events').doc('2019').collection('participants').doc(user.uid)
    .get()
    .then(doc => doc)
    .catch(err => {
      console.log('Error getting participation: ', err);
    });
};
// */

const setAllRandomParticipant = async () => {
  // this will run once manually
  let allUsers = await db.collection('events').doc(YEAR).collection('participants').where('freeToPlay', '==', false).get()
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
      let reference = db.collection('events').doc(YEAR).collection('participants').doc(key)
      batch.update(reference, {gifter: tmp[key].gifter, giftee: tmp[key].giftee});
    })
  await batch.commit()

  return {success: "all users assigned"}
}

/*
//
const getRandomParticipant = async (uuid) => {
  let allUsers = await db.collection('events').doc('2019').collection('participants').where('gifter', '==', null).get()
  if (allUsers.empty) {return {error: "No valid users"}}

  let allUsersArray = []
  allUsers.forEach(doc => {
    let data = doc.data()
    // can also be changed to have an excluded array, but that may not be for now
    // TODO: uncomment this before releasing
    //if(data.participant !== uuid){
    allUsersArray.push(data)
    //}
  });

  if(allUsersArray.length === 0){return {error: "No valid users"}}

  let randomInt = Math.floor(Math.random() * allUsersArray.length)
  let randomUUID = allUsersArray[randomInt].participant

  return {success: randomUUID}
}

//*/

module.exports = { getParticipant, getUUID, setAllRandomParticipant, getGw2Account};