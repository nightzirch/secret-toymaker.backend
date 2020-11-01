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
    const data = doc.data();
    const event = Event.fromData(data);
    events[data.year] = event;
  });

  return events;
};

module.exports = { getAllEvents };
