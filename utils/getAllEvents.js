const Event = require("../models/Event");
const { db } = require("../config/firebase");
const CollectionTypes = require("../utils/types/CollectionTypes");

const getAllEvents = async () => {
  const eventsRef = db.collection(CollectionTypes.EVENTS);
  const snapshot = await eventsRef.get();

  if (snapshot.empty) {
    return [];
  }

  const events = {};

  snapshot.forEach((doc) => {
    const eventData = doc.data();
    const event = Event.fromData(eventData);
    events[eventData.year] = event;
  });

  return events;
};

module.exports = { getAllEvents };
