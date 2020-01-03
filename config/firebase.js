const admin = require('firebase-admin');
require('firebase/auth');
require('firebase/firestore');

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };