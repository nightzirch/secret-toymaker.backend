const functions = require("firebase-functions");
require("firebase/firestore");

const db = require("../config/db");
const { STAGES } = require("../config/constants");

const moment = require("moment");
moment.locale("nb");

module.exports = functions.https.onCall((data, context) => {
  return db
    .collection("timebox")
    .get()
    .then(snapshot => {
      const now = moment();
      var stage = {};

      snapshot.forEach(doc => {
        var t = doc.data();

        Object.keys(STAGES).map(s => {
          if (
            t[STAGES[s]] &&
            now.isBetween(
              t[STAGES[s]].start.toDate(),
              t[STAGES[s]].end.toDate(),
              "day",
              "[]"
            )
          ) {
            stage = {
              name: STAGES[s],
              end: t[STAGES[s]].end.toDate().getTime()
            };
          }

          if (!stage) {
            stage = {
              name: STAGES.INACTIVE,
              end: null
            };
          }
        });
      });

      return {
        stage
      };
    })
    .catch(err => {
      console.log("Error when getting stage:", err);
      return {
        error: err
      };
    });
});
