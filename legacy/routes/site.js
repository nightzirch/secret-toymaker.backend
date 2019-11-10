const constants = require('../config/constants');
const timeboxHelper = new (require('../libs/timeboxHelper'))();

module.exports = {
  getStage: (req, res) => {
    return res.status(200).json({
      data: {
        stage: timeboxHelper.getStage()
      }
    });
  }
};
