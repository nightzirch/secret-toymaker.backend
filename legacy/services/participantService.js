const settings = require('../config/settings');
const api = require('../libs/api');
const mongoose = require('mongoose');

let Participant;

try {
  Participant = mongoose.model('Participant');
} catch(err){
  Participant = require('../models/Participant');
}

module.exports = class PostsService {
  constructor(){

  }

  getTokenInfoFromAPI(apitoken){
    let rawUrl = settings.anetURL + settings.tokeninfo;
    if(!apitoken){
      return Promise.reject({error: "Empty parameter: apitoken", status: constants.MISSING_REQUEST_ERROR});
    }
    let url = api.replaceUrlParameter(rawUrl, {apitoken: apitoken});
    return api.getPromise(url);
  }

  getParticipantFromAPI(apitoken){
    let rawUrl = settings.anetURL + settings.account;
    if(!apitoken){
      return Promise.reject({error: "Empty parameter: apitoken", status: constants.MISSING_REQUEST_ERROR});
    }
    let url = api.replaceUrlParameter(rawUrl, {apitoken: apitoken});
    return api.getPromise(url);
  }

  getParticipantFromID(id){
    const query = { _id: id };
    return new Promise((resolve, reject) => {
      Participant.findOne(query, (err, participant) => {
        if (err) {
          reject(err);
        } else {
          resolve(participant);
        }
      });
    });
  }

  getParticipantFromAccname(accname) {
    const query = {accname: accname};
    return new Promise((resolve, reject) => {
      Participant.findOne(query, (err, participant) => {
        if(err){
          reject(err);
        } else {
          resolve(participant);
        }
      });
    });
  }

  getRandomParticipant(excluded = []) {
    const query = { accname: { $nin: excluded }};
    return new Promise((resolve, reject) => {
      Participant.find(query, (err, participants) => {
        if (err) {
          reject(err);
        } else {
          var randomNumber = Math.floor(Math.random() * participants.length)
          resolve(participants[randomNumber]);
        }
      });
    });
  }

  getAmountOfParticipants() {
    return new Promise((resolve, reject) => {
      Participant.find({}, (err, participants) => {
        if(err){
          reject(err);
        } else {
          resolve(participants.length);
        }
      });
    });
  }

  updateParticipant(id, updatedData) {
    const query = { _id: id };
    return new Promise((resolve, reject) => {
      Participant.findOne(query, (err, participant) => {
        if (err) {
          reject(err);
        } else {
          participant.set(updatedData);
          participant.save((err, updatedParticipant) => {
            if (err) {
              reject(err);
            } else {
              resolve(participant);
            }
          })
        }
      });
    });
  }
};
