const functions = require("firebase-functions");
require("firebase/firestore");
const CollectionTypes = require("../utils/types/CollectionTypes");

const { db } = require("../config/firebase");

/**
 * @namespace getAlerts
 * @return {getAlerts~inner} - the returned function
 */
const getAlerts = functions.https.onCall(
  /**
   * Gets all the alerts from the backend.
   * @inner
   * @returns {Alerts}
   */

  async () => {
    const alertsSnapshot = await db.collection(CollectionTypes.ALERTS).get();
    if (alertsSnapshot.empty) {
      return { success: [] };
    }

    const alerts = [];

    alertsSnapshot.forEach(alertDoc => {
      const alert = alertDoc.data();
      alerts.push(Object.assign(alert, { id: alertDoc.id }));
    });

    return { success: alerts };
  }
);

module.exports = { getAlerts };
