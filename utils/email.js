const { db } = require("../config/firebase");
const { mailgunConfig } = require("../config/mailgun");
const CollectionTypes = require("../utils/types/CollectionTypes");

const filterToymakersConsents = async consentKey => {
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

  const toymakersWithConsent = toymakers.filter(t =>
    !consentKey ? true : t.consents && t.consents[consentKey]
  );

  return { success: toymakersWithConsent };
};

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
    .map(p => {
      const toymaker = toymakers.find(t => t.gameAccountUUID === p.gameAccountUUID) || {};

      return Object.assign({}, p, {
        uid: toymaker.uid,
        name: toymaker.name
      });
    })
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
    .collection(CollectionTypes.EMAILS)
    .add(data)
    .then(() => {
      console.log(`Successfully queued email to ${data.to || data.toUids}.`);
      return { success: "Queued email(s) for delivery!" }
    })
    .catch(error => {
      console.log(error);
      return { error: "Error queueing email(s).", trace: error }
    });
};

const sendEmailTemplate = async ({
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
    .collection(CollectionTypes.EMAILS)
    .add(data)
    .then(() => {
      console.log(`Successfully queued email with template to ${data.to || data.toUids}.`);
      return { success: "Queued email(s) for delivery!" }
    })
    .catch(error => {
      console.log(error);
      return { error: "Error queueing email(s).", trace: error }
    });
};

module.exports = {
  filterToymakersConsents,
  filterParticipantsConsentsByEventDoc,
  sendEmail,
  sendEmailTemplate
};
