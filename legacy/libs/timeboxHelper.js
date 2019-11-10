const timeboxSettings = require('../config/timeboxSettings');
const moment = require('moment');
moment.locale('nb');

const dateFormatShort = 'DD/MM/YYYY',
      dateFormatLong = 'hh:mm:ss-DD/MM/YYYY';

module.exports = class TimeboxHelper {
  getStage() {
    // const now = moment('21/12/2018', dateFormatShort);
    const now = moment();
    var stage;

    timeboxSettings.forEach(t => {
      if (now.isBetween(t.signup.start, t.signup.end, 'day', '[]')) {
        stage = 'SIGNUP';
      } else if (now.isBetween(t.gifting.start, t.gifting.end, 'day', '[]')) {
        stage = 'GIFTING';
      }
    })

    // Fallback
    return stage || 'INACTIVE';
  }
};
