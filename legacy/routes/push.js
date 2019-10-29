const participantService = new (require('../services/participantService'))();
const pushService = new (require('../services/pushService'))();
const constants = require('../config/constants');
const validation = require('../libs/validation');

let Participant = require('../models/Participant');

module.exports = {
  subscribe: (req, res) => {
    if (!req.body || !req.body.userId || !req.body.subscription) {
      return res.status(400).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    }

    participantService.getParticipantFromID(req.body.userId).then((value) => {
      participantService.updateParticipant(req.body.userId, {
        notification: {
          subscriptions: value.notification.subscriptions.concat(req.body.subscription)
        }
      }).then((value) => {
        return res.status(200).json({
          data: {
            status: constants.SUCCESS,
            message: "User subscribed.",
            participant: value
          }
        });
      });
    }).catch((reason) => {
      // ERROR - DATABASE ERROR
      return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
    });
  },

  unsubscribe: (req, res) => {
    if (!req.body || !req.body.userId || !req.body.subscription) {
      return res.status(400).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    }

    participantService.getParticipantFromID(req.body.userId).then((value) => {
      participantService.updateParticipant(req.body.userId, {
        notification: {
          subscriptions: value.notification.subscriptions.filter(sub => sub.endpoint !== req.body.subscription.endpoint)
        }
      }).then((value) => {
        return res.status(200).json({
          data: {
            status: constants.SUCCESS,
            message: "User unsubscribed.",
            participant: value
          }
        });
      });
    }).catch((reason) => {
      // ERROR - DATABASE ERROR
      return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
    });
  }
};
