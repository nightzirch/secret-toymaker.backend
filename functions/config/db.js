const admin = require('firebase-admin');
require('firebase/firestore');

admin.initializeApp();

const db = admin.firestore();

module.exports = db;