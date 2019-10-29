const express = require('express');
const constants = require('../config/constants');
const participant = require('./participant');
const push = require('./push');
const site = require('./site');

let router = express.Router();

module.exports = () => {
  router.route('/register').post(participant.register);
  router.route('/edit').post(participant.edit);
  router.route('/participant').post(participant.get);
  router.route('/amount').get(participant.amount);
  router.route('/match-checked').post(participant.matchChecked);
  router.route('/new-match').post(participant.newMatch);
  router.route('/stage').get(site.getStage);
  router.route('/subscribe').post(push.subscribe);
  router.route('/unsubscribe').post(push.unsubscribe);

  //wildcard api route
  router.route('*').get((req, res) => {
    res.sendStatus(404);
  });

  return router;
};
