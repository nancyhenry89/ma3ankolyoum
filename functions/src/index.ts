
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";

setGlobalOptions({ maxInstances: 10 });

export const hiddenGroupsWhoAmI = onCall(
  { region: "europe-west1" },
  (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in."
      );
    }

    return {
      authenticated: true,
      uid: request.auth.uid,
      anonymous: request.auth.token.firebase?.sign_in_provider === "anonymous"
    };
  }
);
