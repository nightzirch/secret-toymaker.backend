const functions = require('firebase-functions');
const { setAllRandomParticipant} = require('../utils/utils');

module.exports = functions.https.onCall(async(blank, context) => {
  await setAllRandomParticipant()
});