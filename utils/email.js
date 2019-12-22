const db = require("../config/db");
const { mailgunConfig } = require("../config/mailgun");

const sendEmail = ({ emailAddress, userIds, subject, message }) => {
  const data = {
    from: mailgunConfig.sender,
    subject: subject,
    text: message
  };

  if (emailAddress) {
    data.to = emailAddress;
  } else if (userId) {
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
  } else if (userId) {
    data.toUids = userIds;
  }

  return db
    .collection("emails")
    .add(data)
    .then(() => ({ success: "Queued email(s) for delivery!" }))
    .catch(error => ({ error: "Error queueing email(s).", trace: error }));
};

module.exports = { sendEmail, sendEmailTemplate };
