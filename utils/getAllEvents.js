const Event = require("../models/Event");
const { db } = require("../config/firebase");
const CollectionTypes = require("../utils/types/CollectionTypes");

const getAllEvents = async () => {
  const eventsRef = db.collection(CollectionTypes.EVENTS);
  const snapshot = await eventsRef.get();

  if (snapshot.empty) {
    return [];
  }

  const events = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const event = new Event(
      data.eventEnd.toDate(),
      data.eventStart.toDate(),
      data.signupStart.toDate(),
      data.giftsSent,
      data.isMatchingBegun,
      data.isMatchingDone,
      data.participants,
      data.year
    );
    events.push(event);
  });

  return events;
};

module.exports = { getAllEvents };
