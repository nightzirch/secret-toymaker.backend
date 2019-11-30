const functions = require('firebase-functions');
const { setAllRandomParticipant} = require('../utils/utils');

// TODO: this will be for folks who wantt o volunteer for the second gifting session
module.exports = functions.https.onCall(async({ user, isPrimaryGift }, context) => {

});