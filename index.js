const { getAlerts } = require("./https/alerts");
const { getEvents } = require("./https/events");
const { stage } = require("./https/stage");
const { participate, participateStatus } = require("./https/participate");
const {
  assignedGiftees,
  updateApiKey,
  volunteer,
} = require("./https/gw2Accounts");
const { updateAllGameAccounts } = require("./schedule/updateAllGameAccounts");
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
  sendExtending2022,
  sendSorry2022,
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
exports.sendExtending2022 = sendExtending2022;
exports.sendSorry2022 = sendSorry2022;

// Scheduled function for setting matches
exports.setMatches = setMatches;

// Scheduled function for updating account info
exports.updateAllGameAccounts = updateAllGameAccounts;

// Triggers
exports.onUserCreated = onUserCreated;

// admin commands
//exports.getNotSent = getNotSent
//exports.getNotReceived = getNotReceived
//exports.getReported = getReported
//exports.testing = require("./testing")
