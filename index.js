const { getAlerts } = require("./https/alerts");
const { stage } = require("./https/stage");
const { participate, participateStatus } = require("./https/participate");
const {
  assignedGiftees,
  updateApiKey,
  volunteer
} = require("./https/gw2Accounts");
const {
  getGifts,
  donateGift,
  updateGiftSentStatus,
  updateGiftReceivedStatus,
  updateGiftReportedStatus
} = require("./https/gifts");
const {
  getNotSent,
  getNotReceived,
  getReported,
  getStats
} = require("./https/stats");
const { sendSignupStarts, sendSignupReminder, sendEventStarts, sendEventEnd} = require("./schedule/sendEmails");
const { setMatches } = require("./schedule/setMatches");

const { fixF2PStatus } = require("./schedule/fixF2PStatus");

// Alerts
exports.getAlerts = getAlerts;

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
exports.fixF2PStatus = fixF2PStatus;

// admin commands
//exports.getNotSent = getNotSent
//exports.getNotReceived = getNotReceived
//exports.getReported = getReported
//exports.testing = require("./testing")