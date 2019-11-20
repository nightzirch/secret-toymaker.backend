const initGift = require("./https/initGift");
const sendGift = require("./https/sendGift");
const receiveGift = require("./https/receiveGift");
const reportGift = require("./https/reportGift");
const stage = require("./https/stage");
const participate = require("./https/participate");

exports.initGift = initGift;
exports.sendGift = sendGift;
exports.receiveGift = receiveGift;
exports.reportGift = reportGift;
exports.stage = stage;
exports.participate = participate;
exports.updateApiKey = require("./https/gw2Accounts").updateApiKey
exports.updateApiKeyNote = require("./https/gw2Accounts").updateApiKeyNote
exports.setmatches = require("./https/setMatches")