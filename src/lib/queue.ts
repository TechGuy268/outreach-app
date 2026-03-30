import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export interface QueueMessage {
  type: "send_email" | "send_linkedin" | "scrape";
  payload: Record<string, unknown>;
}

export async function enqueueMessage(message: QueueMessage, delaySeconds?: number) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return qstash.publishJSON({
    url: `${baseUrl}/api/queue/process`,
    body: message,
    delay: delaySeconds,
  });
}

export async function enqueueBatch(messages: QueueMessage[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return qstash.batchJSON(
    messages.map((msg) => ({
      url: `${baseUrl}/api/queue/process`,
      body: msg,
    }))
  );
}

export { qstash };
