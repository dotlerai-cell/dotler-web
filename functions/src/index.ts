import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import instagramApp from "./instagram";

setGlobalOptions({ maxInstances: 10 });

// 🚫 NO secrets here (Option 2)
export const instagram = onRequest(instagramApp);

export const health = onRequest((req, res) => {
  res.send("Dotler backend running");
});
