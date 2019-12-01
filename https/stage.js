const functions = require("firebase-functions");
require("firebase/firestore");

const db = require("../config/db");
const { STAGES , YEAR} = require("../config/constants");

// this gets teh current stage info
const stage = functions.https.onCall(async(data, context) => {
  let currentStage = { name: STAGES.INACTIVE, start: null, end: null }

  let stages =  await db.collection('events').doc(YEAR).collection('timebox').get()

  if (stages.empty) {return currentStage}

  let now = new Date().toISOString()
  stages.forEach(doc => {
    let stage = doc.data()
    if(stage.start < now && now < stage.end){
      currentStage = { name: doc.id, start: new Date(stage.start).getTime(), end: new Date(stage.end).getTime() }
    }
  })
  return currentStage
});

module.exports = { stage }