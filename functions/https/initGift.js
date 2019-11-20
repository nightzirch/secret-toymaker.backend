const functions = require('firebase-functions');
const { setAllRandomParticipant} = require('../utils/utils');

// TODO: this will be for folks who wantt o volunteer for the second gifting session
module.exports = functions.https.onCall(async({ user, isPrimaryGift }, context) => {
  //await setAllRandomParticipant()
  /*
  let uuid = await getUUID(user)
  if(uuid.error){return {error: "No Gw2 account connected" }}
  uuid = uuid.success

  let gifteeUUID = await getRandomParticipant(uuid)
  if(gifteeUUID.error){return {error: "No Account to match to" }}
  gifteeUUID = gifteeUUID.success


  console.log(uuid)
  console.log(gifteeUUID)

   */

  /*
  utils.getParticipation(user)
    .then(participationDoc => {
      if (!participationDoc.exists) { return null }
      const participation = participationDoc.data();

      const getReceiver = new Promise((resolve, reject) => {
        if (isPrimaryGift) {
          //resolve(participation.match);
          utils.getRandomParticipant(user)
            .then(receiver => resolve(receiver))
            .catch(err => reject(err))
        } else {
          utils.getRandomParticipant(user)
            .then(receiver => resolve(receiver))
            .catch(err => reject(err))
        }
      });

      getReceiver
        .then(receiverDoc => {
          if (!receiverDoc.exists) { return null }
          const receiver = receiverDoc.data();

          db.collection('gifts')
            .add({
              sender: db.collection('participants').doc(user.uid),
              receiver: db.collection('participants').doc(receiver.uid),
              initialized: moment().format(),
              sent: null,
              received: null,
              reported: null,
            })
            .then(doc => {
              // Add to participation
              var gifts = participation.gifts;
              gifts.push(doc);

              db.collection('events').doc('2019').collection('participants').doc(user.uid)
                .set({ gifts }, { merge: true })
                .then(doc => {
                  return 'Success';
                });
            })
            .catch(err => {
              console.log('Error initializing gift:', err);
              return err;
            });
        })
        .catch(err => {
          console.log('Error getting receiver: ', err);
          return err;
        });
    })
    .catch(err => {
      console.log('Error getting participation: ', err);
      return err;
    });

   //*/
});