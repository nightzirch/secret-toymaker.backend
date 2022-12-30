const { getAlerts } = require("./https/alerts");
const { getEvents } = require("./https/events");
const { stage } = require("./https/stage");
const { participate, participateStatus } = require("./https/participate");
const {
  assignedGiftees,
  updateApiKey,
  volunteer,
} = require("./https/gw2Accounts");
const { updateAllAccountInfo } = require("./schedule/updateAllAccountInfo");
const {
  getGifts,
  donateGift,
  updateGiftSentStatus,
  updateGiftReceivedStatus,
  updateGiftReportedStatus,
} = require("./https/gifts");
const { getStats } = require("./https/stats");
const {
  sendSignupStarts,
  sendEventStarts,
  sendEventEnd,
} = require("./schedule/sendEmails");
const { sendSignupReminder } = require("./schedule/sendSignupReminder");
const { setMatches } = require("./schedule/setMatches");
const { onUserCreated } = require("./triggers/auth");

// Alerts
exports.getAlerts = getAlerts;

// Events
exports.getEvents = getEvents;

// Gifts
exports.getGifts = getGifts;
exports.donateGift = donateGift;
exports.updateGiftSentStatus = updateGiftSentStatus;
exports.updateGiftReceivedStatus = updateGiftReceivedStatus;
exports.updateGiftReportedStatus = updateGiftReportedStatus;

// Stage
exports.stage = stage;

exports.participate = participate;
exports.updateApiKey = updateApiKey;
exports.assignedGiftees = assignedGiftees;
exports.volunteer = volunteer;
exports.getStats = getStats;
exports.participateStatus = participateStatus;

// Scheduled function for sending emails
exports.sendSignupStarts = sendSignupStarts;
exports.sendSignupReminder = sendSignupReminder;
exports.sendEventStarts = sendEventStarts;
exports.sendEventEnd = sendEventEnd;

// Scheduled function for setting matches
exports.setMatches = setMatches;

// Scheduled function for updating account info
exports.updateAllAccountInfo = updateAllAccountInfo;

// Triggers
exports.onUserCreated = onUserCreated;

// admin commands
//exports.getNotSent = getNotSent
//exports.getNotReceived = getNotReceived
//exports.getReported = getReported
//exports.testing = require("./testing")
