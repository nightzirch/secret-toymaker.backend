const { getAlerts } = require("./https/alerts");
const { stage } = require("./https/stage");
const { participate, participateStatus } = require("./https/participate");
const { assignedGiftees, updateApiKey, volunteer } = require("./https/gw2Accounts")
const { sendGift, receiveGift, reportGift } = require("./https/gifts")
const { getNotSent, getNotReceived, getReported, getStats} = require("./https/stats")

exports.getAlerts = getAlerts;
exports.sendGift = sendGift;
exports.receiveGift = receiveGift;
exports.reportGift = reportGift;
exports.stage = stage;
exports.participate = participate;
exports.updateApiKey = updateApiKey
exports.assignedGiftees = assignedGiftees
exports.volunteer = volunteer
exports.getStats = getStats
exports.participateStatus = participateStatus


// admin commands
//exports.getNotSent = getNotSent
//exports.getNotReceived = getNotReceived
//exports.getReported = getReported
//exports.testing = require("./testing")

// for setting the matches, beware can only be done once
// exports.setmatches = require("./https/setMatches")