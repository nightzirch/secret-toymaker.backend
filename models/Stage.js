const { StageTypes } = require("../config/constants");

class Stage {
  /**
   * @param {StageTypes} type - In which stage the event currently is
   * @param {string} year - The year of the event
   * @param {string} name - The name of the event
   * @param {date} start - The start time for this stage
   * @param {date} end - The end time for this stage
   * @returns {Stage}
   */
  constructor(type, year, name, start, end) {
    this.type = type;
    this.year = year;
    this.name = name,
    this.start = typeof start === "object" ? start.toISOString() : start;
    this.end = typeof end === "object" ? end.toISOString() : end;
  }

  static fromEventData(data) {
    const { isMatchingDone, name, year } = data;
    let currentStage = new Stage(StageTypes.INACTIVE, year, name);
    const eventEnd = data.eventEnd.toDate();
    const eventStart = data.eventStart.toDate();
    const signupStart = data.signupStart.toDate();
    const now = new Date();

    if (signupStart < now && now < eventStart) {
      currentStage = new Stage(
        StageTypes.SIGNUP,
        year,
        name,
        signupStart,
        eventStart
      );
    } else if (eventStart < now && now < eventEnd && !isMatchingDone) {
      currentStage = new Stage(StageTypes.MATCHING, year, name);
    } else if (eventStart < now && now < eventEnd && isMatchingDone) {
      currentStage = new Stage(StageTypes.GIFTING, year, name, eventStart, eventEnd);
    }

    return currentStage;
  }
}

module.exports = Stage;
