const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const participantSchema = new Schema({
  access: [String],
  accname: String,
  apitoken: String,
  commander: { type: Boolean, default: false },
  created: String,
  email: String,
  fractal_level: Number,
  guilds: [String],
  status: {
    checked: String
    /*
    received: { type: Boolean, default: false },
    sent: { type: Boolean, default: false },
    */
  },
  match: {
    accname: String,
    notes: String,
    date: String
  },
  gifts: [{
    accname: String,
    notes: String,
    date: String
  }],
  notes: String,
  notification: {
    sent: {
      MATCHED: { type: Boolean, default: false} ,
      SENT_GIFT: { type: Boolean, default: false} ,
      RECEIVED_GIFT: { type: Boolean, default: false} 
    },
    subscriptions: [{
      endpoint: String,
      expirationTime: Number,
      keys: {
        p256dh: String,
        auth: String
      }
    }]
  },
  registered: String,
  world: Number
});

module.exports = mongoose.model('Participant', participantSchema);
