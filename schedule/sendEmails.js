const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { getCurrentStage } = require("../utils/getCurrentStage");
const { StageTypes } = require("../config/constants");
const { db } = require("../config/firebase");
const {
  filterParticipantsConsentsByEventDoc,
  sendEmailTemplate,
} = require("../utils/email");

/**
 * @namespace sendSignupStarts
 * @return {sendSignupStarts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupStarts = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are registered at the site.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.SIGNUP) {
      return {
        success: `Not in signup stage. Skipping sending emails. Current stage is ${currentStage.type}`,
      };
    }

    const { year } = currentStage;

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails } = event;

    if (emails.signupStart) {
      return { success: "Emails for signing up are already sent." };
    }

    const participantsWithConsentResponse =
      await filterParticipantsConsentsByEventDoc("emailFutureEvents", eventDoc);

    if (participantsWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: participantsWithConsentResponse.error,
      };
    }
    const participantsWithConsent = participantsWithConsentResponse.success;

    // TODO: Create the template and add data.
    // TODO: Change so we send individual emails so we can use variables.
    const response = await sendEmailTemplate({
      userIds: participantsWithConsent.map((p) => p.uid),
      templateName: "signupStart",
      templateData: { year },
    });

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { signupStart: true }),
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch((error) => ({
          error: "Failed to update emails' sent state.",
          trace: error,
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails for signing up." };
      }
      return {
        error: "Could not  sent emails for signing up.",
        trace: emailsStatusUpdateResponse.error,
      };
    } else {
      return {
        error: "Could nnot send emails for signing up.",
        trace: response.error,
      };
    }
  }
);

/**
 * @namespace sendEventStarts
 * @return {sendEventStarts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendEventStarts = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are participating in the current event, about us entered the gifting stage.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.GIFTING) {
      return {
        success: `Not in gifting stage. Skipping sending emails. Current stage is ${currentStage.type}`,
      };
    }

    const { year } = currentStage;

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails, name: eventName } = event;

    if (emails.eventStart) {
      return { success: "Emails for event start are already sent." };
    }

    const participantsWithConsentResponse =
      await filterParticipantsConsentsByEventDoc(null, eventDoc);

    if (participantsWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: participantsWithConsentResponse.error,
      };
    }
    const participantsWithConsent = participantsWithConsentResponse.success;

    const response = await Promise.all(
      participantsWithConsent
        .filter((p) => p.uid && p.email)
        .map((p) =>
          sendEmailTemplate({
            userIds: [p.uid],
            templateName: "eventStart",
            templateData: {
              eventName,
              username: p.name || p.id || "Toymaker",
              year,
            },
          })
        )
    )
      .then((responses) => responses[0])
      .catch((e) => {
        console.log(e);
        return { error: "Failed to send emails", trace: e };
      });

    if (!response) {
      return { success: "No participants to email." };
    }

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { eventStart: true }),
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch((error) => ({
          error: "Failed to update emails' sent state.",
          trace: error,
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails about event start." };
      }

      return {
        error: "Could not send emails about event start.",
        trace: emailsStatusUpdateResponse.error,
      };
    } else {
      return {
        error: "Could not send emails about event start.",
        trace: response.error,
      };
    }
  }
);

/**
 * @namespace sendEventEnd
 * @return {sendEventEnd~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendEventEnd = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are participating in the current event and did not yet send their gift.
   * @inner
   * @returns {undefined}
   */
  async () => {}
);

/**
 * @namespace sendExtending2022
 * @return {sendExtending2022~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendExtending2022 = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are registered at the site.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.GIFTING) {
      return {
        success: `Not in gifting stage. Skipping sending emails. Current stage is ${currentStage.type}`,
      };
    }

    const { year } = currentStage;

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails, name } = event;

    if (emails.extending2022) {
      return { success: "Emails for extending the event are already sent." };
    }

    const participantsWithConsentResponse =
      await filterParticipantsConsentsByEventDoc(null, eventDoc);

    if (participantsWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: participantsWithConsentResponse.error,
      };
    }
    const participantsWithConsent = participantsWithConsentResponse.success;

    // Chunking userIds into groups of 500
    const allUserIds = participantsWithConsent.map((p) => p.uid);

    const response = await Promise.all(
      allUserIds.map((userId) =>
        sendEmailTemplate({
          userIds: [userId],
          templateName: "extending2022",
          templateData: { name },
        })
      )
    )
      .then((responses) => responses[0])
      .catch((e) => ({ error: "Failed to send emails", trace: e }));

    if (!response) {
      return { success: "No participants to email." };
    }

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { extending2022: true }),
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch((error) => ({
          error: "Failed to update emails' sent state.",
          trace: error,
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails for signing up." };
      }
      return {
        error: "Could not  sent emails for signing up.",
        trace: emailsStatusUpdateResponse.error,
      };
    } else {
      return {
        error: "Could nnot send emails for signing up.",
        trace: response.error,
      };
    }
  }
);

/**
 * @namespace sendSorry2022
 * @return {sendSorry2022~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSorry2022 = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are registered at the site.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentStage = await getCurrentStage();

    const { year } = currentStage;

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(year);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails, name } = event;

    if (emails.sorry2022) {
      return { success: "Emails apologizing are already sent." };
    }

    const participantsWithConsentResponse =
      await filterParticipantsConsentsByEventDoc(null, eventDoc);

    if (participantsWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: participantsWithConsentResponse.error,
      };
    }
    const participantsWithConsent = participantsWithConsentResponse.success;
    const allUserIds = participantsWithConsent.map((p) => p.uid);

    const response = await Promise.all(
      allUserIds.map((userId) =>
        sendEmailTemplate({
          userIds: [userId],
          templateName: "sorry2022",
          templateData: { name },
        })
      )
    )
      .then((responses) => responses[0])
      .catch((e) => ({ error: "Failed to send emails", trace: e }));

    if (!response) {
      return { success: "No participants to email." };
    }

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { sorry2022: true }),
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch((error) => ({
          error: "Failed to update emails' sent state.",
          trace: error,
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails apologizing." };
      }
      return {
        error: "Could not  sent emails apologizing.",
        trace: emailsStatusUpdateResponse.error,
      };
    } else {
      return {
        error: "Could nnot send emails apologizing.",
        trace: response.error,
      };
    }
  }
);

module.exports = {
  sendSignupStarts,
  sendEventStarts,
  sendEventEnd,
  sendExtending2022,
  sendSorry2022,
};
