const settings = require('../config/settings');
const api = require('../libs/api');
const mongoose = require('mongoose');
const webpush = require('web-push');

webpush.setGCMAPIKey(settings.gmcAPIKey);
webpush.setVapidDetails(
  '[REDACTED_EMAIL]',
  settings.vapidKeys.publicKey,
  settings.vapidKeys.privateKey
);

const notificationTypes = {
  'MATCHED': {
    body: 'You got matched!',
    tag: 'secret-toymaker-matched'
  },
  'SENT_GIFT': {
    body: 'Your toymaker has marked their gift as sent!',
    tag: 'secret-toymaker-sent-gift'
  },
  'RECEIVED_GIFT': {
    body: 'Your match has marked their gift as received!',
    tag: 'secret-toymaker-received-gift'
  },
  'TEST': {
    body: 'This is a test notification',
    tag: 'secret-toymaker-test'
  }
}

let Participant;

try {
  Participant = mongoose.model('Participant');
} catch (err) {
  Participant = require('../models/Participant');
}

module.exports = class PostsService {
  constructor() {

  }

  sendPushMessage(subscriptions, type = 'MATCHED') {
    // If valid type
    if (notificationTypes[type]) {
      const payload = JSON.stringify(notificationTypes[type]);
      
      return Promise.all(
        subscriptions.map((subscription) => {
          return webpush.sendNotification(
            subscription,
            payload
          );
        })
      );
    }
    return;
  }
};
