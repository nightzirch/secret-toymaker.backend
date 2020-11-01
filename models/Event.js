const Stage = require("./Stage");

class Event {
  /**
   * @param {Stage} currentStage - The current stage for this event
   * @param {date} eventEnd - The end time for this event
   * @param {date} eventStart - The start time for the event
   * @param {number} giftsSent - Amount of gifts sent
   * @param {boolean} isMatchingBegun - Is matching in progress
   * @param {boolean} isMatchingDone - Is matching done
   * @param {number} participants - Amount of participants
   * @param {date} signupStart - The start time for signing up for the event
   * @param {string} year - The year of the event
   * @returns {Event}
   */
  constructor(
    currentStage,
    eventEnd,
    eventStart,
    signupStart,
    giftsSent,
    isMatchingBegun,
    isMatchingDone,
    participants,
    year
  ) {
    this.currentStage = currentStage;
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
    this.year = year;
  }

  static fromData(data) {
    return new Event(
      Stage.currentfromEventData(data),
      data.eventEnd.toDate(),
      data.eventStart.toDate(),
      data.signupStart.toDate(),
      data.giftsSent,
      data.isMatchingBegun,
      data.isMatchingDone,
      data.participants,
      data.year
    );
  }
}

module.exports = Event;
