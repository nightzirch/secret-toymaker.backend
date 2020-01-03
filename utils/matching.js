require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");
const { EVENT } = require("../config/constants");

const setMatchingBegun = async value => {
  const isSuccessful = await db
    .collection(CollectionTypes.EVENTS)
    .doc(EVENT)
    .set({ isMatchingBegun: value }, { merge: true })
    .then(() => true)
    .catch(() => false);

  return isSuccessful;
};

const setMatchingDone = async value => {
  const isSuccessful = await db
    .collection(CollectionTypes.EVENTS)
    .doc(EVENT)
    .set({ isMatchingDone: value }, { merge: true })
    .then(() => true)
    .catch(() => false);

  return isSuccessful;
};

module.exports = {
  setMatchingBegun,
  setMatchingDone
};
