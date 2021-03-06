const Stage = require("./Stage");

class Event {
  /**
   * @param {Stage} stage - The stage in which this event is
   * @param {date} eventEnd - The end time for this event
   * @param {date} eventStart - The start time for the event
   * @param {number} giftsSent - Amount of gifts sent
   * @param {boolean} isMatchingBegun - Is matching in progress
   * @param {boolean} isMatchingDone - Is matching done
   * @param {number} participants - Amount of participants
   * @param {date} signupStart - The start time for signing up for the event
   * @param {string} name - The name of the event
   * @param {string} year - The year of the event
   * @returns {Event}
   */
  constructor(
    stage,
    eventEnd,
    eventStart,
    signupStart,
    giftsSent,
    isMatchingBegun,
    isMatchingDone,
    participants,
    name,
    year,
    emails
  ) {
    this.stage = stage;
    this.eventEnd =
      typeof eventEnd === "object" ? eventEnd.toISOString() : eventEnd;
    this.eventStart =
      typeof eventStart === "object" ? eventStart.toISOString() : eventStart;
    this.giftsSent = giftsSent || 0;
    this.isMatchingBegun = isMatchingBegun || false;
    this.isMatchingDone = isMatchingDone || false;
    this.participants = participants || 0;
    this.signupStart =
      typeof signupStart === "object" ? signupStart.toISOString() : signupStart;
    this.name = name;
    this.year = year;
    this.emails = emails;
  }

  static fromData(data) {
    return new Event(
      Stage.fromEventData(data),
      data.eventEnd.toDate(),
      data.eventStart.toDate(),
      data.signupStart.toDate(),
      data.giftsSent,
      data.isMatchingBegun,
      data.isMatchingDone,
      data.participants,
      data.name,
      data.year,
      data.emails
    );
  }
}

module.exports = Event;
