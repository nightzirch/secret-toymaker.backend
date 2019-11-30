/*
const functions = require('firebase-functions');

const createTree = async()=>{
  let tree = {
    events:{},
    participants:{

    },
    userAccounts:{}
  }

  tree.events[YEAR] = {
    participants:{

    },
    timebox:{

    },
  }

  // manage top categories
  let topCategories = Object.keys(tree)

  for(let i=0;i<topCategories.length;i++){
    let docRef = await db.collection(topCategories[i]).doc('temp').set({ temp: true });
  }
}


module.exports = functions.https.onCall(async(blank, context) => {
  await createTree()
});

 */

const functions = require('firebase-functions');
const rp = require('request-promise-native');
const db = require('./config/db');
const { setAllF2PRandomParticipant } = require('./utils/utils');
const { YEAR } = require("./config/constants");

module.exports = functions.https.onCall(async(blank, context) => {
  await setAllF2PRandomParticipant()
});