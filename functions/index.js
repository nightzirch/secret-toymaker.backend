const initGift = require("./https/initGift");
const sendGift = require("./https/sendGift");
const receiveGift = require("./https/receiveGift");
const reportGift = require("./https/reportGift");
const stage = require("./https/stage");
const participate = require("./https/participate");
const {assignedGiftees, updateApiKey, updateApiKeyNote, updateVolunteer} = require("./https/gw2Accounts")

exports.initGift = initGift;
exports.sendGift = sendGift;
exports.receiveGift = receiveGift;
exports.reportGift = reportGift;
exports.stage = stage;
exports.participate = participate;
exports.updateApiKey = updateApiKey
exports.updateApiKeyNote = updateApiKeyNote
exports.assignedGiftees = assignedGiftees
exports.updateVolunteer = updateVolunteer

// for setting the matches, beware
exports.setmatches = require("./https/setMatches")