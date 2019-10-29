require('firebase/firestore');
const admin = require('firebase-admin');

const db = require('../config/db');

const getParticipant = user => {
  return db.collection('participants').doc(user.uid).get()
    .then(doc => doc)
    .catch(err => err);
};

const getParticipation = user => {
  return db.collection('events').doc('2019').collection('participants').doc(user.uid)
    .get()
    .then(doc => doc)
    .catch(err => {
      console.log('Error getting participation: ', err);
    });
};

const getRandomParticipant = user => new Promise((resolve, reject) => {
  db.collection('events').doc('2019').collection('participants')
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const excluded = [user.uid];
        
        var participant;
        var maxAttempts = 10,
          attempts = 0;

        const getRandom = () => {
          const randomInt = Math.floor(Math.random() * snapshot.size);
          const randomParticipant = snapshot.docs[randomInt].data();
          if (!excluded.includes(randomParticipant.uid)) {
            return randomParticipant;
          }
        }

        while (!participant && attempts < maxAttempts) {
          participant = getRandom();
          attempts = attempts + 1;
        }

        console.log(`Found a participant fulfilling all criteria after ${attempts} attempts.`);

        if (!participant) { reject(`Found no participants fulfilling all criteria after ${attempts} attempts.`) }
        resolve(participant.participant.get());
      }
      reject('Found no participants in the event');
    });
});

module.exports = { getParticipant, getParticipation, getRandomParticipant };