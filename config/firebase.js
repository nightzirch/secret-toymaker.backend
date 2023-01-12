const admin = require("firebase-admin");
require("firebase/firestore");
require("firebase/auth");

admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

db.settings({ ignoreUndefinedProperties: true });

module.exports = { auth, db };
