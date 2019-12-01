const { stage } = require("./https/stage");
const { participate } = require("./https/participate");
const { assignedGiftees, updateApiKey, updateApiKeyNote, volunteer } = require("./https/gw2Accounts")
const { sendGift, receiveGift, reportGift, getNotSent, getNotReceived, getReported} = require("./https/gifts")

exports.sendGift = sendGift;
exports.receiveGift = receiveGift;
exports.reportGift = reportGift;
exports.stage = stage;
exports.participate = participate;
exports.updateApiKey = updateApiKey
exports.updateApiKeyNote = updateApiKeyNote
exports.assignedGiftees = assignedGiftees
exports.volunteer = volunteer


// admin commands
exports.getNotSent = getNotSent
exports.getNotReceived = getNotReceived
exports.getReported = getReported
//exports.testing = require("./testing")

// for setting the matches, beware can only be done once
exports.setmatches = require("./https/setMatches")