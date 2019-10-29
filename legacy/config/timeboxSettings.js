const moment = require('moment');
moment.locale('nb');

const dateFormatShort = 'DD/MM/YYYY',
      dateFormatLong = 'hh:mm:ss-DD/MM/YYYY';

module.exports = [
  {
    year: '2017',
    signup: {
      start: moment('12/12/2017', dateFormatShort),
      end: moment('19/12/2017', dateFormatShort)
    },
    gifting: {
      start: moment('20/12/2017', dateFormatShort),
      end: moment('05/01/2018', dateFormatShort)
    }
  },
  {
    year: '2018',
    signup: {
      start: moment('01/12/2018', dateFormatShort),
      end: moment('19/12/2018', dateFormatShort)
    },
    gifting: {
      start: moment('20/12/2018', dateFormatShort),
      end: moment('06/01/2019', dateFormatShort)
    }
  }
];
