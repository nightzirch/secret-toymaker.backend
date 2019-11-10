const functions = require('firebase-functions');
require('firebase/firestore');

const db = require('../config/db');

const moment = require('moment');
moment.locale('nb');

module.exports = functions.https.onCall((user, context) => {
  // TODO: add check they aren't already participating

  return db.collection('events').doc('2019')
    .collection('participants').doc(user.uid)
    .set({
      participant: db.collection('participants').doc(user.uid),
      entered: moment().format(),
      gifts: []
    })
    .catch(err => {
      console.log('Error when registering participation:', err);
      return {
        error: err
      };
    });
});