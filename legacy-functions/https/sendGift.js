const functions = require('firebase-functions');
require('firebase/firestore');

const db = require('../config/db');

const moment = require('moment');
moment.locale('nb');

module.exports = functions.https.onCall((user, context) => {

});