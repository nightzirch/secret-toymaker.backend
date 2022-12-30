const functions = require("firebase-functions");
const CollectionTypes = require("../utils/types/CollectionTypes");
const { StageTypes } = require("../config/constants");
const { getAllAuthUsers } = require("../utils/users");
const { db } = require("../config/firebase");
const { getCurrentEvent } = require("../utils/utils");
const moment = require("moment");
const { sendEmailTemplate } = require("../utils/email");

/**
 * @namespace sendSignupReminder
 * @return {sendSignupReminder~inner} - returns a scheduled function that runs 1 minute past every hour.
 */
const sendSignupReminder = functions.pubsub.schedule("1 * * * *").onRun(
  /**
   * Sends an email to everyone who registered at the site during the current event.
   * @inner
   * @returns {undefined}
   */
  async () => {
    const currentEvent = await getCurrentEvent();

    if (!currentEvent) {
      return { success: "There are no events active." };
    }

    const eventDoc = db
      .collection(CollectionTypes.EVENTS)
      .doc(currentEvent.year);

    if (currentEvent.stage.type !== StageTypes.SIGNUP) {
      return {
        success: `Not in signup stage. Skipping sending emails. Current stage is ${currentEvent.stage.type}`,
      };
    }

    const now = new Date();
    if (moment(currentEvent.eventStart).diff(now, "days") > 7) {
      return {
        success:
          "There are more than a week until the event starts. Waiting with reminding people.",
      };
    }

    if (currentEvent.emails.signupReminder) {
      return {
        success: "Emails for reminding signing up are already sent.",
      };
    }

    const authUsers = await getAllAuthUsers();
    let authUsersCreatedDuringEvent = [];

    if (authUsers && authUsers.length > 0) {
      // We only want users created during event.
      // The current event is defined by the timeframe between 7 days prior to signupStart and eventStart.
      authUsersCreatedDuringEvent = authUsers.filter((u) => {
        if (u.metadata && u.metadata.creationTime) {
          const userCreated = u.metadata.creationTime;
          const signupStart = moment(currentEvent.signupStart).subtract(
            7,
            "days"
          );
          return moment(userCreated).isBetween(
            signupStart,
            currentEvent.eventStart
          );
        }
        return false;
      });
    }

    // TODO: Fetch all previous participants, filter out those who currently participate, and add them to the email

    const response = await Promise.all(
      authUsersCreatedDuringEvent
        .filter((u) => u.uid && u.email)
        .map((u) =>
          sendEmailTemplate({
            userIds: [u.uid],
            templateName: "signupReminder",
            templateData: {
              eventName: currentEvent.name,
              username: u.displayName || "Toymaker",
              year: currentEvent.year,
            },
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
          emails: Object.assign({}, currentEvent.emails, {
            signupReminder: true,
          }),
        })
        .then(() => ({ success: "Successfully updated emails's sent state." }))
        .catch((error) => ({
          error: "Failed to update emails' sent state.",
          trace: error,
        }));

      if (emailsStatusUpdateResponse.success) {
        return { success: "Successfully sent emails reminding to sign up." };
      }
      return {
        error: "Could not send emails reminding to sign up.",
        trace: emailsStatusUpdateResponse.error,
      };
    } else {
      return {
        error: "Could not send emails reminding to sign up.",
        trace: response.error,
      };
    }
  }
);

module.exports = { sendSignupReminder };
