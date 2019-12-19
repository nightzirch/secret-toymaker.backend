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
const { setMatches } = require("./schedule/setMatches");

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

// Scheduled function for setting matches
exports.setMatches = setMatches;

// admin commands
//exports.getNotSent = getNotSent
//exports.getNotReceived = getNotReceived
//exports.getReported = getReported
//exports.testing = require("./testing")