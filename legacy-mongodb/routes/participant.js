const participantService = new (require('../services/participantService'))();
const constants = require('../config/constants');
const validation = require('../libs/validation');
const timeboxHelper = new (require('../libs/timeboxHelper'))();
const moment = require('moment');

let Participant = require('../models/Participant');

module.exports = {
  register: (req, res) => {
    if (timeboxHelper.getStage() != 'SIGNUP') {
      return res.status(400).json({
        error: { status: constants.NOT_ACCEPTING, message: "Not accepting signups" }
      });
    }

    if (!req.body || !req.body.apitoken || !req.body.email || !req.body.notes) {
      return res.status(200).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    } else {
      if (!validation.validateParticipant(req.body.apitoken, req.body.email, req.body.notes)) {
        return res.status(200).json({
          error: { status: constants.INVALID_REQUEST_ERROR, message: "Invalid request body" }
        });
      }
    }

    let participant = new Participant();
    // DO API CALL TO /TOKENINFO
    participantService.getTokenInfoFromAPI(req.body.apitoken).then((value) => {
      if(!value.id) {
        // WRONG API TOKEN
        return res.status(400).json({
          error: {
            status: constants.WRONG_API_TOKEN,
            message: "Wrong API token"
          }
        });
      }

      if(value.name === "Secret Toymaker") {
        // DO API CALL TO /ACCOUNT
        participantService.getParticipantFromAPI(req.body.apitoken).then((value) => {
          if(!value.id) {
            // WRONG API TOKEN
            return res.status(400).json({
              error: {
                status: constants.WRONG_API_TOKEN,
                message: "Wrong API token"
              }
            });
          }

          // SUCCESS - WE HAVE ACCOUNT DATA FROM ANET API
          let accountData = value;

          participant.access = value.access;
          participant.accname = value.name;
          participant.commander = value.commander;
          participant.created = value.created;
          participant.guilds = value.guilds;
          participant.world = value.world;
          participant.apitoken = req.body.apitoken;
          participant.email = req.body.email;
          participant.notes = req.body.notes;
          participant.registered = new Date().toISOString();
          participant.match = {
            accname: null,
            notes: null
          }

          participantService.getParticipantFromAccname(value.name).then((value) => {
            if(value) {
              // USER EXISTS
              return res.status(200).json({
                data: {
                  status: constants.USER_EXISTS,
                  message: "User already exists"
                }
              });
            } else {
              // NEW USER
              participant.save((err) => {
                if (err) {
                  return res.status(400).json({
                    error: {
                      status: constants.DATABASE_ERROR,
                      message: "An error occured when registering participant"
                    }
                  });
                }

                return res.status(200).json({
                  data: Object.assign({}, participant._doc, {
                    status: constants.SUCCESS,
                    message: "Successfully registered participant",
                  })
                });
              });
            }
          })
          .catch((reason) => {
            // ERROR - DATABASE ERROR
            return res.status(400).json({error: reason, status: constants.DATABASE_ERROR});
          });
        })
        .catch((reason) => {
          // ERROR - NETWORK CALL ERROR
          return res.status(400).json({error: reason, status: constants.NETWORK_CALL_ERROR});
        });
      } else {
        // NAME OF API TOKEN WAS NOT "Secret Toymaker"
        return res.status(400).json({
          error: {
            status: constants.WRONG_API_TOKEN_NAME,
            message: "API token is not named 'Secret Toymaker'"
          }
        });
      }
    });
  },

  edit: (req, res) => {
    if (timeboxHelper.getStage() != 'SIGNUP') {
      return res.status(400).json({
        error: { status: constants.NOT_ACCEPTING, message: "Not accepting profile edits" }
      });
    }

    if (!req.body || !req.body.userId || !req.body.email || !req.body.notes) {
      return res.status(400).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    } else {
      if (!validation.validateEmail(req.body.email) || !validation.validateNotes(req.body.notes)) {
        return res.status(200).json({
          error: { status: constants.INVALID_REQUEST_ERROR, message: "Invalid request body" }
        });
      }
    }

    participantService.getParticipantFromID(req.body.userId).then((value) => {
      participantService.updateParticipant(req.body.userId, {
        email: req.body.email,
        notes: req.body.notes
      }).then((value) => {
        return res.status(200).json({
          data: {
            status: constants.UPDATE_SUCCESS,
            message: "User updated.",
            participant: value
          }
        });
      });
    }).catch((reason) => {
      // ERROR - DATABASE ERROR
      return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
    });
  },

  get: (req, res) => {
    if (!req.body || !req.body.apitoken) {
      return res.status(200).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    } else {
      if (!validation.validateAPIToken(req.body.apitoken)) {
        return res.status(200).json({
          error: { status: constants.INVALID_REQUEST_ERROR, message: "Invalid request body" }
        });
      }
    }

    // DO API CALL TO /TOKENINFO
    participantService.getTokenInfoFromAPI(req.body.apitoken).then((value) => {
      if (!value.id) {
        // WRONG API TOKEN
        return res.status(400).json({
          error: {
            status: constants.WRONG_API_TOKEN,
            message: "Wrong API token"
          }
        });
      }

      if (value.name === "Secret Toymaker") {
        // DO API CALL TO /ACCOUNT
        participantService.getParticipantFromAPI(req.body.apitoken).then((value) => {
          if (!value.id) {
            // WRONG API TOKEN
            return res.status(400).json({
              error: {
                error: reason,
                status: constants.WRONG_API_TOKEN,
                message: "Wrong API token"
              }
            });
          }

          participantService.getParticipantFromAccname(value.name).then((value) => {
            if (value) {
              // USER EXISTS
              return res.status(200).json({
                data: {
                  status: constants.SUCCESS,
                  message: "User found.",
                  participant: value
                }
              });
            } else {
              // NEW USER
              return res.status(400).json({
                error: {
                  status: constants.USER_DOES_NOT_EXIST,
                  message: "User does not exist"
                }
              });
            }
          })
            .catch((reason) => {
              // ERROR - DATABASE ERROR
              return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
            });
        })
          .catch((reason) => {
            // ERROR - NETWORK CALL ERROR
            return res.status(400).json({ error: reason, status: constants.NETWORK_CALL_ERROR });
          });
      } else {
        // NAME OF API TOKEN WAS NOT "Secret Toymaker"
        return res.status(200).json({
          error: {
            status: constants.WRONG_API_TOKEN_NAME,
            message: "API token is not named 'Secret Toymaker'"
          }
        });
      }
    });
  },

  match: (req, res) => {
    if (timeboxHelper.getStage() != 'MATCHING') {
      return res.status(400).json({
        error: { status: constants.NOT_ACCEPTING, message: "Not accepting action" }
      });
    }

    if (!req.body || !req.body.apitoken) {
      return res.status(200).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    } else {
      if (!validation.validateAPIToken(req.body.apitoken)) {
        return res.status(200).json({
          error: { status: constants.INVALID_REQUEST_ERROR, message: "Invalid request body" }
        });
      }
    }

    // DO API CALL TO /TOKENINFO
    participantService.getTokenInfoFromAPI(req.body.apitoken).then((value) => {
      if(!value.id) {
        // WRONG API TOKEN
        return res.status(400).json({error: reason, status: constants.WRONG_API_TOKEN});
      }

      if(value.name === "Secret Toymaker") {
        // DO API CALL TO /ACCOUNT
        participantService.getParticipantFromAPI(req.body.apitoken).then((value) => {
          if(!value.id) {
            // WRONG API TOKEN
            return res.status(200).json({
              error: {
                error: reason,
                status: constants.WRONG_API_TOKEN,
                message: "Wrong API token"
              }
            });
          }

          participantService.getParticipantFromAccname(value.name).then((value) => {
            if(value) {
              // USER EXISTS
              if(value.match.accname) {
                return res.status(200).json({
                  data: {
                    status: constants.SUCCESS,
                    message: "User found.",
                    match: value.match
                  }
                });
              } else {
                return res.status(200).json({
                  error: {
                    status: constants.NO_MATCH,
                    message: "User found, but with no match."
                  }
                });
              }

            } else {
              // NEW USER
              return res.status(200).json({
                error: {
                  status: constants.USER_DOES_NOT_EXIST,
                  message: "User does not exist"
                }
              });
            }
          })
          .catch((reason) => {
            // ERROR - DATABASE ERROR
            return res.status(400).json({error: reason, status: constants.DATABASE_ERROR});
          });
        })
        .catch((reason) => {
          // ERROR - NETWORK CALL ERROR
          return res.status(400).json({error: reason, status: constants.NETWORK_CALL_ERROR});
        });
      } else {
        // NAME OF API TOKEN WAS NOT "Secret Toymaker"
        return res.status(200).json({
          error: {
            status: constants.WRONG_API_TOKEN_NAME,
            message: "API token is not named 'Secret Toymaker'"
          }
        });
      }
    });
  },

  newMatch: (req, res) => {
    if (timeboxHelper.getStage() != 'GIFTING') {
      return res.status(400).json({
        error: { status: constants.NOT_ACCEPTING, message: "Not accepting action" }
      });
    }

    if (!req.body || !req.body.userId) {
      return res.status(400).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    }

    participantService.getParticipantFromID(req.body.userId).then(participant => {
      // Checks if they have 3 or more gifts in the last 24 hours
      const now = moment(),
            yesterday = moment().subtract(1, 'days');
      
      var giftedWithin24Hours = participant.gifts.filter(g => moment(g.date).isBetween(yesterday, now, null, '[]'));

      if(giftedWithin24Hours.length >= 3) {
        return res.status(400).json({
          error: {
            status: constants.TOO_MANY_GIFTS,
            message: "You have requested to gift too many people within 24 hours. Wait a day and try again."
          }
        });
      }

      var excludes = [participant.accname];
      
      if(participant.match.accname) {
        excludes.push(participant.match.accname);
      }
      
      if(participant.gifts.length > 0) {
        excludes = excludes.concat(participant.gifts.map(p => p.accname));
      }

      participantService.getRandomParticipant(excludes).then(randomParticipant => {
        if(!randomParticipant) {
          return res.status(400).json({
            error: {
              message: 'No results found',
              status: constants.NO_RESULTS
            }
          });
        }

        participantService.updateParticipant(req.body.userId, {
          gifts: participant.gifts.concat({
            accname: randomParticipant.accname,
            notes: randomParticipant.notes,
            date: new Date().toISOString(),
          })
        }).then((value) => {
          return res.status(200).json({
            data: {
              status: constants.UPDATE_SUCCESS,
              message: "Additional match added.",
              participant: value
            }
          });
        });
      })
      .catch((reason) => {
        // Could not find anyone?
        return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
      })
    }).catch((reason) => {
      // ERROR - DATABASE ERROR
      return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
    });
  },

  matchChecked: (req, res) => {
    if (timeboxHelper.getStage() != 'GIFTING') {
      return res.status(400).json({
        error: { status: constants.NOT_ACCEPTING, message: "Not accepting action" }
      });
    }

    if (!req.body || !req.body.userId) {
      return res.status(400).json({
        error: { status: constants.MISSING_REQUEST_ERROR, message: "Missing request body" }
      });
    }

    participantService.getParticipantFromID(req.body.userId).then(participant => {
      var now = new Date().toISOString();
      participantService.updateParticipant(req.body.userId, {
        status: Object.assign({}, participant.status, {
          checked: now
        })
      }).then((value) => {
        return res.status(200).json({
          data: {
            status: constants.UPDATE_SUCCESS,
            message: "Match checked.",
            participant: value
          }
        });
      });
    })
    .catch((reason) => {
      // Could not find anyone?
      return res.status(400).json({ error: reason, status: constants.DATABASE_ERROR });
    })
  },

  amount: (req, res) => {
    participantService.getAmountOfParticipants().then((value) => {
      return res.status(200).json({
        data: {
          status: constants.SUCCESS,
          amount: value
        }
      });
    }).catch((reason) => {
      // ERROR - DATABASE ERROR
      return res.status(400).json({error: reason, status: constants.DATABASE_ERROR});
    });
  }
};
