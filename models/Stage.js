class Stage {
  /**
   * @param {StageTypes} type - In which stage the event currently is
   * @param {string} year - The year of the event
   * @param {date} start - The start time for this stage
   * @param {date} end - The end time for this stage
   * @returns 
   */
  constructor(type, year, start, end) {
    this.type = type;
    this.year = year;
    this.start = typeof start === "object" ? start.toISOString() : start;
    this.end = typeof end === "object" ? end.toISOString() : end;
  }
}

module.exports = Stage;