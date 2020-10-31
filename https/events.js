const functions = require("firebase-functions");
const { getAllEvents } = require("../utils/getAllEvents");

/**
 * @namespace getEvents
 * @return {getEvents~inner} - the returned function
 */
const getEvents = functions.https.onCall(
  /**
   * Get all events
   * @inner
   * @returns {Result}
   */
  async () => {
    try {
      const allEvents = await getAllEvents();
      return { success: allEvents };
    } catch (e) {
      return { error: "Failed to get events." };
    }
  }
);

module.exports = { getEvents };
