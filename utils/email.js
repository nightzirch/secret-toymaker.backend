const { db } = require("../config/firebase");
const { mailgunConfig } = require("../config/mailgun");
const CollectionTypes = require("../utils/types/CollectionTypes");

const filterParticipantsConsentsByEventDoc = async (consentKey, eventDoc) => {
  const participantsDoc = eventDoc.collection(
    CollectionTypes.EVENTS__PARTICIPANTS
  );
  const participantsSnap = await participantsDoc.get();

  if (participantsSnap.empty) {
    return {
      error: "No participants to send emails to found."
    };
  }

  const participants = [];
  participantsSnap.forEach(p => {
    const data = p.data();
    participants.push(data);
  });

  const toymakersDoc = db.collection(CollectionTypes.TOYMAKERS);
  const toymakersSnap = await toymakersDoc.get();

  if (toymakersSnap.empty) {
    return {
      error: "No toymakers to send emails to found."
    };
  }

  let toymakers = [];
  toymakersSnap.forEach(t => {
    const data = t.data();
    toymakers.push(data);
  });

  const participantsWithConsent = participants
    .map(p =>
      Object.assign({}, p, {
        uid: (
          toymakers.find(t => t.gameAccountUUID === p.gameAccountUUID) || {}
        ).uid
      })
    )
    .filter(p =>
      toymakers
        .filter(t =>
          !consentKey ? true : t.consents && t.consents[consentKey]
        )
        .map(t => t.gameAccountUUID)
        .includes(p.gameAccountUUID)
    );

  return { success: participantsWithConsent };
};

const sendEmail = ({ emailAddress, userIds, subject, message }) => {
  const data = {
    from: mailgunConfig.sender,
    subject: subject,
    text: message
  };

  if (emailAddress) {
    data.to = emailAddress;
  } else if (userIds) {
    data.toUids = userIds;
  }

  return db
    .collection("emails")
    .add(data)
    .then(() => ({ success: "Queued email(s) for delivery!" }))
    .catch(error => ({ error: "Error queueing email(s).", trace: error }));
};

const sendEmailTemplate = ({
  emailAddress,
  userIds,
  templateName,
  templateData
}) => {
  const data = {
    from: mailgunConfig.sender,
    template: {
      name: templateName,
      data: templateData
    }
  };

  if (emailAddress) {
    data.to = emailAddress;
  } else if (userIds) {
    data.toUids = userIds;
  }

  return db
    .collection("emails")
    .add(data)
    .then(() => ({ success: "Queued email(s) for delivery!" }))
    .catch(error => ({ error: "Error queueing email(s).", trace: error }));
};

module.exports = {
  filterParticipantsConsentsByEventDoc,
  sendEmail,
  sendEmailTemplate
};
