const functions = require("firebase-functions");
const { matchAllParticipants } = require("../utils/matchAllParticipants");
const { EVENT } = require("../config/constants");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { getCurrentStage } = require("../utils/getCurrentStage");
const { StageTypes } = require("../config/constants");
const { db } = require("../config/firebase");
const {
  filterToymakersConsents,
  filterParticipantsConsentsByEventDoc,
  sendEmailTemplate
} = require("../utils/email");

/**
 * @namespace sendSignupStarts
 * @return {sendSignupStarts~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupStarts = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are registered at the site.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.SIGNUP) {
      return {
        success: `Not in signup stage. Skipping sending emails. Current stage is ${currentStage.type}`
      };
    }

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails } = event;

    if (emails.signupStart) {
      return { success: "Emails for signing up are already sent." };
    }

    const participantsWithConsentResponse = await filterParticipantsConsentsByEventDoc(
      "emailFutureEvents",
      eventDoc
    );
    if (participantsWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: participantsWithConsentResponse.error
      };
    }
    const participantsWithConsent = participantsWithConsentResponse.success;

    // TODO: Create the template and add data.
    // TODO: Change so we send individual emails so we can use variables.
    const response = await sendEmailTemplate({
      userIds: participantsWithConsent.map(p => p.uid),
      templateName: "signupStart",
      templateData: {
        year: EVENT
      }
    });

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { signupStart: true })
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch(error => ({
          error: "Failed to update emails' sent state.",
          trace: error
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails for signing up." };
      }
      return {
        error: "Could not  sent emails for signing up.",
        trace: emailsStatusUpdateResponse.error
      };
    } else {
      return {
        error: "Could nnot send emails for signing up.",
        trace: response.error
      };
    }
  }
);

/**
 * @namespace sendSignupReminder
 * @return {sendSignupReminder~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupReminder = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who registered at the site, but who are not participating in the current event.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {
    const currentStage = await getCurrentStage();

    if (currentStage.type !== StageTypes.SIGNUP) {
      return {
        success: `Not in signup stage. Skipping sending emails. Current stage is ${currentStage.type}`
      };
    }

    // TODO: Check if we're less than a few days (3? A week?) before signup closes.

    const eventDoc = db.collection(CollectionTypes.EVENTS).doc(EVENT);
    const eventSnap = await eventDoc.get();

    if (!eventSnap.exists) {
      return { error: "Could not find event." };
    }

    const event = eventSnap.data();
    const { emails } = event;

    if (emails.signupReminder) {
      return { success: "Emails for reminding signing up are already sent." };
    }

    const toymakersWithConsentResponse = await filterToymakersConsents("emailEventUpdates");
    if (toymakersWithConsentResponse.error) {
      return {
        error: "Failed to get participants with consents.",
        trace: toymakersWithConsentResponse.error
      };
    }
    const toymakersWithConsent = toymakersWithConsentResponse.success;

    const response = await Promise.all(
      toymakersWithConsent.map(t =>
        sendEmailTemplate({
          userIds: [t.uid],
          templateName: "signupReminder",
          templateData: {
            username: t.name || "toymaker",
            year: EVENT
          }
        })
      )
    )
      .then(responses => responses[0])
      .catch(e => ({ error: "Failed to send emails", trace: e }));

    if (response.success) {
      const emailsStatusUpdateResponse = await eventDoc
        .update({
          emails: Object.assign({}, emails, { signupReminder: true })
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch(error => ({
          error: "Failed to update emails' sent state.",
          trace: error
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails reminding to sign up." };
      }
      return {
        error: "Could not send emails reminding to sign up.",
        trace: emailsStatusUpdateResponse.error
      };
    } else {
      return {
        error: "Could not send emails reminding to sign up.",
        trace: response.error
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
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

/**
 * @namespace sendEventEnd
 * @return {sendEventEnd~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendEventEnd = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who are participating in the current event and did not yet send their gift.
   * @inner
   * @param {object} [context] - This is used by firebase, no idea what it does, I think its added automatically
   * @returns {undefined}
   */
  async context => {}
);

module.exports = {
  sendSignupStarts,
  sendSignupReminder,
  sendEventStarts,
  sendEventEnd
};
