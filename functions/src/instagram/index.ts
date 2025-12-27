import express, { Request, Response } from "express";
import axios from "axios";

const app = express();

// ENV VARS
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "dotler_instagram_webhook_2025";
const PAGE_ACCESS_TOKEN = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN!;



// Middleware
app.use(express.json());

/**
 * WEBHOOK VERIFICATION (GET)
 * This MUST respond instantly
 */
app.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification attempt", { mode, token });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.error("Webhook verification failed");
  return res.sendStatus(403);
});

/**
 * EVENT HANDLING (POST)
 */
app.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== "instagram" && body.object !== "page") {
    return res.sendStatus(404);
  }

  for (const entry of body.entry ?? []) {
    // Handle DMs
    if (entry.messaging) {
      const event = entry.messaging[0];
      const senderId = event.sender?.id;

      if (event.message && !event.message.is_echo && senderId) {
        await sendDM(senderId, event.message.text);
      }
    }

    // Handle Comments
    if (entry.changes) {
      for (const change of entry.changes) {
        if (
          change.field === "comments" &&
          change.value?.verb === "add"
        ) {
          const text = change.value.text;
          const commentId = change.value.id;

          if (
            text &&
            (text.toLowerCase().includes("price") ||
              text.toLowerCase().includes("info"))
          ) {
            await sendPrivateReply(
              commentId,
              "Check your DMs! 🚀"
            );
          }
        }
      }
    }
  }

  return res.status(200).send("EVENT_RECEIVED");
});

/**
 * HELPERS
 */
async function sendDM(recipientId: string, text: string) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: recipientId },
      message: { text }
    }
  );
}

async function sendPrivateReply(commentId: string, text: string) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { comment_id: commentId },
      message: { text }
    }
  );
}

// 🔑 THIS IS CRITICAL
export default app;
