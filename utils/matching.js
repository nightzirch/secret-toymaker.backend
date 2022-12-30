require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");

const setMatchingBegun = async (value, year) => {
  const isSuccessful = await db
    .collection(CollectionTypes.EVENTS)
    .doc(year)
    .set({ isMatchingBegun: value }, { merge: true })
    .then(() => true)
    .catch(() => false);

  return isSuccessful;
};

const setMatchingDone = async (value, year) => {
  const isSuccessful = await db
    .collection(CollectionTypes.EVENTS)
    .doc(year)
    .set({ isMatchingDone: value }, { merge: true })
    .then(() => true)
    .catch(() => false);

  return isSuccessful;
};

module.exports = {
  setMatchingBegun,
  setMatchingDone,
};
